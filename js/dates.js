// Calendar helpers. All day keys use the LOCAL calendar day (never toISOString,
// which shifts the date for anyone not in UTC).
import { OFF_DAYS } from './config.js';

// Single clock for the whole app. A development offset can be set on localhost
// to rehearse midnight, week changes, and long gaps.
let clockOffset = 0;
export function setClockOffset(ms) { clockOffset = Number(ms) || 0; }
export function now() { return Date.now() + clockOffset; }
export function today() { return new Date(now()); }

export function getDateKey(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayKey() {
  return getDateKey(today());
}

export function isDateKey(key) {
  return typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key);
}

// Local midnight at the start of the day named by the key.
export function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

export function addDaysToKey(key, n) {
  return getDateKey(addDays(parseDateKey(key), n));
}

// Epoch ms of the local midnight that ends the given day key.
export function midnightAfter(key) {
  return addDays(parseDateKey(key), 1).getTime();
}

export function isOffDay(date) {
  return OFF_DAYS.includes(date.getDay());
}

export function isOffDayKey(key) {
  return isOffDay(parseDateKey(key));
}

// Weeks run Saturday to Friday.
export function weekStart(ref) {
  const d = startOfDay(ref);
  const back = (d.getDay() + 1) % 7; // Saturday -> 0, Sunday -> 1, ... Friday -> 6
  return addDays(d, -back);
}

export function getWeekDates(ref) {
  const start = weekStart(ref);
  const dates = [];
  for (let i = 0; i < 7; i++) dates.push(addDays(start, i));
  return dates;
}

export function weekKeys(ref) {
  return getWeekDates(ref).map(getDateKey);
}

// Days between two local dates, ignoring time of day (DST-safe).
export function dayDiff(a, b) {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / 86400000);
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_LETTER = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];

export function weekdayShort(date) { return WEEKDAY_SHORT[date.getDay()]; }
export function weekdayLong(date) { return WEEKDAY_LONG[date.getDay()]; }
export function weekdayLetter(date) { return WEEKDAY_LETTER[date.getDay()]; }
