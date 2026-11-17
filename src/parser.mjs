import { NOVEMBER_TAB_ID } from './config.mjs';
import { validateDate } from './workday.mjs';

function paragraphsFrom(elements, output = []) {
  if (!Array.isArray(elements)) throw new Error('Malformed charter content');
  for (const element of elements) {
    if (element.paragraph) {
      const runs = element.paragraph.elements ?? [];
      output.push({
        text: runs.map(e => e.textRun?.content ?? '').join('').normalize('NFKC').replace(/\u00a0/g, ' ').trim(),
        sourceIndex: element.startIndex ?? null,
        nestingLevel: element.paragraph.bullet?.nestingLevel ?? null,
        style: element.paragraph.paragraphStyle?.namedStyleType ?? 'NORMAL_TEXT',
        links: runs.filter(e => e.textRun?.textStyle?.link?.url).map(e => ({text: e.textRun.content.trim(), url: e.textRun.textStyle.link.url}))
      });
    }
    if (element.table) for (const row of element.table.tableRows ?? [])
      for (const cell of row.tableCells ?? []) paragraphsFrom(cell.content, output);
  }
  return output;
}
export function paragraphsFromGoogleDoc(document, tabId = NOVEMBER_TAB_ID) {
  const matches = [];
  function visit(tabs) { for (const tab of tabs ?? []) { if ((tab.tabProperties?.tabId ?? tab.tabId) === tabId) matches.push(tab); visit(tab.childTabs); } }
  visit(document?.tabs);
  if (matches.length !== 1) throw new Error('Required charter tab missing or ambiguous: ' + tabId);
  return paragraphsFrom(matches[0].documentTab?.body?.content ?? matches[0].body?.content ?? []);
}
const dayHeader = /\b\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4}\s*[-–—:]?\s*WORK\s*DAY\b/i;
const taskHeader = /^Task\s+(\d+)\b/i;
function datePattern(date) {
  validateDate(date);
  const [year,month,day] = date.split('-').map(Number);
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return new RegExp('\\b0?' + day + '(?:st|nd|rd|th)?\\s+' + months[month - 1] + '[A-Z]*\\s+' + year + '\\b', 'i');
}
export function extractTaskBlock(paragraphs, date, taskNumber) {
  if (![1,2,3,4].includes(Number(taskNumber))) throw new Error('slot must be 1-4');
  const pattern = datePattern(date);
  const days = paragraphs.map((p,i) => dayHeader.test(p.text) && pattern.test(p.text) ? i : -1).filter(i => i >= 0);
  if (days.length === 0) throw new Error('Charter day not found: ' + date);
  if (days.length !== 1) throw new Error('Ambiguous repeated charter date; review source');
  const dayStart = days[0];
  let dayEnd = paragraphs.findIndex((p,i) => i > dayStart && dayHeader.test(p.text));
  if (dayEnd < 0) dayEnd = paragraphs.length;
  const starts = [];
  for (let i = dayStart + 1; i < dayEnd; i++) if (Number(paragraphs[i].text.match(taskHeader)?.[1]) === Number(taskNumber)) starts.push(i);
  if (starts.length !== 1) throw new Error('Task ' + taskNumber + ' missing or ambiguous for ' + date);
  const taskStart = starts[0];
  let taskEnd = paragraphs.findIndex((p,i) => i > taskStart && i < dayEnd && taskHeader.test(p.text));
  if (taskEnd < 0) taskEnd = dayEnd;
  const lines = paragraphs.slice(taskStart + 1, taskEnd).filter(p => p.text);
  const instructions = /^(RANGE TIME|LOG TIME|Access\s+using|Should you run|Clock in|LUNCH BREAK|Assessor)\b/i;
  const roleNote = /^(CCR\s+Lead|Assessor|Active Cohorts)\s*:/i;
  const heading = text => /^[A-Z][A-Z\s.]+(?:[:–—-]|$)/.test(text) && !/^(RANGE TIME|LOG TIME)/.test(text);
  const contextLines = [];
  let context = '';
  const taskLines = [];
  for (const line of lines) {
    if (instructions.test(line.text) || roleNote.test(line.text)) { contextLines.push({...line,kind:'instruction'}); continue; }
    if (heading(line.text)) { context = line.text; contextLines.push({...line,kind:'heading'}); continue; }
    if (line.text.length > 2) taskLines.push({...line,context,kind:line.nestingLevel != null ? 'substep' : 'assignment'});
  }
  if (!taskLines.length) throw new Error('Task section has no assignments; no report generated');
  return {date, taskNumber: Number(taskNumber), dateHeader: paragraphs[dayStart].text, lines, tasks: taskLines.map(p => p.text), taskLines, contextLines, evidence: 'NIL'};
}
