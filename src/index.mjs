import { TEST_DOCUMENT_ID, TEST_FORM_ID, MODE, TIME_ZONE, EVIDENCE } from './config.mjs';
import { paragraphsFromGoogleDoc, extractTaskBlock } from './parser.mjs';
import { generatePreview, STATES } from './report.mjs';

const json=(v,status=200)=>new Response(JSON.stringify(v,null,2),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex'}});
const forbidden=()=>json({error:'Unauthorized'},401);
const safeError=(e)=>json({error:e instanceof Error?e.message:String(e)},400);
async function getDocument(env){
  if(!env.GOOGLE_DOCS_ACCESS_TOKEN) throw new Error('Google Docs OAuth access token not configured. No document fetch attempted.');
  const api='https://docs.googleapis.com/v1/documents/'+TEST_DOCUMENT_ID+'?includeTabsContent=true';
  const r=await fetch(api,{headers:{Authorization:'Bearer '+env.GOOGLE_DOCS_ACCESS_TOKEN}});
  if(!r.ok) throw new Error('Google Docs request failed ('+r.status+'); refresh OAuth permissions');
  return r.json();
}
function authorised(request,env){
  if(!env.ADMIN_TOKEN) return false;
  return (request.headers.get('Authorization')??'') === 'Bearer '+env.ADMIN_TOKEN;
}
async function ensureDb(env){if(!env.DB) throw new Error('D1 binding DB not configured.'); return env.DB;}
async function getOverrides(db,date,slot){
  const rows=await db.prepare('SELECT task_index,status FROM task_status WHERE report_date=?1 AND slot=?2').bind(date,slot).all();
  return Object.fromEntries((rows.results??[]).map(x=>[String(x.task_index),x.status]));
}
async function handler(request,env){
  const u=new URL(request.url);
  if(u.pathname==='/health'&&request.method==='GET') return json({name:'vephla-report-agent',phase:1,mode:MODE,productionEnabled:false,sendingEnabled:false,timeZone:TIME_ZONE});
  if(!authorised(request,env)) return forbidden();
  if(u.pathname==='/config'&&request.method==='GET') return json({mode:MODE,documentId:TEST_DOCUMENT_ID,formId:TEST_FORM_ID,evidence:EVIDENCE,formSubmitting:false,emailSending:false});
  if(u.pathname==='/preview'&&request.method==='GET'){
    const date=u.searchParams.get('date')??'';const slot=Number(u.searchParams.get('slot'));
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||![1,2,3,4].includes(slot)) throw new Error('Use /preview?date=2026-11-17&slot=2');
    const doc=await getDocument(env);
    const db=await ensureDb(env);
    const block=extractTaskBlock(paragraphsFromGoogleDoc(doc),date,slot);
    return json(generatePreview(block,await getOverrides(db,date,slot)));
  }
  if(u.pathname==='/status'&&request.method==='POST'){
    const {date,slot,taskIndex,status}=await request.json();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date??'')||![1,2,3,4].includes(slot)||!Number.isSafeInteger(taskIndex)||taskIndex<0||!STATES.includes(status)) throw new Error('Invalid status input');
    const db=await ensureDb(env);
    await db.prepare("INSERT INTO task_status(report_date,slot,task_index,status,updated_at) VALUES (?1,?2,?3,?4,datetime('now')) ON CONFLICT(report_date,slot,task_index) DO UPDATE SET status=excluded.status,updated_at=excluded.updated_at")
      .bind(date,slot,taskIndex,status).run();
    return json({saved:true,date,slot,taskIndex,status,submitted:false});
  }
  if(u.pathname==='/runs'&&request.method==='GET'){
    const db=await ensureDb(env);
    const result=await db.prepare('SELECT id,report_date,slot,stage,created_at FROM report_runs ORDER BY created_at DESC LIMIT 50').all();
    return json({runs:result.results??[]});
  }
  return json({error:'Not found or method not allowed'},404);
}
export default {
  async fetch(request,env){try{return await handler(request,env)}catch(e){return safeError(e)}},
  async scheduled(){
    // PHASE 1 SAFETY LOCK: No submissions, email, or scheduled actions.
    console.log(JSON.stringify({event:'cron-intentionally-disabled',mode:MODE,timeZone:TIME_ZONE,evidence:EVIDENCE}));
  }
};
