// Today: the flood. The day's gem colour fills the screen from the bottom up,
// full at 6h, with today's hours riding on the level line and the one thing to
// do under them. Beside it (or a swipe away on a phone), the week as seven
// filled numerals.
//
// Rendered every second, so everything is built once and updated in place:
// text only when it changes, levels only when the minute changes. The flood and
// the figures move by clip-path and transform transitions read from plain
// custom properties (--level, --cut, --fig-y), never by per-frame script.
import { S } from '../state.js';
import { h, clear, setText, setAttr, setVar } from './dom.js';
import { nf, setNf, rise, release } from './numeral.js';
import { gem as gemStone } from './gem.js';
import { mountNav, renderShellToday } from './shell.js';
import { deriveTodayState } from '../today-state.js';
import { liveTodaySeconds, liveWeekData, getIntent, setIntent, readIntents } from '../store.js';
import { startTimer, pauseTimer, finishDay, keepGap, trimGap } from '../timer.js';
import { startBreak, endBreak, breakActive, breakRemainingSeconds, breakUsedToday } from '../breaks.js';
import { weekSeries, weekPlan } from '../insights.js';
import { DAILY_GOAL, WEEKLY_GOAL } from '../config.js';
import { todayKey, today, isOffDay, weekdayLong, weekdayShort, parseDateKey, weekStart, getDateKey } from '../dates.js';
import { formatHM, formatRemaining, formatClock, formatMinSec, formatTimeOfDay } from '../format.js';
import { mono, spoken, hmParts, dayLevel, longDate, shortDate, range } from './words.js';

const phoneMq = matchMedia('(max-width: 719px)');
const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');

const PRIMARY = {
  'idle-fresh': 'Start work',
  idle: 'Start work',
  working: 'Pause',
  paused: 'Resume',
  'on-break': 'Back to work',
  'break-exhausted': 'Back to work',
  'day-done': 'Start again'
};

let els = null;
let week = null;          // { key, rows }
let intentKey = null;
let intentTimer = null;
let lastState = null;
let lastFigMin = -1;
let lastWeekSig = '';
let lastGapSig = null;
let fitted = 0;
let rising = true;        // the first paint holds the flood at 0 so it rises in

// ------------------------------------------------------------- markup

// "4h 15m" with the units set small. The hour part hides below an hour.
const FIG = '<span class="u">h</span><span class="u">m</span>';
const two = (cls, inner) => `<p class="ink2 ${cls}"${cls === 'figure' ? ' aria-hidden="true"' : ''}><span class="i-dry">${inner}</span><span class="i-wet" aria-hidden="true">${inner}</span></p>`;
const SCALE = [1, 2, 3, 4, 5, 6].map((n) => `<li class="${n === 6 ? 'six' : ''}" style="--h:${n}"><span>${n}h</span></li>`).join('');

