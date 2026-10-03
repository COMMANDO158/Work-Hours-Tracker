// Duration formatting and parsing. Pure.
import { MAX_DAY } from './config.js';

// "3h 45m", "45m", "0m". Rounds down, like every total in the app.
export function formatHM(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

// Remaining time rounds minutes up, so "to go" never reads 0m while time is left.
export function formatRemaining(seconds) {
  const s = Math.max(0, Math.ceil((seconds || 0) / 60)) * 60;
  return formatHM(s);
}

// Session clock: "0:47:12"
export function formatClock(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

// Countdown: "18:04"
export function formatMinSec(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// Editable value: "5:30"
export function formatEditable(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

export function clampDay(seconds) {
  if (!Number.isFinite(seconds)) return 0;
  return Math.max(0, Math.min(MAX_DAY, Math.round(seconds)));
}

// Accepts "5:30", "5h30", "5h 30m", "5.5", "5.5h", "330m", "45m", "6".
// A bare number up to 24 means hours; above 24 it means minutes.
// Returns seconds, or null when the text is not a duration.
export function parseDuration(input) {
  if (typeof input !== 'string') return null;
  const text = input.trim().toLowerCase().replace(/,/g, '.');
  if (!text) return null;

  let m = text.match(/^(\d{1,2}):([0-5]?\d)$/);
  if (m) return Number(m[1]) * 3600 + Number(m[2]) * 60;

  m = text.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?\s*(?:(\d{1,2})\s*(?:m(?:in(?:utes?|s)?)?)?)?$/);
  if (m) return Math.round(Number(m[1]) * 3600) + (m[2] ? Number(m[2]) * 60 : 0);

  m = text.match(/^(\d+)\s*m(?:in(?:utes?|s)?)?$/);
  if (m) return Number(m[1]) * 60;

  m = text.match(/^(\d+(?:\.\d+)?)$/);
  if (m) {
    const n = Number(m[1]);
    return n <= 24 ? Math.round(n * 3600) : Math.round(n) * 60;
  }
  return null;
}

export function formatTimeOfDay(ms) {
  return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatShortDate(date) {
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}
