// The work timer, ported from the original tracker, plus the fixes from the
// redesign: the day is re-checked before anything is saved, midnight splits at
// exactly midnight, and a running session survives reloads.
import { S, emit, notify } from './state.js';
import { KEYS, ASK_AFTER_MS, WEEKLY_GOAL } from './config.js';
import * as storage from './storage.js';
import {
  now, todayKey, midnightAfter, addDaysToKey, isDateKey, parseDateKey, today
} from './dates.js';
import { stampChanges, persistLocal, persistSession, saveData, recalcStreak, liveWeekData } from './store.js';
import { updateBreakTimer, endBreak, breakActive } from './breaks.js';
import { weekTotal } from './insights.js';
import { formatHM } from './format.js';

export function startTimer() {
  if (S.readOnly) return;
  ensureCurrentDay();
  if (breakActive()) endBreak({ resume: false });
  if (S.isRunning) return;

  const key = todayKey();
  // Time paused before midnight and resumed after it belongs to the earlier day.
  if (S.pausedTime > 0 && S.pausedOnDayKey && S.pausedOnDayKey !== key) {
    S.weekData[S.pausedOnDayKey] = S.todaySavedSeconds + S.todaySeconds;
    S.todaySavedSeconds = 0;
    S.todaySeconds = 0;
    S.pausedTime = 0;
    recalcStreak();
    saveData();
  }
  S.pausedOnDayKey = null;

  S.isRunning = true;
  S.startTime = now() - S.pausedTime;
  S.currentTimerDayKey = key;
  S.doneAt = null;
  S.breakCappedAt = null;
  S.lastTickAt = now();
  tickTimer();
  persistSession();
  emit('change');
}

export function pauseTimer({ quiet = false } = {}) {
  if (!S.isRunning) return;
  if (breakActive()) endBreak({ resume: false });
  pauseAt(now(), { quiet });
}

// Stop the clock as of a moment (now, or the instant the break allowance ran out).
export function pauseAt(ms, { quiet = true } = {}) {
  if (!S.isRunning) return;
  S.isRunning = false;
  S.pausedTime = Math.max(0, Math.min(ms, now()) - S.startTime);
  S.todaySeconds = Math.floor(S.pausedTime / 1000);
  S.pausedOnDayKey = S.currentTimerDayKey;
  saveData({ forceCloud: true }); // save + sync when paused
  if (!quiet) emit('change');
}

export function finishDay() {
  if (S.readOnly) return;
  if (breakActive()) endBreak({ resume: false });
  if (S.isRunning) pauseTimer({ quiet: true });

  const key = todayKey();
  const totalToday = S.todaySavedSeconds + S.todaySeconds;
  S.weekData[key] = totalToday;
  recalcStreak();

  S.todaySeconds = 0;
  S.todaySavedSeconds = totalToday;
  S.pausedTime = 0;
  S.pausedOnDayKey = null;
  S.doneAt = now();
  S.breakCappedAt = null;
  saveData({ forceCloud: true });

  const week = weekTotal(liveWeekData(), today());
  if (week >= WEEKLY_GOAL) {
    notify('Day closed', `${formatHM(totalToday)} today. The week's 30 hours are in.`);
  } else {
    notify('Day closed', `${formatHM(totalToday)} today. ${formatHM(WEEKLY_GOAL - week)} left this week.`);
  }
  emit('change');
}

// Called every second. Updates the session from the wall clock.
export function tickTimer() {
  if (S.isRunning) {
    const t = now();
    if (S.lastTickAt && t - S.lastTickAt > ASK_AFTER_MS && !S.gapReview) {
      // The page was asleep for a long time while the timer ran.
      S.gapReview = {
        kind: 'asleep',
        dayKey: S.currentTimerDayKey,
        startMs: S.startTime,
        banked: S.todaySavedSeconds,
        lastSeenAt: S.lastTickAt
      };
      emit('change');
    }
    S.lastTickAt = t;
    if (S.currentTimerDayKey && todayKey() !== S.currentTimerDayKey) {
      rollover();
      return;
    }
    S.todaySeconds = Math.floor((t - S.startTime) / 1000);
  }
}

// Closes the running day at exactly midnight and keeps the timer running into
// the new one. More than one midnight (a page frozen for days) only credits the
// first day up to its own midnight and stops the timer.
function rollover() {
  const oldKey = S.currentTimerDayKey;
  const newKey = todayKey();
  const midnight = midnightAfter(oldKey);
  const sessionToMidnight = Math.max(0, Math.floor((midnight - S.startTime) / 1000));
  S.weekData[oldKey] = S.todaySavedSeconds + sessionToMidnight;

  const consecutive = addDaysToKey(oldKey, 1) === newKey;
  S.dayKey = newKey;
  S.currentTimerDayKey = newKey;
  S.todaySavedSeconds = S.weekData[newKey] || 0;
  S.pausedTime = 0;
  S.pausedOnDayKey = null;
  S.doneAt = null;
  S.breakCappedAt = null;
  if (consecutive) {
    S.startTime = midnight;
    S.todaySeconds = Math.max(0, Math.floor((now() - midnight) / 1000));
  } else {
    S.isRunning = false;
    S.todaySeconds = 0;
    S.startTime = 0;
  }
  if (S.weekData[newKey] === undefined) S.weekData[newKey] = 0;

  recalcStreak();
  saveData({ forceCloud: true });
  updateBreakTimer();
  notify('New day', consecutive
    ? 'It’s past midnight. Yesterday is closed and the timer carries on into today.'
    : 'The timer was left running for days. Only the first day was counted, up to midnight.');
  emit('change');
}

