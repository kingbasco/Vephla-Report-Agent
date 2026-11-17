import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorker} from '../src/index.mjs';
import {TEST_DOCUMENT_ID,NOVEMBER_TAB_ID} from '../src/config.mjs';
const document={documentId:TEST_DOCUMENT_ID,tabs:[{tabProperties:{tabId:NOVEMBER_TAB_ID},documentTab:{body:{content:['17th NOV 2026 - WORK DAY 26','Task 2','Review brief','Task 3','Later'].map((content,i)=>({startIndex:i,paragraph:{elements:[{textRun:{content}}]}}))}}}]};
const request=(path,options={})=>new Request('https://internal.invalid'+path,{...options,headers:{Authorization:'Bearer test-admin',...options.headers}});
const clock=()=>new Date('2026-11-17T10:00:00Z');
test('health and config are safe; all other routes require admin before reading',async()=>{
 let reads=0;const worker=createWorker({clock,documentReader:async()=>{reads++;return document;}});
 assert.equal((await worker.fetch(new Request('https://internal.invalid/health'),{})).status,200);
 for(const path of ['/preview?date=2026-11-17&slot=2','/config','/runs','/status']) assert.equal((await worker.fetch(new Request('https://internal.invalid'+path),{ADMIN_TOKEN:'test-admin'})).status,401);
 assert.equal(reads,0);
 const response=await worker.fetch(request('/config'),{ADMIN_TOKEN:'test-admin'});assert.equal(response.status,200);assert.ok(!(await response.text()).includes('test-admin'));
});
test('missing Google credentials yields a redacted 503 and no fake fixture fallback',async()=>{
 const worker=createWorker({clock});const response=await worker.fetch(request('/preview?date=2026-11-17&slot=2&fixture=true'),{ADMIN_TOKEN:'test-admin'});
 assert.equal(response.status,503);assert.equal((await response.json()).code,'google_auth_not_configured');
});
test('preview and status validate source identities and ignore legacy index overrides',async()=>{
 const statuses=new Map();let writes=0;
 const env={ADMIN_TOKEN:'test-admin',DB:{
  prepare(sql) {
   assert.match(sql,/task_status_v2/);
   return {bind(...values) {return {
    all:async()=>({results:[...statuses].map(([task_id,status])=>({task_id,status}))}),
    run:async()=>{writes++;statuses.set(values[2],values[3]);}
   };}};
  }
 }};
 const worker=createWorker({clock,documentReader:async()=>document});
 const preview=async()=>await (await worker.fetch(request('/preview?date=2026-11-17&slot=2'),env)).json();
 const first=await preview();assert.equal(first.items[0].status,'unverified');assert.equal(first.submitted,false);assert.equal(first.evidence,'NIL');
 const change=async taskId=>worker.fetch(request('/status',{method:'POST',body:JSON.stringify({date:'2026-11-17',slot:2,taskId,status:'completed'})}),env);
 assert.equal((await change('a'.repeat(64))).status,400);assert.equal(writes,0);
 assert.equal((await change(first.items[0].taskId)).status,200);assert.equal(writes,1);assert.equal((await preview()).items[0].status,'completed');
});
test('future and invalid dates are rejected before the Google call; private errors are hidden',async()=>{
 let reads=0;const worker=createWorker({clock,documentReader:async()=>{reads++;throw Error('private database/source details');}});
 for(const date of ['2026-02-30','2026-11-18'])assert.equal((await worker.fetch(request('/preview?date='+date+'&slot=2'),{ADMIN_TOKEN:'test-admin'})).status,400);
 assert.equal(reads,0);
 const r=await worker.fetch(request('/preview?date=2026-11-17&slot=2'),{ADMIN_TOKEN:'test-admin'});assert.ok(!(await r.text()).includes('private database'));
});