const TEMPLATE = `
<section class="stage pane" id="stage" data-state="idle-fresh" aria-labelledby="day-title">
  <div class="flood" aria-hidden="true"><ol class="scale">${SCALE}</ol></div>
  <div class="display">
    <ol class="scale" aria-hidden="true">${SCALE}</ol>
    <div class="band" aria-hidden="true" hidden></div>
    <div class="band-line" aria-hidden="true" hidden><span class="band-label">The break ends at this line</span></div>
    <div class="readout">
      <p class="sr-only" data-k="figure-sr"></p>
      ${two('figure', FIG)}
      ${two('status', '<strong data-k="label"></strong><span class="clock" data-k="clock"></span><span class="clock-note" data-k="note"></span>')}
      ${two('subline', '<span data-k="sub"></span>')}
    </div>
    <p class="figure figure-probe" aria-hidden="true"><span>6<span class="u">h</span> 48<span class="u">m</span></span></p>
  </div>

  <header class="top">
    <div class="mark" data-ink>
      <span class="seat gem-host" id="seat"></span>
      <div>
        <h1 id="day-title" tabindex="-1"></h1>
        <p class="sub"><span id="todayDate"></span> · <span class="sync" data-sync-label></span></p>
      </div>
    </div>
    <nav class="nav" aria-label="Screens" data-ink data-nav-host="nav-a"></nav>
    <div class="menu-wrap" data-ink>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="todayMenu">Menu</button>
      <div class="menu" id="todayMenu" data-menu hidden></div>
    </div>
  </header>

  <div class="controls">
    <div class="gap-slot"></div>
    <div class="note" data-ink>
      <label for="intentInput">Working on</label>
      <input id="intentInput" type="text" maxlength="140" autocomplete="off" enterkeyhint="done" placeholder="Add a note">
    </div>
    <button class="btn btn-primary" id="primaryAction" type="button" data-ink>Start work</button>
    <div class="secondary">
      <button class="btn" id="breakAction" type="button" data-ink>Take a break</button>
      <button class="btn" id="finishAction" type="button" data-ink>Finish day</button>
    </div>
    <button class="week-link" type="button" data-ink aria-controls="week">
      <span class="wl-sum"></span><span class="wl-go">Week ›</span>
    </button>
  </div>

  <p class="sr-only" aria-live="polite" data-k="announce"></p>
</section>

<section class="week pane" id="week" aria-labelledby="week-title">
  <div class="week-head-row">
    <h2 id="week-title">This week <span class="range"></span></h2>
    <button class="back-link" type="button">‹ Today</button>
  </div>
  <p class="week-total"><span class="big">${FIG}</span><span class="week-of">of 30h</span></p>
  <div class="bar" aria-hidden="true"><span></span></div>
  <p class="week-plan"><strong></strong><span></span></p>
  <div class="wk-wrap">
    <ol class="wk-days" aria-label="Saturday to Friday"></ol>
  </div>
  <div class="week-foot">
    <p class="week-key">Each figure is full at 6h.</p>
    <a href="#/log">Log ›</a>
  </div>
</section>`;

// ------------------------------------------------------------- mount

export function mountToday(root) {
  root.innerHTML = TEMPLATE;
  const q = (s) => root.querySelector(s);
  const all = (k) => [...root.querySelectorAll(`[data-k="${k}"]`)];
  els = {
    root,
    panes: root,
    stage: q('#stage'),
    readout: q('.readout'),
    figure: q('.readout .figure'),
    figGroups: [...q('.readout .figure').children],
    probe: q('.figure-probe'),
    inks: [...root.querySelectorAll('.readout .ink2')],
    top: q('.top'),
    controls: q('.controls'),
    band: q('.band'),
    bandLine: q('.band-line'),
    figureSr: all('figure-sr')[0],
    label: all('label'),
    clock: all('clock'),
    note: all('note'),
    sub: all('sub'),
    announce: all('announce')[0],
    gap: q('.gap-slot'),
    intent: q('#intentInput'),
    primary: q('#primaryAction'),
    breakBtn: q('#breakAction'),
    finish: q('#finishAction'),
    weekLink: q('.week-link'),
    wlSum: q('.wl-sum'),
    weekPane: q('#week'),
    backLink: q('.back-link'),
    range: q('.week h2 .range'),
    weekBig: q('.week-total .big'),
    bar: q('.week .bar > span'),
    planLead: q('.week-plan strong'),
    planRest: q('.week-plan span'),
    weekKey: q('.week-key'),
    days: q('.wk-days')
  };

  mountNav(root);

  els.primary.addEventListener('click', onPrimary);
  els.breakBtn.addEventListener('click', () => startBreak());
  els.finish.addEventListener('click', () => { finishDay(); els.primary.focus(); });

  const intent = els.intent;
  intent.addEventListener('input', () => {
    clearTimeout(intentTimer);
    const key = intentKey;
    intentTimer = setTimeout(() => setIntent(key, intent.value), 400);
  });
  intent.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); intent.blur(); }
  });
  intent.addEventListener('blur', () => { clearTimeout(intentTimer); setIntent(intentKey, intent.value); });

  const smooth = () => (reduceMq.matches ? 'auto' : 'smooth');
  els.weekLink.addEventListener('click', () => els.panes.scrollTo({ left: els.panes.clientWidth, behavior: smooth() }));
  els.backLink.addEventListener('click', () => {
    els.panes.scrollTo({ left: 0, behavior: smooth() });
    els.weekLink.focus({ preventScroll: true });
  });

  addEventListener('resize', () => { fitted = 0; layoutNow(); });
  phoneMq.addEventListener('change', () => { fitted = 0; layoutNow(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fitted = 0; layoutNow(); });

  // First paint: the flood starts empty and rises to the day's level.
  renderToday(true);
  requestAnimationFrame(() => requestAnimationFrame(() => { rising = false; renderToday(true); }));
}

