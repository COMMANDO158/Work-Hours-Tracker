// JSON backup export and import. The GitHub token and sync bookkeeping are
// never written into a backup file.
import { S, emit } from './state.js';
import { KEYS, MAX_DAY, APP_VERSION } from './config.js';
import { todayKey, isDateKey } from './dates.js';
import { mergeRemoteData } from './merge.js';
import { readIntents, persistLocal, recalcStreak, liveTodaySeconds } from './store.js';
import * as storage from './storage.js';
import { scheduleCloudSync } from './sync.js';
import { setTodayAdjustedTotal } from './timer.js';

export function buildBackup() {
  return {
    app: 'FlowFocus',
    kind: 'backup',
    version: 1,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    weekData: { ...S.weekData, [todayKey()]: liveTodaySeconds() },
    meta: { ...S.weekMeta },
    intents: readIntents()
  };
}

export function downloadBackup() {
  const data = buildBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flowfocus-backup-${todayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Validates a parsed backup. Returns { ok, error, file }.
export function validateBackup(parsed) {
  if (!parsed || typeof parsed !== 'object') return { ok: false, error: 'This file isn’t a FlowFocus backup.' };
  // Accept our own backups and a raw Gist payload ({ weekData, meta }).
  const weekData = parsed.weekData;
  if (!weekData || typeof weekData !== 'object' || Array.isArray(weekData)) {
    return { ok: false, error: 'This file has no tracked days in it.' };
  }
  const cleanWeek = {};
  for (const [key, value] of Object.entries(weekData)) {
    if (!isDateKey(key)) continue;
    if (typeof value !== 'number' || !isFinite(value) || value < 0 || value > MAX_DAY) continue;
    cleanWeek[key] = Math.round(value);
  }
  const days = Object.keys(cleanWeek);
  if (!days.length) return { ok: false, error: 'This file has no valid tracked days in it.' };
  const meta = {};
  if (parsed.meta && typeof parsed.meta === 'object') {
    for (const [key, value] of Object.entries(parsed.meta)) {
      if (isDateKey(key) && Number.isFinite(Number(value))) meta[key] = Number(value);
    }
  }
  const intents = parsed.intents && typeof parsed.intents === 'object' ? parsed.intents : {};
  return { ok: true, file: { weekData: cleanWeek, meta, intents } };
}

// What an import would change, without changing anything.
export function previewImport(file) {
  const local = { weekData: { ...S.weekData }, weekMeta: { ...S.weekMeta } };
  const skip = skipKeyForImport();
  const changed = mergeRemoteData(local, file, skip);
  const keys = Object.keys(file.weekData).sort();
  return { days: keys.length, from: keys[0], to: keys[keys.length - 1], changed, skippedToday: skip !== null && file.weekData[skip] !== undefined };
}

// Today is left alone while time is on the clock, so a running session can't be overwritten.
function skipKeyForImport() {
  const live = liveTodaySeconds();
  return (S.isRunning || S.todaySeconds > 0 || live > 0) ? todayKey() : null;
}

export function applyImport(file) {
  const skip = skipKeyForImport();
  const changed = mergeRemoteData(S, file, skip);
  S.lastPersisted = { ...S.weekData };
  const t = todayKey();
  if (skip === null && file.weekData[t] !== undefined) setTodayAdjustedTotal(S.weekData[t] || 0);
  // Notes: keep local ones, add missing ones.
  const intents = readIntents();
  for (const [key, text] of Object.entries(file.intents || {})) {
    if (isDateKey(key) && typeof text === 'string' && !intents[key]) intents[key] = text.slice(0, 140);
  }
  storage.writeJSON(KEYS.intent, intents);
  recalcStreak();
  persistLocal();
  scheduleCloudSync({ force: true });
  emit('change');
  return changed;
}
