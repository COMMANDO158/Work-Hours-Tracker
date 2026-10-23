// How the screens write hours and dates. Pure, apart from reading the clock's date.
import { DAILY_GOAL } from '../config.js';
import { addDays } from '../dates.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LONG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const minutesOf = (seconds) => Math.max(0, Math.floor((seconds || 0) / 60));

// "6h30": the filled numeral's form, hours and two-digit minutes.
export function mono(seconds) {
  const m = minutesOf(seconds);
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
}

// "6 hours 30 minutes", for screen readers.
export function spoken(seconds) {
  const m = minutesOf(seconds);
  const h = Math.floor(m / 60);
  const r = m % 60;
  const hs = h ? `${h} hour${h === 1 ? '' : 's'}` : '';
  const ms = r || !h ? `${r} minute${r === 1 ? '' : 's'}` : '';
  return [hs, ms].filter(Boolean).join(' ');
}

// The parts of "4h 15m" (or "15m"), so the units can be set small.
export function hmParts(seconds) {
  const m = minutesOf(seconds);
  const h = Math.floor(m / 60);
  return h ? { h: String(h), m: String(m % 60).padStart(2, '0') } : { h: '', m: String(m % 60) };
}

// A day's level against 6h, 0 to 1.
export function dayLevel(seconds) {
  return Math.max(0, Math.min(1, (seconds || 0) / DAILY_GOAL));
}

export function longDate(date) {
  return `${date.getDate()} ${LONG_MONTHS[date.getMonth()]}`;
}

export function shortDate(date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

// "24–30 Oct", or "26 Sep – 2 Oct" across a month. The year is added when it isn't this one.
export function range(start, ref) {
  const end = addDays(start, 6);
  const year = end.getFullYear() !== ref.getFullYear() ? ` ${end.getFullYear()}` : '';
  return start.getMonth() === end.getMonth()
    ? `${start.getDate()}–${end.getDate()} ${MONTHS[end.getMonth()]}${year}`
    : `${shortDate(start)} – ${shortDate(end)}${year}`;
}

export function listWords(arr) {
  return arr.length > 1 ? `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}` : arr[0] || '';
}
