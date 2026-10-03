// Shared mutable state and a tiny event bus. Domain modules mutate S and emit;
// the UI listens and re-renders.

export const S = {
  // ledger (persisted in the existing keys)
  weekData: {},          // dateKey -> seconds
  weekMeta: {},          // dateKey -> last-modified ms
  lastPersisted: {},     // snapshot used to detect which days changed
  streak: 0,
  syncBase: { key: null, value: 0 },

  // timer
  dayKey: null,          // the day todaySavedSeconds belongs to
  isRunning: false,
  startTime: 0,          // ms; session = now - startTime
  pausedTime: 0,         // ms on the clock while paused
  todaySeconds: 0,       // current session seconds
  todaySavedSeconds: 0,  // seconds already banked for dayKey
  currentTimerDayKey: null,
  pausedOnDayKey: null,
  doneAt: null,          // ms when the day was finished
  breakCappedAt: null,   // ms when the break allowance ran out mid-break
  lastTickAt: 0,

  // break (persisted in flowFocusBreakState)
  breakState: { dayKey: null, usedSeconds: 0, activeStartAt: null, baseSeconds: 0 },

  // review banners for time counted while the app was closed or asleep
  gapReview: null,

  // sync
  cloudSyncState: 'idle',  // idle | ok | error
  cloudError: null,        // { kind, status } from the last failure
  syncing: false,

  // window ownership: only the active window writes
  readOnly: false
};

const listeners = new Set();

export function on(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emit(type, detail) {
  for (const fn of listeners) {
    try { fn(type, detail); } catch (error) { console.error(error); }
  }
}

// A short message for the notice region. kind: info | warning.
export function notify(title, text, options = {}) {
  emit('notice', { title, text, kind: options.kind || 'info', action: options.action || null, timeout: options.timeout });
}
