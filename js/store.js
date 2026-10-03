// The ledger: loading, change stamping, and persistence. Formats of the
// existing keys are unchanged from the original tracker.
import { S, emit, notify } from './state.js';
import { KEYS, MAX_DAY } from './config.js';
import * as storage from './storage.js';
import { todayKey, today, now, isDateKey } from './dates.js';
import { calculateStreak } from './insights.js';
import { scheduleCloudSync } from './sync.js';
import { setTodayAdjustedTotal, ensureCurrentDay } from './timer.js';

// Local data only; the cloud merge happens separately and never blocks startup.
export function loadData() {
  try {
    const savedWeekData = storage.readJSON(KEYS.weekData, null);
    const savedMeta = storage.readJSON(KEYS.meta, null);
    const savedStreak = storage.read(KEYS.streak);
    const savedBase = storage.readJSON(KEYS.syncBase, null);
    if (savedWeekData && typeof savedWeekData === 'object') S.weekData = savedWeekData;
    else S.weekData = {};
    if (savedMeta && typeof savedMeta === 'object') S.weekMeta = savedMeta;
    else S.weekMeta = {};
    if (savedStreak) S.streak = parseInt(savedStreak, 10) || 0;
    if (savedBase && typeof savedBase === 'object') S.syncBase = savedBase;
  } catch (error) {
    console.error('Error loading data:', error);
    notify('Saved data unreadable', 'Some saved hours could not be read on this device.', { kind: 'warning' });
  }

  S.lastPersisted = { ...S.weekData };

  // Today's saved total always comes from weekData itself, so a brand-new day
  // starts at 0 and never inherits a stale value.
  const key = todayKey();
  S.dayKey = key;
  S.todaySavedSeconds = S.weekData[key] || 0;
  S.weekData[key] = S.todaySavedSeconds;
  S.lastPersisted[key] = S.todaySavedSeconds;
}

export function setSyncBase(key, value) {
  S.syncBase = { key, value };
  if (!S.readOnly) storage.writeJSON(KEYS.syncBase, S.syncBase);
}

// Stamp every day whose value changed since the last snapshot.
export function stampChanges() {
  const t = Date.now();
  for (const key of Object.keys(S.weekData)) {
    const value = S.weekData[key];
    if (value === S.lastPersisted[key]) continue;
    // A brand-new empty day isn't a real edit. Never let it outrank real hours elsewhere.
    if (value === 0 && S.lastPersisted[key] === undefined) continue;
    S.weekMeta[key] = t;
  }
  S.lastPersisted = { ...S.weekData };
}

// Writes the ledger and the session snapshot together, so a reload can always
// tell banked time apart from time that was on the clock.
export function persistLocal() {
  if (S.readOnly) return;
  storage.writeJSON(KEYS.weekData, S.weekData);
  storage.writeJSON(KEYS.meta, S.weekMeta);
  storage.write(KEYS.streak, String(S.streak));
  persistSession();
}

export function persistSession() {
  if (S.readOnly) return;
  const status = S.isRunning ? 'running' : (S.pausedTime > 0 ? 'paused' : 'idle');
  const stored = S.weekData[S.dayKey] || 0;
  storage.writeJSON(KEYS.session, {
    v: 1,
    dayKey: S.dayKey,
    status,
    startTime: S.startTime,
    pausedMs: S.pausedTime,
    pausedOnDayKey: S.pausedOnDayKey,
    folded: Math.max(0, stored - S.todaySavedSeconds),
    heartbeatAt: now(),
    doneAt: S.doneAt,
    breakCappedAt: S.breakCappedAt
  });
}

export function liveTodaySeconds() {
  return S.todaySavedSeconds + S.todaySeconds;
}

// weekData with today replaced by the live total. Never persisted.
export function liveWeekData() {
  return { ...S.weekData, [S.dayKey || todayKey()]: liveTodaySeconds() };
}

export function recalcStreak() {
  S.streak = calculateStreak(liveWeekData(), today());
  return S.streak;
}

export async function saveData({ forceCloud = false } = {}) {
  if (S.readOnly) return;
  try {
    ensureCurrentDay();
    // Persist the live total (finished sessions + whatever is on the clock now).
    S.weekData[todayKey()] = S.todaySavedSeconds + S.todaySeconds;
    stampChanges();
    persistLocal();
    scheduleCloudSync({ force: forceCloud });
  } catch (error) {
    console.error('Error saving data:', error);
    notify('Not saved', 'Your latest change could not be saved on this device.', { kind: 'warning' });
  }
}

let editSyncTimer = null;

// Set one day's total. Writes only when the value really changes, so untouched
// days keep their timestamps. Returns { prev, next, changed } for undo.
export function setDayTotal(key, seconds) {
  if (S.readOnly || !isDateKey(key)) return null;
  ensureCurrentDay();
  const next = Math.max(0, Math.min(MAX_DAY, Math.round(seconds)));
  const t = todayKey();
  if (key > t) return null; // future days are read-only

  let prev;
  if (key === t) {
    prev = liveTodaySeconds();
    if (prev === next) return { prev, next, changed: false };
    setTodayAdjustedTotal(next);
  } else {
    prev = S.weekData[key] || 0;
    if (S.weekData[key] === next || (S.weekData[key] === undefined && next === 0)) {
      return { prev, next, changed: false };
    }
    S.weekData[key] = next;
  }

  recalcStreak();
  saveData();
  // One forced sync shortly after a burst of quick edits.
  clearTimeout(editSyncTimer);
  editSyncTimer = setTimeout(() => scheduleCloudSync({ force: true }), 2000);
  emit('change');
  return { prev, next, changed: true };
}

// "What are you working on" notes, one per day (device-only).
export function readIntents() {
  const v = storage.readJSON(KEYS.intent, null);
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}

export function getIntent(key) {
  const v = readIntents()[key];
  return typeof v === 'string' ? v : '';
}

export function setIntent(key, text) {
  if (S.readOnly) return;
  const all = readIntents();
  const clean = String(text || '').slice(0, 140).trim();
  if (clean) all[key] = clean; else delete all[key];
  storage.writeJSON(KEYS.intent, all);
}

export function readPrefs() {
  const v = storage.readJSON(KEYS.prefs, null);
  return { mode: 'system', ...(v && typeof v === 'object' ? v : {}) };
}

export function writePrefs(prefs) {
  storage.writeJSON(KEYS.prefs, prefs);
}
