import {readFileSync} from 'node:fs';
const account=process.env.CLOUDFLARE_ACCOUNT_ID;
const token=process.env.CLOUDFLARE_API_TOKEN;
if(!account||!token)throw Error('Cloudflare account ID and restricted API token are required as environment secrets');
if(account!=='e6279978097c9f10b46e7eb23e90d34f')throw Error('Cloudflare account mismatch: refusing deployment outside the approved Primary account');
const workerName='vephla-report-agent-test';
const revision=process.env.GITHUB_SHA||process.env.BUILD_COMMIT;
if(!/^[a-f0-9]{40}$/.test(revision??''))throw Error('Exact tested commit SHA required');
const base='https://api.cloudflare.com/client/v4/accounts/'+account;
const headers={Authorization:'Bearer '+token};
async function get(path){
 const r=await fetch(base+path,{headers});
 if(!r.ok)throw Error('Cloudflare read failed HTTP '+r.status+' '+path);
 const j=await r.json();
 if(!j.success)throw Error(JSON.stringify(j.errors));
 return j.result;
}
const [existing,subdomain,cron]=await Promise.all([
 get('/workers/scripts/'+workerName+'/settings'),
 get('/workers/scripts/'+workerName+'/subdomain'),
 get('/workers/scripts/'+workerName+'/schedules')
]);
if(subdomain.enabled||subdomain.previews_enabled)throw Error('Refusing deployment: Worker is publicly accessible');
if(cron.schedules?.length)throw Error('Refusing deployment: unexpected Cron Triggers present');
const bindings=existing.bindings||[];
if(!bindings.some(b=>b.type==='d1'&&b.name==='DB'&&((b.database_id||b.id)==='9dc42a9e-7b87-43d1-8996-e777135438a3')))
 throw Error('D1 binding missing or incorrect');
if(!bindings.some(b=>b.type==='secret_text'&&b.name==='ADMIN_TOKEN'))throw Error('Admin secret missing');
const schema=await fetch(base+'/d1/database/9dc42a9e-7b87-43d1-8996-e777135438a3/query',{method:'POST',headers:{...headers,'content-type':'application/json'},body:JSON.stringify({sql:"SELECT name FROM sqlite_master WHERE type='table' AND name='task_status_v2'"})});
const tables=await schema.json();
if(!schema.ok||!tables.success||!tables.result?.[0]?.results?.length)throw Error('Apply additive migration 0002 to the isolated test DB before deployment');
const data=readFileSync('dist/worker.mjs');
const form=new FormData();
form.append('metadata',new Blob([JSON.stringify({main_module:'worker.mjs',compatibility_date:'2026-11-17',keep_bindings:['d1','secret_text'],bindings:[{name:'BUILD_COMMIT',type:'plain_text',text:revision}]})],{type:'application/json'}));
form.append('worker.mjs',new Blob([data],{type:'application/javascript+module'}),'worker.mjs');
const result=await fetch(base+'/workers/scripts/'+workerName,{method:'PUT',headers,body:form});
const message=await result.text();
if(!result.ok)throw Error('Deployment failed HTTP '+result.status+': '+message.slice(0,1000));
const after=await Promise.all([get('/workers/scripts/'+workerName+'/subdomain'),get('/workers/scripts/'+workerName+'/schedules')]);
if(after[0].enabled||after[0].previews_enabled||after[1].schedules?.length)throw Error('Post-deployment isolation check failed');
console.log('Test Worker deployed. No public URL, scheduled jobs, form submissions or emails.');
