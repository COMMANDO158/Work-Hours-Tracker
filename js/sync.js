// Pull, merge, push. Ported from the original tracker in the same order, with
// failures now classified so the interface can say what is actually wrong.
import { S, emit, notify } from './state.js';
import { KEYS } from './config.js';
import * as storage from './storage.js';
import { todayKey } from './dates.js';
import { cloudStorage } from './gist.js';
import { mergeRemoteData, mergeToday, cloudNeedsUpdate } from './merge.js';
import { stampChanges, persistLocal, setSyncBase, recalcStreak } from './store.js';
import { ensureCurrentDay } from './timer.js';

let cloudSyncPromise = null;
let queued = null;          // strongest options requested while a sync was running
let lastCloudSyncAt = 0;
let backoffUntil = 0;
let backoffStep = 0;
const BACKOFF = [60000, 120000, 300000, 600000];
let slowTimer = null;

// A session is in progress if the timer is running or paused with unsaved time.
function isSessionInProgress() {
  return S.isRunning || S.todaySeconds > 0;
}

// Only show "syncing" if it takes a moment, so the pill doesn't flicker.
function setSyncing() {
  clearTimeout(slowTimer);
  slowTimer = setTimeout(() => { S.syncing = true; emit('sync'); }, 600);
}

function fail(message) {
  S.cloudSyncState = 'error';
  S.cloudError = cloudStorage.lastError || { kind: 'temporary', status: 0 };
  if (S.cloudError.kind === 'temporary') {
    backoffUntil = Date.now() + BACKOFF[Math.min(backoffStep, BACKOFF.length - 1)];
    backoffStep++;
  }
  emit('sync');
  return { success: false, message };
}

async function runCloudSync(keepalive) {
  try {
    ensureCurrentDay();
    S.weekData[todayKey()] = S.todaySavedSeconds + S.todaySeconds;
    stampChanges();

    const remote = await cloudStorage.load();
    if (!remote) return fail("Couldn't reach GitHub. Your hours are safe on this device and will sync when it's reachable.");

    const today = todayKey();
    let changed = mergeRemoteData(S, remote, today);
    S.lastPersisted = { ...S.weekData };   // merge results are not local edits

    // Today: add in whatever other devices logged since we last synced.
    const merged = mergeToday(remote.weekData[today], today, {
      todaySavedSeconds: S.todaySavedSeconds,
      todaySeconds: S.todaySeconds,
      syncBase: S.syncBase
    });
    S.todaySavedSeconds = merged.todaySavedSeconds;
    const arrived = merged.delta;
    const mergedToday = S.todaySavedSeconds + S.todaySeconds;
    if (mergedToday !== S.weekData[today]) {
      S.weekData[today] = mergedToday;
      S.weekMeta[today] = Date.now();
    }
    S.lastPersisted = { ...S.weekData };
    if (arrived !== 0) {
      changed++;
      if (isSessionInProgress() && arrived > 0) {
        const mins = Math.max(1, Math.round(arrived / 60));
        notify('From your other device', `${mins} min logged elsewhere today ${mins === 1 ? 'was' : 'were'} added.`);
      }
    }

    recalcStreak();
    persistLocal();

    const needsPush = cloudNeedsUpdate(S.weekData, S.weekMeta, remote);
    const agreedToday = S.weekData[today];   // exactly what the cloud will hold for today
    if (needsPush) {
      const saved = await cloudStorage.save({ weekData: S.weekData, meta: S.weekMeta, streak: S.streak }, { keepalive });
      if (!saved.success) return fail(saved.message || 'Upload failed');
    } else {
      cloudStorage.updateLastSync();
    }

    setSyncBase(today, agreedToday);
    lastCloudSyncAt = Date.now();
    backoffStep = 0;
    backoffUntil = 0;
    S.cloudSyncState = 'ok';
    S.cloudError = null;
    emit('change');
    emit('sync');
    return { success: true, pushed: needsPush, pulledDays: changed, message: 'Synced' };
  } catch (error) {
    console.error('Cloud sync error:', error);
    return fail(error.message);
  }
}

// One sync at a time; a request that arrives mid-sync triggers exactly one
// follow-up run, carrying the strongest options asked for.
export function syncCloud({ keepalive = false } = {}) {
  if (!cloudStorage.isConfigured || S.readOnly) {
    return Promise.resolve({ success: false, message: 'Not configured' });
  }
  if (cloudSyncPromise) {
    queued = { keepalive: keepalive || (queued && queued.keepalive) || false };
    return cloudSyncPromise;
  }
  setSyncing();
  emit('sync');
  cloudSyncPromise = (async () => {
    let result;
    let opts = { keepalive };
    do {
      queued = null;
      result = await runCloudSync(opts.keepalive);
      opts = queued || opts;
    } while (queued && result.success);
    return result;
  })().finally(() => {
    cloudSyncPromise = null;
    clearTimeout(slowTimer);
    S.syncing = false;
    emit('sync'); // always: controls disabled while busy need to come back
  });
  return cloudSyncPromise;
}

// Fire-and-forget sync, throttled so autosave doesn't hammer the GitHub API.
// Auth and missing-gist failures wait for the person to act; temporary
// failures back off 1, 2, 5, then 10 minutes.
export function scheduleCloudSync({ force = false, minInterval = 60000, keepalive = false, manual = false } = {}) {
  if (!cloudStorage.isConfigured || S.readOnly) return;
  const kind = S.cloudError && S.cloudError.kind;
  if (!manual && (kind === 'auth' || kind === 'missing' || kind === 'data')) return;
  if (!manual && !force && Date.now() < backoffUntil) return;
  if (!force && !manual && Date.now() - lastCloudSyncAt < minInterval) return;
  syncCloud({ keepalive });
}

export function isSyncBusy() {
  return !!cloudSyncPromise;
}

export async function connectGitHub(token) {
  const result = await cloudStorage.configure(token);
  S.cloudError = null;
  S.cloudSyncState = 'idle';
  emit('sync');
  const merged = await syncCloud();
  return { ...result, merged };
}

export function disconnectCloud() {
  cloudStorage.disconnect();
  S.cloudSyncState = 'idle';
  S.cloudError = null;
  S.syncBase = { key: null, value: 0 };
  storage.remove(KEYS.syncBase);
  emit('sync');
}

// What the sync pill should say.
export function syncStatus() {
  if (!cloudStorage.isConfigured) return { state: 'local', label: 'This device' };
  if (S.syncing) return { state: 'syncing', label: 'Syncing' };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { state: 'offline', label: 'Offline' };
  if (S.cloudSyncState === 'error' && S.cloudError) {
    switch (S.cloudError.kind) {
      case 'auth': return { state: 'auth', label: 'Reconnect' };
      case 'missing': return { state: 'missing', label: 'Gist missing' };
      case 'data': return { state: 'data', label: 'Sync paused' };
      case 'offline': return { state: 'offline', label: 'Offline' };
      default: return { state: 'retry', label: 'Retrying' };
    }
  }
  if (S.cloudSyncState === 'ok') return { state: 'ok', label: 'Synced' };
  return { state: 'idle', label: 'Sync on' };
}
