import { TIME_ZONE } from './config.mjs';
export function validateDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('date must be YYYY-MM-DD');
  const date = new Date(value + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('Invalid calendar date');
  return value;
}
export function currentWorkday(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short'}).formatToParts(now).map(p => [p.type, p.value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return {date, hour: Number(parts.hour), weekend: ['Sat','Sun'].includes(parts.weekday)};
}
export function previewSelection(params, now = new Date()) {
  const current = currentWorkday(now);
  const date = validateDate(params.get('date') ?? current.date);
  if (date > current.date) throw new Error('Future charter previews are disabled');
  const explicit = params.has('slot');
  if (!explicit && (date !== current.date || current.weekend || current.hour < 8)) throw new Error('Specify a task slot for historical, weekend or pre-workday previews');
  // Preview selection follows charter periods only. Clock-in scheduling remains undecided.
  if (!explicit && current.hour >= 15) throw new Error('Specify Task 3 or 4; end-of-day timing is not configured');
  const slot = explicit ? Number(params.get('slot')) : current.hour < 12 ? 2 : 3;
  if (![1,2,3,4].includes(slot)) throw new Error('slot must be 1-4');
  return {date, slot};
}
