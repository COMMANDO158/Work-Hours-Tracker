// Boot, the clock tick, autosave, sync triggers, window ownership, and updates.
import { S, on, emit, notify } from './state.js';
import { KEYS } from './config.js';
import * as storage from './storage.js';
import { setClockOffset, today, todayKey, getDateKey, weekStart, weekdayLong } from './dates.js';
import { loadData, saveData, stampChanges, persistLocal, persistSession, recalcStreak, liveWeekData, readPrefs } from './store.js';
import { loadBreakState, updateBreakTimer, breakActive, adoptLegacyBreak } from './breaks.js';
import { restoreSession, ensureCurrentDay, tickTimer } from './timer.js';
import { scheduleCloudSync } from './sync.js';
import { cloudStorage } from './gist.js';
import { previousWeekRecap } from './insights.js';
import { formatHM } from './format.js';
import { claimWindow, takeOver } from './lock.js';
import {
  applyMode, applyGem, startRouter, renderSyncPill, mountNotices, renderWindowBanner, updateThemeColor
} from './ui/shell.js';
import { mountToday, renderToday } from './ui/today.js';
import { mountLog, renderLog, openDay, tickLog } from './ui/log.js';
import { mountInsights, renderInsights } from './ui/insights-view.js';
import { mountSettings } from './ui/settings.js';

const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
let mainView = 'today';
let lastDay = null;
let pendingReload = false;

// Development clock on localhost only: ?now=2026-10-03T23:59:30 shifts time,
// ?now=reset clears it. Lets midnight and week changes be rehearsed.
function setupDevClock() {
  if (!isLocal) return;
  const param = new URLSearchParams(location.search).get('now');
  if (param === 'reset') storage.remove(KEYS.devOffset);
  else if (param && !Number.isNaN(Date.parse(param))) storage.write(KEYS.devOffset, String(Date.parse(param) - Date.now()));
  const offset = Number(storage.read(KEYS.devOffset)) || 0;
  setClockOffset(offset);
  window.FlowFocus = { S, setClockOffset, emit };
}

function loadAll() {
  S.gapReview = null;
  loadData();
  loadBreakState();
  restoreSession();
  adoptLegacyBreak();
  ensureCurrentDay();
  updateBreakTimer();
  recalcStreak();
  if (S.readOnly) {
    S.gapReview = null;
  } else {
    stampChanges();
    persistLocal();
  }
  cloudStorage.reload();
  lastDay = todayKey();
}

function renderVisible() {
  renderToday();
  if (mainView === 'log') renderLog();
  if (mainView === 'insights') renderInsights();
  renderSyncPill();
}

let changeQueued = false;
function onChange() {
  if (changeQueued) return;
  changeQueued = true;
  requestAnimationFrame(() => {
    changeQueued = false;
    renderVisible();
  });
}

function recapCheck() {
  const last = storage.read(KEYS.lastReset);
  const ws = getDateKey(weekStart(today()));
  if (!last || last < ws) {
    if (last) {
      const recap = previousWeekRecap(liveWeekData(), today());
      if (recap.total > 0) {
        const best = recap.best ? ` Your longest day was ${weekdayLong(recap.best.date)}, ${formatHM(recap.best.seconds)}.` : '';
        notify('Last week', `${formatHM(recap.total)} from Saturday to Friday.${best}`, { timeout: 12000 });
      }
    }
    if (!S.readOnly) storage.write(KEYS.lastReset, todayKey());
  }
}

let ticks = 0;
function tick() {
  ticks++;
  if (!S.readOnly) {
    ensureCurrentDay();
    tickTimer();
    if (breakActive()) updateBreakTimer();
  } else {
    tickTimer();
  }
  const day = todayKey();
  if (day !== lastDay) {
    lastDay = day;
    recapCheck();
    onChange();
  }
  applyGem();
  renderToday();
  if (ticks % 60 === 0) {
    tickLog();
    if (mainView === 'insights' && (S.isRunning || breakActive())) renderInsights();
  }
}

function autosave() {
  if (S.readOnly) return;
  if (S.isRunning || breakActive()) {
    updateBreakTimer();
    saveData();
  }
}

function becomeReadOnly() {
  S.readOnly = true;
  loadAll();
  renderWindowBanner(useHere);
  emit('change');
}

function useHere() {
  takeOver({ onLost: becomeReadOnly });
}

function onRoute({ mainView: view, view: routeView, param }) {
  mainView = view;
  if (view === 'log') {
    if (param) openDay(param);
    else renderLog();
  }
  if (view === 'insights') {
    renderInsights();
    scheduleCloudSync({ minInterval: 15000 });
  }
  if (routeView === 'today' || view === 'today') renderToday();
  const main = document.getElementById('main');
  if (main && !param) main.scrollTop = 0;
  if (!param && document.activeElement && document.activeElement.matches('[data-nav]')) {
    window.scrollTo({ top: 0 });
  }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Service worker registration failed:', err));
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    pendingReload = true;
    if (document.hidden) return;
    // Reload now only if nothing is being edited; otherwise wait for the next return to the app.
    const editing = document.querySelector('.editor') || (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName));
    if (!editing) { persistSession(); location.reload(); }
  });
}

async function boot() {
  setupDevClock();
  applyMode(readPrefs().mode);
  applyGem();
  mountNotices();

  await claimWindow({ onLost: becomeReadOnly });
  loadAll();

  mountToday(document.getElementById('view-today'));
  mountLog(document.getElementById('view-log'));
  mountInsights(document.getElementById('view-insights'));
  mountSettings(document.getElementById('view-settings'));

  on((type) => {
    if (type === 'change') onChange();
    if (type === 'sync') renderSyncPill();
    if (type === 'window') {
      if (!S.readOnly) loadAll();
      renderWindowBanner(useHere);
      onChange();
      scheduleCloudSync({ force: true });
    }
  });

  startRouter(onRoute);
  renderSyncPill();
  renderWindowBanner(useHere);
  document.getElementById('syncPill').addEventListener('click', () => { location.hash = '#/settings'; });

  setInterval(tick, 1000);
  setInterval(autosave, 30000);
  setInterval(() => { if (!document.hidden) scheduleCloudSync({ minInterval: 120000 }); }, 60000);

  // Multi-device sync: on startup, when returning to the app, when the
  // connection comes back, and every couple of minutes while open.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (!S.readOnly) saveData();
      scheduleCloudSync({ force: true, keepalive: true });
    } else {
      if (pendingReload && !document.querySelector('.editor')) { location.reload(); return; }
      tick();
      onChange();
      scheduleCloudSync({ minInterval: 15000 });
    }
  });
  window.addEventListener('pagehide', () => { if (!S.readOnly) { persistSession(); saveData(); } });
  window.addEventListener('online', () => { emit('sync'); scheduleCloudSync({ force: true }); });
  window.addEventListener('offline', () => emit('sync'));
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeColor);

  // A view-only window follows the active one through storage events.
  window.addEventListener('storage', (e) => {
    if (!S.readOnly) return;
    if (!e.key || e.key.startsWith('flowFocus')) {
      loadAll();
      onChange();
    }
  });

  scheduleCloudSync({ force: true });
  recapCheck();
  registerServiceWorker();
  document.documentElement.classList.add('is-ready');
}

boot();
