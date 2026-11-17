import { TEST_DOCUMENT_ID, TEST_FORM_ID, MODE, TIME_ZONE, EVIDENCE } from './config.mjs';
import { paragraphsFromGoogleDoc, extractTaskBlock } from './parser.mjs';
import { generatePreview, STATES } from './report.mjs';
import { readDocument, DocsError } from './google-docs.mjs';
import { identifyTasks } from './task-identity.mjs';
import { previewSelection, validateDate } from './workday.mjs';

const json=(v,status=200)=>new Response(JSON.stringify(v,null,2),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex','x-content-type-options':'nosniff'}});
const forbidden=()=>json({error:'Unauthorized'},401);
const safeError=(e)=>e instanceof DocsError ? json({error:e.message,code:e.code},e.status) : json({error:'Request could not be processed. Check the date, slot, charter structure and database configuration.'},400);
function authorised(request,env){
  if(!env.ADMIN_TOKEN) return false;
  return (request.headers.get('Authorization')??'') === 'Bearer '+env.ADMIN_TOKEN;
}
async function ensureDb(env){if(!env.DB) throw new Error('D1 binding DB not configured.'); return env.DB;}
async function getOverrides(db,date,slot){
  const rows=await db.prepare('SELECT task_id,status FROM task_status_v2 WHERE report_date=?1 AND slot=?2').bind(date,slot).all();
  return Object.fromEntries((rows.results??[]).map(x=>[x.task_id,x.status]));
}
async function handler(request,env,documentReader,clock){
  const u=new URL(request.url);
  if(u.pathname==='/health'&&request.method==='GET') return json({name:'vephla-report-agent',phase:2,mode:MODE,productionEnabled:false,sendingEnabled:false,timeZone:TIME_ZONE,buildRevision:env.BUILD_COMMIT??null});
  if(!authorised(request,env)) return forbidden();
  if(u.pathname==='/config'&&request.method==='GET') return json({mode:MODE,documentId:TEST_DOCUMENT_ID,formId:TEST_FORM_ID,evidence:EVIDENCE,formSubmitting:false,emailSending:false,googleDocsReaderConfigured:['GOOGLE_OAUTH_CLIENT_ID','GOOGLE_OAUTH_CLIENT_SECRET','GOOGLE_OAUTH_REFRESH_TOKEN'].every(name=>!!env[name])});
  if(u.pathname==='/preview'&&request.method==='GET'){
    const {date,slot}=previewSelection(u.searchParams,clock());
    const doc=await documentReader(env);
    const db=await ensureDb(env);
    const block=await identifyTasks(extractTaskBlock(paragraphsFromGoogleDoc(doc),date,slot));
    return json(generatePreview(block,await getOverrides(db,date,slot)));
  }
  if(u.pathname==='/status'&&request.method==='POST'){
    const {date,slot,taskId,status}=await request.json();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date??'')||![1,2,3,4].includes(slot)||typeof taskId!=='string'||!(/^[a-f0-9]{64}$/.test(taskId))||!STATES.includes(status)) throw new Error('Invalid status input');
    validateDate(date);
    previewSelection(new URLSearchParams({date,slot:String(slot)}),clock());
    const block=await identifyTasks(extractTaskBlock(paragraphsFromGoogleDoc(await documentReader(env)),date,slot));
    if(!block.taskIds.includes(taskId)||block.ambiguousIds.includes(taskId)) throw new Error('Task identity missing, changed or ambiguous; refresh the preview');
    const db=await ensureDb(env);
    await db.prepare("INSERT INTO task_status_v2(report_date,slot,task_id,status,updated_at) VALUES (?1,?2,?3,?4,datetime('now')) ON CONFLICT(report_date,slot,task_id) DO UPDATE SET status=excluded.status,updated_at=excluded.updated_at")
      .bind(date,slot,taskId,status).run();
    return json({saved:true,date,slot,taskId,status,submitted:false});
  }
  if(u.pathname==='/runs'&&request.method==='GET'){
    const db=await ensureDb(env);
    const result=await db.prepare('SELECT id,report_date,slot,stage,created_at FROM report_runs ORDER BY created_at DESC LIMIT 50').all();
    return json({runs:result.results??[]});
  }
  return json({error:'Not found or method not allowed'},404);
}
export function createWorker({documentReader=readDocument,clock=()=>new Date()}={}) { return {
  async fetch(request,env){try{return await handler(request,env,documentReader,clock)}catch(e){return safeError(e)}},
  async scheduled(){
    // PHASE 1 SAFETY LOCK: No submissions, email, or scheduled actions.
    console.log(JSON.stringify({event:'cron-intentionally-disabled',mode:MODE,timeZone:TIME_ZONE,evidence:EVIDENCE}));
  }
}; }
export default createWorker();
