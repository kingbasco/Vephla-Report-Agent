import test from 'node:test';
import assert from 'node:assert/strict';
import {paragraphsFromGoogleDoc,extractTaskBlock} from '../src/parser.mjs';
import {currentWorkday,previewSelection} from '../src/workday.mjs';
const p=text=>({text});
const day='17th NOV 2026 – WORK DAY 26';
test('nested tab, nested table, source indexes and links are preserved',()=>{
 const paragraph={startIndex:42,paragraph:{bullet:{nestingLevel:1},elements:[{textRun:{content:'Read brief',textStyle:{link:{url:'https://example.org/brief'}}}}]}};
 const table={table:{tableRows:[{tableCells:[{content:[paragraph]}]}]}};
 const doc={tabs:[{tabProperties:{tabId:'parent'},childTabs:[{tabProperties:{tabId:'t.henz7cnke67i'},documentTab:{body:{content:[table]}}}]}]};
 const lines=paragraphsFromGoogleDoc(doc);assert.equal(lines[0].sourceIndex,42);assert.equal(lines[0].nestingLevel,1);assert.equal(lines[0].links[0].url,'https://example.org/brief');
 assert.throws(()=>paragraphsFromGoogleDoc({tabs:[]}),/missing/);
});
test('all task boundaries exclude titled task headers and other dates',()=>{
 const lines=[day,'Task 1 - prior day report','Read prior record','Task 2','Review brief','Task 3','Review afternoon work','Task 4','Review final work','18th NOV 2026 - WORK DAY 27','Task 2','Other day'];
 for(const [slot,expected] of [[1,'Read prior record'],[2,'Review brief'],[3,'Review afternoon work'],[4,'Review final work']]) assert.deepEqual(extractTaskBlock(lines.map(p),'2026-11-17',slot).tasks,[expected]);
});
test('repeated dates, repeated tasks and empty assignments require review',()=>{
 for(const lines of [[day,'Task 2','Review',day,'Task 2','Again'],[day,'Task 2','Review','Task 2','Again'],[day,'Task 2','RANGE TIME: 8am-noon','Task 3','Other']]) assert.throws(()=>extractTaskBlock(lines.map(p),'2026-11-17',2));
});
test('WAT midnight and preview selection reject future and ambiguous work periods',()=>{
 assert.equal(currentWorkday(new Date('2026-11-16T23:30:00Z')).date,'2026-11-17');
 const now=new Date('2026-11-17T09:00:00Z');
 assert.deepEqual(previewSelection(new URLSearchParams(),now),{date:'2026-11-17',slot:2});
 assert.throws(()=>previewSelection(new URLSearchParams('date=2026-11-18&slot=2'),now),/Future/);
 assert.throws(()=>previewSelection(new URLSearchParams('date=2026-11-16'),now),/Specify/);
 assert.throws(()=>previewSelection(new URLSearchParams(),new Date('2026-11-21T09:00:00Z')),/Specify/);
 assert.throws(()=>previewSelection(new URLSearchParams(),new Date('2026-11-17T16:00:00Z')),/Specify/);
});
