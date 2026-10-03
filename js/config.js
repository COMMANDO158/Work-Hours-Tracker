// Product rules and storage names. Everything here is pure data.

export const DAILY_GOAL = 6 * 3600;        // seconds per workday
export const WEEKLY_GOAL = 30 * 3600;      // seconds per Saturday–Friday week
export const BREAK_LIMIT = 30 * 60;        // break allowance per day, counted as work
export const STREAK_MIN = 30 * 60;         // a workday counts toward the streak at 30 minutes
export const MAX_DAY = 24 * 3600;          // a day can never hold more than this
export const OFF_DAYS = [2, 5];            // Date.getDay(): Tuesday and Friday are rest days
export const ASK_AFTER_MS = 2 * 3600 * 1000; // ask before keeping time counted while the app was closed

// Existing keys: their names and formats must never change (older copies of the
// app and the Gist read them). New keys are device-only and never synced.
export const KEYS = {
  weekData: 'flowFocusWeekData',
  meta: 'flowFocusMeta',
  streak: 'flowFocusStreak',
  syncBase: 'flowFocusSyncBase',
  breakState: 'flowFocusBreakState',
  lastReset: 'flowFocusLastReset',
  gistId: 'flowFocus_gistId',
  token: 'flowFocus_githubToken',
  lastSync: 'flowFocus_lastSync',
  // new in the redesign
  session: 'flowFocusSession',
  prefs: 'flowFocusPrefs',
  intent: 'flowFocusIntent',
  devOffset: 'flowFocusDevOffset'
};

export const GIST_FILE = 'flowfocus.json';
export const APP_VERSION = '3.0.0';