// ------------------------------------------------------------- state

function currentState(ref, total, data) {
  const days = weekSeries(data, ref);
  return deriveTodayState({
    isRunning: S.isRunning,
    pausedTime: S.pausedTime,
    todaySeconds: S.todaySeconds,
    todayTotal: total,
    breakActive: breakActive(),
    breakUsed: breakUsedToday(),
    breakCappedAt: S.breakCappedAt,
    doneAt: S.doneAt,
    offDay: isOffDay(ref),
    weekMet: days.reduce((s, d) => s + d.seconds, 0) >= WEEKLY_GOAL
  });
}

function onPrimary() {
  const ref = today();
  const total = liveTodaySeconds();
  const st = currentState(ref, total, liveWeekData());
  if (st.primary.action === 'start') startTimer();
  else if (st.primary.action === 'pause') pauseTimer();
  else if (st.primary.action === 'resume-from-break') endBreak();
}

// The words on the stage: the state, a clock, and one plain sentence.
function stageWords(st, total) {
  const left = DAILY_GOAL - total;
  const toSix = st.offDay
    ? 'A rest day: any time logged still counts toward the week.'
    : left > 0 ? `${formatRemaining(left)} to 6h today.`
      : st.state === 'working' ? '6h reached. The clock is still counting.' : '6h reached today.';
  switch (st.state) {
    case 'working':
      return { label: 'Working', clock: formatClock(S.todaySeconds), note: 'this session', sub: toSix };
    case 'paused':
      return { label: 'Paused', clock: '', note: '', sub: `The clock is stopped. ${toSix}` };
    case 'idle':
      return { label: 'Stopped', clock: '', note: '', sub: `The clock is stopped. ${toSix}` };
    case 'on-break':
      return { label: 'On break', clock: formatMinSec(breakRemainingSeconds()), note: 'of break left', sub: 'Break counts as work, up to the line above.' };
    case 'break-exhausted':
      return { label: 'Break used up', clock: '', note: '', sub: 'The day’s 30 break minutes are used, so the clock has stopped.' };
    case 'day-done':
      return { label: 'Day finished', clock: '', note: '', sub: `Finished at ${formatTimeOfDay(S.doneAt)}. Today is saved; start again if you come back to it.` };
    default:
      return st.offDay
        ? { label: 'Rest day', clock: '', note: '', sub: 'Nothing recorded today. It is a rest day; any time you log still counts toward the week.' }
        : { label: 'Not started', clock: '', note: '', sub: 'Nothing recorded yet today. The screen fills as you work, and is full at 6h.' };
  }
}

// The digits are text nodes beside the unit spans (made once, then rewritten in place).
const figNodes = new WeakMap();
function setFig(root, seconds) {
  let n = figNodes.get(root);
  if (!n) {
    const [hu, mu] = root.querySelectorAll('.u');
    n = { h: document.createTextNode(''), hu, m: document.createTextNode('') };
    root.insertBefore(n.h, hu);
    root.insertBefore(n.m, mu);
    figNodes.set(root, n);
  }
  const p = hmParts(seconds);
  if (n.h.nodeValue !== p.h) n.h.nodeValue = p.h;
  if (n.hu.hidden !== !p.h) n.hu.hidden = !p.h;
  const m = p.h ? ` ${p.m}` : p.m;
  if (n.m.nodeValue !== m) n.m.nodeValue = m;
}

