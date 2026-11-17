import { EVIDENCE, SLOTS, TEST_DOCUMENT_ID, TEST_FORM_ID } from './config.mjs';
export const STATES = Object.freeze(['completed', 'in-progress', 'blocked', 'unverified']);
export function generatePreview(block, updates = {}) {
  const slot = SLOTS[block.taskNumber];
  if (!slot) throw new Error('Invalid task');
  const entries = block.tasks.map((description, index) => {
    const status = updates[String(index)] ?? 'unverified';
    if (!STATES.includes(status)) throw new Error('Invalid task status');
    return { index, description, status };
  });
  const labels = {
    completed: 'Completed (user-confirmed)',
    'in-progress': 'In progress (user-confirmed)',
    blocked: 'Blocked (user-confirmed)',
    unverified: 'Unverified — assignment only'
  };
  const progressReport = [
    'TEST ONLY — ' + slot.label + ' retrospective charter preview for ' + block.date + '. Not a real attendance record.',
    ...entries.map(x => (x.index + 1) + '. [' + labels[x.status] + '] ' + x.description),
    'Individual deliverables not independently verified. Evidence: NIL.'
  ].join('\n');
  return {
    mode: 'test-preview-only', testDocumentId: TEST_DOCUMENT_ID, testFormId: TEST_FORM_ID,
    date: block.date, clockIn: slot.formOption, evidence: EVIDENCE, items: entries,
    progressReport, submitted: false, emailSent: false
  };
}
