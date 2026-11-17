import { NOVEMBER_TAB_ID } from './config.mjs';

function paragraphsFrom(elements, output = []) {
  for (const element of elements ?? []) {
    if (element.paragraph) {
      output.push({
        text: (element.paragraph.elements ?? []).map(e => e.textRun?.content ?? '').join('').trim(),
        style: element.paragraph.paragraphStyle?.namedStyleType ?? 'NORMAL_TEXT',
        links: (element.paragraph.elements ?? []).filter(e => e.textRun?.textStyle?.link?.url)
          .map(e => ({ text: e.textRun.content.trim(), url: e.textRun.textStyle.link.url }))
      });
    }
    if (element.table) for (const row of element.table.tableRows ?? [])
      for (const cell of row.tableCells ?? []) paragraphsFrom(cell.content, output);
  }
  return output;
}

export function paragraphsFromGoogleDoc(document, tabId = NOVEMBER_TAB_ID) {
  const tab = document.tabs?.find(t => (t.tabProperties?.tabId ?? t.tabId) === tabId);
  if (!tab) throw new Error('Required charter tab missing: ' + tabId);
  return paragraphsFrom(tab.documentTab?.body?.content ?? tab.body?.content ?? []);
}

function datePattern(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('date must be YYYY-MM-DD');
  const [year, month, day] = date.split('-').map(Number);
  const expected = new Date(date + 'T00:00:00Z');
  if (Number.isNaN(expected.getTime()) || expected.getUTCFullYear() !== year || expected.getUTCMonth()+1 !== month || expected.getUTCDate() !== day)
    throw new Error('Invalid calendar date');
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return new RegExp('\\b0?' + day + '(?:st|nd|rd|th)?\\s+' + months[month - 1] + '[A-Z]*\\s+' + year + '\\b', 'i');
}

export function extractTaskBlock(paragraphs, date, taskNumber) {
  if (![1,2,3,4].includes(Number(taskNumber))) throw new Error('slot must be 1-4');
  const pattern = datePattern(date);
  let dayStart = -1;
  for (let i = 0; i < paragraphs.length; i++) {
    if (pattern.test(paragraphs[i].text) && /WORK DAY/i.test(paragraphs[i].text)) dayStart = i;
  }
  if (dayStart < 0) throw new Error('Charter day not found: ' + date);
  const taskRegex = /^Task\s+([1-4])\b/i;
  let taskStart = -1;
  for (let i = dayStart + 1; i < paragraphs.length; i++) {
    const line = paragraphs[i].text;
    if (/\b\d{4}\s*-\s*WORK DAY\b/i.test(line)) break;
    const match = line.match(taskRegex);
    if (match && Number(match[1]) === Number(taskNumber)) { taskStart = i; break; }
  }
  if (taskStart < 0) throw new Error('Task ' + taskNumber + ' missing for ' + date);
  let taskEnd = paragraphs.length;
  for (let i = taskStart + 1; i < paragraphs.length; i++) {
    if (taskRegex.test(paragraphs[i].text) || /\b\d{4}\s*-\s*WORK DAY\b/i.test(paragraphs[i].text)) { taskEnd = i; break; }
  }
  const lines = paragraphs.slice(taskStart, taskEnd).filter(p => p.text);
  const instructions = /^(RANGE TIME|LOG TIME|Access\s+using|Should you run|Clock in|LUNCH BREAK|Assessor)\b/i;
  const tasks = lines.filter(p => !/^Task [1-4]$/i.test(p.text) && !instructions.test(p.text))
    .map(p => p.text).filter(t => t.length > 2);
  return { date, taskNumber: Number(taskNumber), dateHeader: paragraphs[dayStart].text, lines, tasks, evidence: 'NIL' };
}