const setAll = (list, text) => list.forEach((el) => setText(el, text));

// ------------------------------------------------------------- render

// full: also refresh what changes only on events (the week's notes, the gap check).
export function renderToday(full = false) {
  if (!els) return;
  const ref = today();
  const key = todayKey();
  const total = liveTodaySeconds();
  renderShellToday(total);

  if (intentKey !== key) {
    intentKey = key;
    els.intent.value = getIntent(key);
  }
  if (els.intent.disabled !== S.readOnly) els.intent.disabled = S.readOnly;

  // Away from Today only the shell needs the clock; the route back renders in full.
  if (!full && document.body.dataset.route !== 'today') return;

  const data = liveWeekData();
  const st = currentState(ref, total, data);
  const stage = els.stage;
  setAttr(stage, 'data-state', st.state);

  // the figure, once a minute
  const minute = Math.floor(total / 60);
  if (minute !== lastFigMin || full) {
    lastFigMin = minute;
    els.figGroups.forEach((g) => setFig(g, total));
    setText(els.figureSr, `Today so far: ${spoken(total)}${st.offDay ? '' : ' of 6 hours'}.`);
  }

  const w = stageWords(st, total);
  setAll(els.label, w.label);
  setAll(els.clock, w.clock);
  setAll(els.note, w.note);
  setAll(els.sub, w.sub);

  // the controls
  setText(els.primary, PRIMARY[st.state] || 'Start work');
  if (els.primary.disabled !== S.readOnly) els.primary.disabled = S.readOnly;
  const offerBreak = st.state === 'working' || st.state === 'paused' || st.state === 'idle';
  els.breakBtn.hidden = !offerBreak;
  const noBreak = st.breakAllUsed;
  setText(els.breakBtn, noBreak ? 'No break left today' : 'Take a break');
  const breakOff = S.readOnly || !offerBreak || !st.canBreak;
  if (els.breakBtn.disabled !== breakOff) els.breakBtn.disabled = breakOff;
  els.finish.hidden = !st.secondary.some((a) => a.action === 'finish');
  if (els.finish.disabled !== S.readOnly) els.finish.disabled = S.readOnly;

  if (st.state !== lastState) {
    if (lastState !== null) setText(els.announce, `${w.label}. ${formatHM(total)} today.`);
    lastState = st.state;
  }

  renderWeek(data, ref, st, full);
  renderGap();
  layout(total, st);
}

// ------------------------------------------------------------- layout: level, figure, controls, inks

function fit(W, H) {
  const w100 = els.probe.getBoundingClientRect().width;
  if (!w100) return;
  const cs = getComputedStyle(els.stage);
  const xAvail = W - parseFloat(cs.getPropertyValue('--x0')) - parseFloat(cs.getPropertyValue('--gut-r'));
  const size = Math.floor(Math.min((xAvail / w100) * 100, H * (phoneMq.matches ? 0.2 : 0.4), 400));
  setVar(els.stage, '--fig-size', `${Math.max(48, size)}px`);
  fitted = W * 10000 + H;
}

let lastTotal = 0;
let lastSt = null;
function layoutNow() {
  if (els && lastSt) layout(lastTotal, lastSt);
}

