import test from 'node:test';
import assert from 'node:assert/strict';
import {identifyTasks} from '../src/task-identity.mjs';
import {generatePreview} from '../src/report.mjs';
import {extractTaskBlock} from '../src/parser.mjs';
const block=tasks=>({date:'2026-11-17',taskNumber:2,tasks});
test('confirmed status follows content after reordering, not paragraph index',async()=>{
 const before=await identifyTasks(block(['Review brief','Update schedule']));
 const after=await identifyTasks(block(['New assignment','Update schedule','Review brief']));
 const report=generatePreview(after,{[before.taskIds[0]]:'completed'});
 assert.deepEqual(report.items.map(x=>x.status),['unverified','unverified','completed']);
});
test('wording/context/date changes and duplicate instructions cannot inherit completion',async()=>{
 const before=await identifyTasks(block(['Review brief']));const updates={[before.taskIds[0]]:'completed'};
 for(const value of [block(['Build prototype']),{...block(['Review brief']),date:'2026-11-16'},{...block(['Review brief']),taskLines:[{text:'Review brief',context:'Different project'}]},block(['Review brief','Review brief'])]){
  const report=generatePreview(await identifyTasks(value),updates);assert.ok(report.items.every(x=>x.status==='unverified'));
 }
});
test('headings and role notes are context; brief completion does not complete the prototype',async()=>{
 const parsed=extractTaskBlock(['17th NOV 2026 - WORK DAY 26','Task 2','PROJECT ALPHA - Prototype due soon','Review project brief','Build final prototype','CCR Lead: test@example.org','Task 3','Later'].map(text=>({text})),'2026-11-17',2);
 assert.deepEqual(parsed.tasks,['Review project brief','Build final prototype']);
 const identified=await identifyTasks(parsed);
 const report=generatePreview(identified,{[identified.taskIds[0]]:'completed'});
 assert.equal(report.items[1].status,'unverified');assert.match(report.items[0].context,/PROJECT ALPHA/);assert.equal(report.evidence,'NIL');
});
