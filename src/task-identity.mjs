import {TEST_DOCUMENT_ID, NOVEMBER_TAB_ID} from './config.mjs';
// Content identity deliberately changes after wording/context edits. Never move status by index.
export async function identifyTasks(block) {
  const normalize = text => text.normalize('NFKC').replace(/\s+/g,' ').trim();
  const records = block.taskLines ?? block.tasks.map(text=>({text}));
  const ids = await Promise.all(records.map(async line => {
    const key = [TEST_DOCUMENT_ID,NOVEMBER_TAB_ID,block.date,block.taskNumber,line.context ?? '',normalize(line.text)].join('\n');
    const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));
    return Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,'0')).join('');
  }));
  return {...block,taskIds:ids,ambiguousIds:ids.filter((id,i)=>ids.indexOf(id)!==i)};
}