// Makes sure the banked total belongs to today before anything reads or saves
// it. Without this, an app left open overnight wrote yesterday's total into today.
export function ensureCurrentDay() {
  const key = todayKey();
  if (S.dayKey === key) return;
  updateBreakTimer();
  if (S.isRunning) {
    rollover();
    return;
  }
  if (S.pausedTime > 0 && S.pausedOnDayKey && S.pausedOnDayKey !== key) {
    S.weekData[S.pausedOnDayKey] = S.todaySavedSeconds + S.todaySeconds;
    S.todaySeconds = 0;
    S.pausedTime = 0;
    S.pausedOnDayKey = null;
  }
  S.dayKey = key;
  S.todaySavedSeconds = S.weekData[key] || 0;
  if (S.weekData[key] === undefined) {
    S.weekData[key] = 0;
    S.lastPersisted[key] = 0;
  }
  S.doneAt = null;
  S.breakCappedAt = null;
  S.gapReview = null;
  recalcStreak();
  stampChanges();
  persistLocal();
  emit('change');
}

// Set today's total to an absolute value (manual correction). A running timer
// keeps running from the new total; a paused session is folded in.
export function setTodayAdjustedTotal(totalSeconds) {
  S.todaySavedSeconds = totalSeconds;
  S.todaySeconds = 0;
  S.pausedTime = 0;
  S.pausedOnDayKey = null;
  if (S.isRunning) S.startTime = now();
  S.doneAt = S.doneAt && !S.isRunning ? S.doneAt : null;
  tickTimer();
}

export function sessionSeconds() {
  return S.todaySeconds;
}

// Restores a session saved by persistSession(). Banked time is the stored day
// total minus what was on the clock, so nothing is counted twice.
export function restoreSession() {
  const rec = storage.readJSON(KEYS.session, null);
  if (!rec || rec.v !== 1 || !isDateKey(rec.dayKey)) return;
  const key = todayKey();
  const stored = S.weekData[rec.dayKey] || 0;
  const folded = Math.max(0, Number(rec.folded) || 0);
  const banked = Math.max(0, stored - folded);
  const heartbeat = Number(rec.heartbeatAt) || now();
  const startTime = Number(rec.startTime) || 0;
  const t = now();

  if (rec.dayKey === key) {
    S.todaySavedSeconds = banked;
    S.doneAt = Number(rec.doneAt) || null;
    S.breakCappedAt = Number(rec.breakCappedAt) || null;
    if (rec.status === 'running' && startTime > 0 && startTime <= t) {
      S.isRunning = true;
      S.startTime = startTime;
      S.currentTimerDayKey = key;
      S.todaySeconds = Math.floor((t - startTime) / 1000);
      S.lastTickAt = t;
      if (t - heartbeat > ASK_AFTER_MS) {
        S.gapReview = { kind: 'closed', dayKey: key, startMs: startTime, banked, lastSeenAt: heartbeat };
      }
    } else if (rec.status === 'paused' && Number(rec.pausedMs) > 0) {
      S.pausedTime = Number(rec.pausedMs);
      S.todaySeconds = Math.floor(S.pausedTime / 1000);
      S.pausedOnDayKey = isDateKey(rec.pausedOnDayKey) ? rec.pausedOnDayKey : key;
    } else {
      S.todaySavedSeconds = stored;
    }
    return;
  }

  if (rec.dayKey < key && rec.status === 'running' && startTime > 0) {
    // Closed while running on an earlier day: count up to that day's midnight
    // when only one midnight passed, otherwise only up to when it was last seen.
    const oneMidnight = addDaysToKey(rec.dayKey, 1) === key;
    const end = oneMidnight ? midnightAfter(rec.dayKey) : Math.min(heartbeat, midnightAfter(rec.dayKey));
    const sessionSec = Math.max(0, Math.floor((end - startTime) / 1000));
    S.weekData[rec.dayKey] = Math.min(24 * 3600, banked + sessionSec);
    if (end - heartbeat > ASK_AFTER_MS) {
      S.gapReview = { kind: 'carried', dayKey: rec.dayKey, startMs: startTime, banked, lastSeenAt: heartbeat, endMs: end };
    }
    stampChanges();
    recalcStreak();
  }
  // A paused session from an earlier day is already folded into that day.
}

// Answer to the "counted while closed" review.
export function keepGap() {
  S.gapReview = null;
  emit('change');
}

// Trim the reviewed session so it ends at endMs.
export function trimGap(endMs) {
  const g = S.gapReview;
  if (!g || S.readOnly) return;
  const dayStart = parseDateKey(g.dayKey).getTime();
  const end = Math.max(g.startMs, Math.min(endMs, midnightAfter(g.dayKey), now()));
  const sessionSec = Math.max(0, Math.floor((end - Math.max(g.startMs, dayStart)) / 1000));
  if (g.dayKey === S.dayKey && S.isRunning) {
    // Stop the running session at the chosen time and bank it.
    S.isRunning = false;
    S.todaySeconds = 0;
    S.pausedTime = 0;
    S.pausedOnDayKey = null;
    S.todaySavedSeconds = g.banked + sessionSec;
  } else if (g.dayKey === S.dayKey) {
    S.todaySavedSeconds = g.banked + sessionSec;
  } else {
    S.weekData[g.dayKey] = g.banked + sessionSec;
  }
  S.gapReview = null;
  recalcStreak();
  saveData({ forceCloud: true });
  notify('Time trimmed', `Counted until ${new Date(end).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}.`);
  emit('change');
}
