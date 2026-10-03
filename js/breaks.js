// The daily break. A break is time on the running clock that is marked as
// break: the clock keeps going (no reset), and up to 30 minutes a day count.
// At the 30-minute mark the clock stops at exactly that moment and waits for
// Back to work, so extra break time is never counted. Tracked per device (not synced).
import { S, emit, notify } from './state.js';
import { KEYS, BREAK_LIMIT } from './config.js';
import * as storage from './storage.js';
import { todayKey, now, midnightAfter, isDateKey } from './dates.js';
import { saveData } from './store.js';
import { startTimer, pauseAt } from './timer.js';

export function saveBreakState() {
  if (S.readOnly) return;
  storage.writeJSON(KEYS.breakState, S.breakState);
}

export function loadBreakState() {
  const saved = storage.readJSON(KEYS.breakState, null);
  if (saved && isDateKey(saved.dayKey) &&
      Number.isFinite(saved.usedSeconds) && saved.usedSeconds >= 0 && saved.usedSeconds <= BREAK_LIMIT) {
    S.breakState = {
      dayKey: saved.dayKey,
      usedSeconds: saved.usedSeconds,
      activeStartAt: Number.isFinite(saved.activeStartAt) ? saved.activeStartAt : null,
      baseSeconds: Number.isFinite(saved.baseSeconds) ? saved.baseSeconds : saved.usedSeconds
    };
  }
}

export function breakActive() {
  return !!S.breakState.activeStartAt;
}

export function breakUsedToday() {
  return S.breakState.dayKey === todayKey() ? S.breakState.usedSeconds : 0;
}

export function breakRemainingSeconds() {
  return Math.max(0, BREAK_LIMIT - breakUsedToday());
}

// Earlier versions paused the clock during a break and added the break to
// today's banked total instead. A break left running by one of them is turned
// into running clock time, minus what that version had already added.
export function adoptLegacyBreak() {
  const bs = S.breakState;
  if (!bs.activeStartAt || S.isRunning || S.readOnly || bs.dayKey !== S.dayKey) return;
  const alreadyAdded = Math.max(0, bs.usedSeconds - bs.baseSeconds);
  S.todaySavedSeconds = Math.max(0, S.todaySavedSeconds - alreadyAdded + S.todaySeconds);
  S.todaySeconds = 0;
  S.pausedTime = 0;
  S.pausedOnDayKey = null;
  S.isRunning = true;
  S.startTime = bs.activeStartAt;
  S.currentTimerDayKey = S.dayKey;
  S.lastTickAt = now();
  S.todaySeconds = Math.max(0, Math.floor((now() - S.startTime) / 1000));
}

// Tracks the break's minutes, resets the allowance on a new day, and stops the
// clock at exactly 30 minutes. Safe to call every second.
export function updateBreakTimer() {
  const bs = S.breakState;
  if (!bs.activeStartAt) {
    if (bs.dayKey !== todayKey()) {
      S.breakState = { dayKey: todayKey(), usedSeconds: 0, activeStartAt: null, baseSeconds: 0 };
      saveBreakState();
    }
    return;
  }

  const t = now();
  const midnight = midnightAfter(bs.dayKey);
  const capAt = bs.activeStartAt + Math.max(0, BREAK_LIMIT - bs.baseSeconds) * 1000;
  const end = Math.min(t, midnight, capAt);
  const used = Math.min(BREAK_LIMIT, bs.baseSeconds + Math.max(0, Math.floor((end - bs.activeStartAt) / 1000)));
  if (used !== bs.usedSeconds) {
    bs.usedSeconds = used;
    saveBreakState();
  }

  if (capAt <= t && capAt <= midnight) {
    // The 30 minutes are used: stop the clock at exactly that moment.
    bs.activeStartAt = null;
    bs.baseSeconds = bs.usedSeconds;
    saveBreakState();
    S.breakCappedAt = capAt;
    if (S.isRunning) pauseAt(capAt);
    // Nothing past the cap was counted, so there is no closed-app time to review.
    if (S.gapReview && S.gapReview.dayKey === bs.dayKey) S.gapReview = null;
    notify('Break over', '30 minutes counted. The clock stopped there; press Back to work when you’re back.', { timeout: 9000 });
    emit('change');
  } else if (t >= midnight) {
    // A break still running at midnight ends there; the new day starts with a fresh 30 minutes.
    S.breakState = { dayKey: todayKey(), usedSeconds: 0, activeStartAt: null, baseSeconds: 0 };
    saveBreakState();
    notify('New day', 'Your break ended at midnight. Today starts with a fresh 30-minute break.');
    emit('change');
  }
}

// Start a break. The clock keeps running (or starts again if it was paused).
export function startBreak() {
  if (S.readOnly || breakActive()) return;
  updateBreakTimer();
  const total = S.todaySavedSeconds + S.todaySeconds;
  if (breakRemainingSeconds() <= 0) return;
  if (!S.isRunning && total === 0) return;
  if (!S.isRunning) startTimer();
  S.breakState.dayKey = todayKey();
  S.breakState.baseSeconds = S.breakState.usedSeconds;
  S.breakState.activeStartAt = now();
  S.doneAt = null;
  S.breakCappedAt = null;
  saveBreakState();
  saveData({ forceCloud: true });
  emit('change');
}

// End the break early. The clock keeps running, and what's left of the
// 30 minutes stays available for later today.
export function endBreak({ resume = true } = {}) {
  updateBreakTimer();
  if (S.breakState.activeStartAt) {
    S.breakState.activeStartAt = null;
    S.breakState.baseSeconds = S.breakState.usedSeconds;
    saveBreakState();
  }
  if (resume && !S.isRunning && !S.readOnly) startTimer();
  saveData({ forceCloud: true });
  emit('change');
}