function layout(total, st) {
  lastTotal = total;
  lastSt = st;
  const stage = els.stage;
  if (document.body.dataset.route !== 'today') return;
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  if (!W || !H) return;
  if (fitted !== W * 10000 + H) fit(W, H);

  // The level moves once a minute, with the figure; the transition carries it.
  const shown = rising ? 0 : Math.floor(total / 60) * 60;
  const level = Math.min(1, shown / DAILY_GOAL);
  setVar(stage, '--level', level.toFixed(5));

  const onBreak = st.state === 'on-break';
  els.band.hidden = !onBreak;
  els.bandLine.hidden = !onBreak;
  if (onBreak) {
    const cap = Math.min(1, (Math.round((total + breakRemainingSeconds()) / 60) * 60) / DAILY_GOAL);
    setVar(stage, '--cap', cap.toFixed(5));
    setVar(stage, '--cap-y', `${Math.round(H * (1 - cap))}px`);
  }

  const { readout, figure, top, controls } = els;
  const levelY = H * (1 - level);
  const wide = !phoneMq.matches;
  const minY = top.offsetTop + top.offsetHeight + 36;
  // Wide screens: the controls ride directly under the status, so the day reads as one group.
  const gap = 40;
  const below = wide ? gap + controls.offsetHeight : 0;
  const floor = wide ? H - 36 : controls.offsetTop - 36;
  const maxY = floor - below - readout.offsetHeight;
  const y = Math.round(Math.max(minY, Math.min(levelY - figure.offsetHeight / 2, Math.max(minY, maxY))));
  setVar(stage, '--fig-y', `${y}px`);
  const ctlY = y + readout.offsetHeight + gap;
  if (wide) setVar(stage, '--ctl-y', `${ctlY}px`);

  // where the level crosses each two-ink line
  for (const el of els.inks) {
    const cut = Math.max(-400, Math.min(el.offsetHeight + 400, levelY - y - el.offsetTop));
    setVar(el, '--cut', `${Math.round(cut)}px`);
  }

  // Which side of the level each control sits on, from where it is going, not where it is mid-move.
  const sTop = stage.getBoundingClientRect().top;
  const cRect = controls.getBoundingClientRect();
  stage.querySelectorAll('[data-ink]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (!r.height) return;
    let mid = (r.top + r.bottom) / 2 - sTop;
    if (wide && controls.contains(el)) mid = ctlY + (r.top - cRect.top) + r.height / 2;
    const wet = mid > levelY;
    if (el.classList.contains('is-wet') !== wet) el.classList.toggle('is-wet', wet);
  });
}

// ------------------------------------------------------------- the week: seven filled numerals

function buildWeek(ref, data) {
  release(els.days);
  clear(els.days);
  const rows = weekSeries(data, ref).map((d) => {
    const sr = h('span', { class: 'sr-only' });
    const figure = nf('', 0);
    const gemSlot = h('span', { class: 'wk-gem' }, [gemStone(d.gem, 20, { motion: 'none' })]);
    const line = h('span', { class: 'wk-line' });
    const li = h('li', { class: 'wk-day', 'data-gem': d.gem }, [
      sr,
      figure,
      h('span', { class: 'wk-meta', 'aria-hidden': 'true' }, [
        h('span', { class: 'wk-name' }, [gemSlot, h('span', { class: 'long' }, weekdayLong(d.date)), h('span', { class: 'short' }, weekdayShort(d.date)), ' ', h('span', { class: 'date' }, shortDate(d.date))]),
        line
      ])
    ]);
    els.days.appendChild(li);
    return { key: d.key, li, nf: figure, line, sr };
  });
  week = { key: getDateKey(weekStart(ref)), rows };
  rise(els.days);
}

