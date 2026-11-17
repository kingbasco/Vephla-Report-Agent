import {readFileSync} from 'node:fs';
import {TEST_DOCUMENT_ID,TEST_FORM_ID,EVIDENCE,MODE} from '../src/config.mjs';
const expectedDoc='14lqjOS0Q1_luNPUID2tlhgb0FJS0DfZGxtb6xmb0vPU';
const expectedForm='1FAIpQLSf_9sFMCHhyT5JfxQv0UGRH6jPwOWeJ4nKqoPxDCdsuCVfQDw';
if(TEST_DOCUMENT_ID!==expectedDoc||TEST_FORM_ID!==expectedForm||EVIDENCE!=='NIL'||MODE!=='test-preview-only')
  throw Error('Safety configuration does not match the approved duplicate resources');
const source=['src/index.mjs','src/parser.mjs','src/report.mjs','src/config.mjs'].map(file=>readFileSync(file,'utf8')).join('\n');
if(/(formResponse|\/formResponse|\/responses\/submit|nodemailer|sendgrid|resend\.emails|smtpTransport)/i.test(source))
  throw Error('Unexpected form submission or email sender implementation');
if(!source.includes('cron-intentionally-disabled')) throw Error('Scheduler safety lock missing');
console.log('Test-only source IDs, NIL evidence and disabled sending verified.');
