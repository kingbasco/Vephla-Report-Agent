import test from 'node:test';
import assert from 'node:assert/strict';
import {extractTaskBlock,paragraphsFromGoogleDoc} from '../src/parser.mjs';
import {generatePreview} from '../src/report.mjs';
import {TEST_DOCUMENT_ID,TEST_FORM_ID} from '../src/config.mjs';
const p=text=>({text});
test('extracts Task 2 on November 17 and stops at Task 3',()=>{
 const lines=['16th NOV 2026 - WORK DAY 25','Task 2','Prior item','Task 3','Next item','17th NOV 2026 - WORK DAY 26','Task 1 - Clock in','Task 2','RANGE TIME : 8 am - 12 Noon','Review COO and HR remarks','Review Project Uni Flex','Task 3','After noon'];
 const b=extractTaskBlock(lines.map(p),'2026-11-17',2);
 assert.deepEqual(b.tasks,['Review COO and HR remarks','Review Project Uni Flex']);
 assert.equal(b.evidence,'NIL');
});
test('all unconfirmed work stays unverified',()=>{
 const b={date:'2026-11-17',taskNumber:2,tasks:['Review COO','Review Uni Flex']};
 const result=generatePreview(b);
 assert.deepEqual(result.items.map(x=>x.status),['unverified','unverified']);
 assert.equal(result.evidence,'NIL');
 assert.equal(result.submitted,false);
 assert.equal(result.emailSent,false);
 assert.equal(result.testDocumentId,TEST_DOCUMENT_ID);
 assert.equal(result.testFormId,TEST_FORM_ID);
});
test('only explicitly changed task is completed',()=>{
 const result=generatePreview({date:'2026-11-17',taskNumber:2,tasks:['Task A','Task B']},{'0':'completed'});
 assert.deepEqual(result.items.map(x=>x.status),['completed','unverified']);
});
test('retains links from Google Docs tab',()=>{
 const doc={tabs:[{tabProperties:{tabId:'t.henz7cnke67i'},documentTab:{body:{content:[{paragraph:{elements:[{textRun:{content:'Review brief here',textStyle:{link:{url:'https://example.org'}}}}]}}]}}}]};
 assert.equal(paragraphsFromGoogleDoc(doc)[0].links[0].url,'https://example.org');
});
test('invalid dates and slots are rejected',()=>{
 assert.throws(()=>extractTaskBlock([], '2026-02-30',2),/Invalid calendar date/);
 assert.throws(()=>extractTaskBlock([], '2026-11-17',5),/slot must/);
});