function renderWeek(data, ref, st, full) {
  const startKey = getDateKey(weekStart(ref));
  if (!week || week.key !== startKey) { buildWeek(ref, data); full = true; }
  const days = weekSeries(data, ref);
  const sig = `${days.map((d) => Math.floor(d.seconds / 60)).join(',')}|${st.state === 'day-done'}|${todayKey()}`;
  if (!full && sig === lastWeekSig) return;
  lastWeekSig = sig;

  const plan = weekPlan(data, ref, { todayClosed: st.state === 'day-done' });
  const per = plan.perWorkday;
  const n = plan.workdays.length;
  const notes = readIntents();

  setText(els.range, range(weekStart(ref), ref));
  setFig(els.weekBig, plan.total);
  setVar(els.bar, '--p', Math.min(1, plan.total / WEEKLY_GOAL).toFixed(4));
  if (plan.met) {
    setText(els.planLead, '30h reached.');
    setText(els.planRest, ' Any more time this week still counts.');
  } else if (!n) {
    setText(els.planLead, `${formatRemaining(plan.remaining)} to go.`);
    setText(els.planRest, ' No workdays are left this week; time on a rest day still counts.');
  } else {
    setText(els.planLead, `${formatRemaining(plan.remaining)} to go.`);
    setText(els.planRest, ` That is ${formatHM(per)} on ${n === 1 ? 'the one workday' : `each of the ${n} workdays`} left${plan.includesToday ? ', today included' : ''}.`);
  }
  setText(els.weekKey, per > 0 ? 'Each figure is full at 6h. The outlined ones are what each workday ahead needs.' : 'Each figure is full at 6h.');
  setText(els.wlSum, `This week ${formatHM(plan.total)} of 30h`);

  week.rows.forEach((row, i) => {
    const d = days[i];
    let text; let lvl; let words; let said;
    if (d.isFuture && d.off) {
      text = 'Rest'; lvl = 0; words = 'Rest day'; said = 'rest day';
    } else if (d.isFuture) {
      text = mono(per); lvl = 0; words = per ? 'Ahead' : 'Ahead, 30h already in';
      said = per ? `ahead, ${spoken(per)} would keep the week on 30 hours` : 'ahead';
    } else if (d.off && !d.seconds) {
      text = 'Rest'; lvl = 0; words = 'Rest day'; said = d.isToday ? 'rest day, today, nothing logged yet' : 'rest day, nothing logged';
    } else {
      text = mono(d.seconds); lvl = dayLevel(d.seconds);
      words = d.isToday ? 'Today' : [d.off ? 'Rest day' : '', notes[d.key] || ''].filter(Boolean).join(' · ') || ' ';
      said = `${spoken(d.seconds)}${d.isToday ? ', today so far' : ''}${d.off ? ', on a rest day' : ''}`;
    }
    setNf(row.nf, text, lvl);
    row.li.classList.toggle('is-today', d.isToday);
    setText(row.line, words);
    setText(row.sr, `${weekdayLong(d.date)} ${longDate(d.date)}: ${said}.`);
  });
}

// ------------------------------------------------------------- time counted while closed

function timeValue(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function renderGap() {
  const g = S.gapReview;
  const sig = g ? `${g.kind}|${g.dayKey}|${g.lastSeenAt}|${S.readOnly}` : '';
  if (sig === lastGapSig) return;
  lastGapSig = sig;
  const hadFocus = els.gap.contains(document.activeElement);
  clear(els.gap);
  if (!g) {
    if (hadFocus) els.primary.focus();
    return;
  }
  const dayName = weekdayLong(parseDateKey(g.dayKey));
  const seen = formatTimeOfDay(g.lastSeenAt);
  const text = g.kind === 'carried'
    ? `${dayName}’s timer was still running when FlowFocus closed, so it was counted until midnight. FlowFocus was last open at ${seen}.`
    : g.kind === 'asleep'
      ? `The timer kept counting while this device was asleep, since ${seen}. Keep that time, or stop it when you stopped working.`
      : `The timer kept counting while FlowFocus was closed, since ${seen}. Keep that time, or stop it when you stopped working.`;
  const input = h('input', { type: 'time', id: 'gapTime', value: timeValue(g.lastSeenAt), disabled: S.readOnly });
  const trim = h('button', { class: 'b b-solid', type: 'button', disabled: S.readOnly }, 'Stop it at this time');
  const keep = h('button', { class: 'b', type: 'button', disabled: S.readOnly }, g.kind === 'carried' ? 'Keep it' : 'Keep counting');
  keep.addEventListener('click', () => keepGap());
  trim.addEventListener('click', () => {
    const [hh, mm] = (input.value || '').split(':').map(Number);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) { input.focus(); return; }
    const base = parseDateKey(g.dayKey);
    base.setHours(hh, mm, 0, 0);
    trimGap(base.getTime());
  });
  els.gap.appendChild(h('div', { class: 'gap', role: 'region', 'aria-label': 'Check the time counted' }, [
    h('p', { class: 'gap-text' }, text),
    h('div', { class: 'gap-actions' }, [
      h('div', { class: 'field' }, [h('label', { for: 'gapTime' }, 'Stopped at'), input]),
      trim,
      keep
    ])
  ]));
}
