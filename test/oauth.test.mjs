import test from 'node:test';
import assert from 'node:assert/strict';
import {createDocumentReader, DOCS_SCOPE} from '../src/google-docs.mjs';
import {TEST_DOCUMENT_ID} from '../src/config.mjs';
const env = () => ({GOOGLE_OAUTH_CLIENT_ID:'synthetic-client',GOOGLE_OAUTH_CLIENT_SECRET:'synthetic-secret',GOOGLE_OAUTH_REFRESH_TOKEN:'synthetic-refresh'});
const token = (extra={}) => Response.json({access_token:'synthetic-access',token_type:'Bearer',expires_in:3600,scope:DOCS_SCOPE,...extra});
const doc = () => Response.json({documentId:TEST_DOCUMENT_ID,tabs:[]});
test('refresh, cache, expiry, concurrent requests and credential replacement', async () => {
 let time=0, refreshes=0, reads=0;
 const bindings=env();
 const read=createDocumentReader({now:()=>time,fetcher:async(url,options)=>{
  if(url.includes('/token')) { refreshes++; assert.equal(options.method,'POST'); assert.equal(options.body.get('grant_type'),'refresh_token'); return token(); }
  reads++; assert.equal(url,`https://docs.googleapis.com/v1/documents/${TEST_DOCUMENT_ID}?includeTabsContent=true`); assert.equal(options.headers.Authorization,'Bearer synthetic-access'); return doc();
 }});
 await Promise.all([read(bindings),read(bindings)]);assert.equal(refreshes,1);
 await read(bindings);assert.equal(refreshes,1);
 time=3600000;await read(bindings);assert.equal(refreshes,2);
 bindings.GOOGLE_OAUTH_REFRESH_TOKEN='rotated-synthetic';await read(bindings);assert.equal(refreshes,3);assert.equal(reads,5);
});
test('missing credentials never fetch; legacy access token is not used',async()=>{
 let calls=0;const read=createDocumentReader({fetcher:()=>{calls++;}});
 await assert.rejects(read({GOOGLE_DOCS_ACCESS_TOKEN:'legacy'}),{code:'google_auth_not_configured'});assert.equal(calls,0);
});
test('revoked grant is redacted and can recover after secret replacement',async()=>{
 let calls=0;const bindings=env();const read=createDocumentReader({fetcher:async url=>url.includes('/token')?(++calls===1?Response.json({error:'invalid_grant',error_description:'PRIVATE DATA'},{status:400}):token()):doc()});
 await assert.rejects(read(bindings),e=>e.code==='google_reauthorization_required'&&!e.message.includes('PRIVATE'));
 await read(bindings);assert.equal(calls,2);
});
test('401 refreshes once; repeated failure stops without returning assignments',async()=>{
 let refreshes=0,reads=0;const read=createDocumentReader({fetcher:async url=>{if(url.includes('/token')){refreshes++;return token();}reads++;return new Response('',{status:401});}});
 await assert.rejects(read(env()),{code:'google_docs_failed'});assert.equal(refreshes,2);assert.equal(reads,2);
});
test('403 and unexpected document identity fail closed',async()=>{
 for(const response of [()=>new Response('',{status:403}),()=>Response.json({documentId:'unapproved',tabs:[]})]){
  const read=createDocumentReader({fetcher:async url=>url.includes('/token')?token():response()});
  await assert.rejects(read(env()),e=>['google_document_access_denied','google_document_invalid'].includes(e.code));
 }
});
test('broad grants, rotated refresh tokens and malformed OAuth responses are rejected',async()=>{
 for(const extra of [{scope:undefined},{scope:'https://www.googleapis.com/auth/drive'}, {refresh_token:'new-refresh'}, {expires_in:0}, {access_token:null}]){
  const read=createDocumentReader({fetcher:async()=>token(extra)});await assert.rejects(read(env()));
 }
});
test('network and upstream errors do not leak credentials or response bodies',async()=>{
 for(const fetcher of [async()=>{throw new Error('synthetic-secret');}, async()=>new Response('synthetic-secret',{status:500})]) {
  await assert.rejects(createDocumentReader({fetcher})(env()),e=>!e.message.includes('synthetic-secret'));
 }
});
