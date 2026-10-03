// Today: the work card (today's dial, which flips to its break face during a
// break, the break line, one button), the week as seven dials, and the
// Today / Week / To goal tiles.
import { S } from '../state.js';
import { h, icon, clear, setText } from './dom.js';
import { createWorkDial, createBreakDial, miniDial, stone } from './dial.js';
import { deriveTodayState } from '../today-state.js';
import { liveTodaySeconds, liveWeekData, getIntent, setIntent } from '../store.js';
import { startTimer, pauseTimer, finishDay, keepGap, trimGap } from '../timer.js';
import { startBreak, endBreak, breakActive, breakRemainingSeconds, breakUsedToday } from '../breaks.js';
import { weekSeries, weekPace } from '../insights.js';
import { DAILY_GOAL, WEEKLY_GOAL } from '../config.js';
import { gemFor } from '../gems.js';
import { todayKey, today, isOffDay, weekdayLong, weekdayShort, parseDateKey } from '../dates.js';
import { formatHM, formatRemaining, formatClock, formatTimeOfDay } from '../format.js';

let els = null;
let workDial = null;
let breakDial = null;
let lastActionSig = '';
let lastWeekSig = '';
let lastGapSig = '';
let intentTimer = null;
let intentKey = null;
let face = 'work';
let flipTimer = null;
let firstRender = true;

function hmWords(seconds) {
  const s = Math.floor(seconds);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  if (!s) return 'nothing logged';
  if (!hh) return `${mm} minutes`;
  return `${hh} hour${hh === 1 ? '' : 's'}${mm ? ` ${mm} minutes` : ''}`;
}

const minutes = (s) => `${Math.floor(Math.max(0, s) / 60)}m`;

export function mountToday(root) {
  workDial = createWorkDial();
  breakDial = createBreakDial();

  const primary = h('button', { class: 'btn btn-primary btn-block', type: 'button', id: 'primaryAction' }, [
    h('span', { class: 'btn-glyph' }), h('span', { class: 'btn-label' }), h('span', { class: 'btn-meta num', 'aria-hidden': 'true' })
  ]);
  primary.addEventListener('click', onPrimary);

  const finish = h('button', { class: 'btn-text', type: 'button' }, 'Finish day');
  finish.addEventListener('click', () => finishDay());

  const breakBtn = h('button', { class: 'btn btn-quiet btn-small btn-break', type: 'button' }, 'Take a break');
  breakBtn.addEventListener('click', () => startBreak());

  const intent = h('input', {
    class: 'note-input', id: 'intentInput', type: 'text', maxlength: '140',
    placeholder: 'What are you working on?', autocomplete: 'off', enterkeyhint: 'done'
  });
  intent.addEventListener('input', () => {
    clearTimeout(intentTimer);
    const key = intentKey;
    intentTimer = setTimeout(() => setIntent(key, intent.value), 400);
  });
  intent.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); setIntent(intentKey, intent.value); intent.blur(); }
  });
  intent.addEventListener('blur', () => setIntent(intentKey, intent.value));

  els = {
    gap: h('div', { class: 'gap-slot' }),
    heading: h('h2', { class: 'label', id: 'workHeading' }, 'Work session'),
    figure: h('p', { class: 'figure num' }),
    statusLive: h('span', { role: 'status', 'aria-live': 'polite' }),
    statusExtra: h('span', { class: 'status-extra num' }),
    dialLabel: h('p', { class: 'visually-hidden' }),
    flip: h('div', { class: 'flip', 'data-face': 'work' }, [
      h('div', { class: 'flip-card' }, [
        h('div', { class: 'flip-face face-work' }, [workDial.el]),
        h('div', { class: 'flip-face face-break' }, [breakDial.el])
      ])
    ]),
    breakLine: h('div', { class: 'break-line' }),
    breakText: h('p', { class: 'break-line-text' }),
    breakBtn,
    finish,
    primary,
    intent,
    workCard: null,
    weekDials: h('ol', { class: 'week-dials', 'aria-label': 'This week, Saturday to Friday' }),
    tileToday: h('p', { class: 'tile-figure num' }),
    tileTodayStone: h('span', { class: 'tile-stone' }),
    tileWeek: h('p', { class: 'tile-figure num' }),
    tileGoal: h('p', { class: 'tile-figure num' }),
    tileGoalSub: h('p', { class: 'tile-sub' })
  };
  els.breakLine.append(icon('cup', 'break-line-icon'), els.breakText);

  els.workCard = h('article', { class: 'card work-card', 'aria-labelledby': 'workHeading' }, [
    h('header', { class: 'card-head' }, [els.heading, finish]),
    els.figure,
    h('p', { class: 'status' }, [els.statusLive, els.statusExtra]),
    els.flip,
    els.dialLabel,
    els.breakLine,
    primary,
    h('label', { class: 'note' }, [h('span', { class: 'visually-hidden' }, 'Working on'), icon('pencil', 'note-icon'), intent])
  ]);

  clear(root);
  root.append(
    h('h1', { class: 'visually-hidden' }, 'Today'),
    els.gap,
    els.workCard,
    h('article', { class: 'card week-card', 'aria-labelledby': 'weekHeading' }, [
      h('header', { class: 'card-head' }, [h('h2', { class: 'label', id: 'weekHeading' }, 'This week')]),
      els.weekDials
    ]),
    h('div', { class: 'tiles' }, [
      h('article', { class: 'tile', 'aria-labelledby': 'tileTodayH' }, [
        h('div', {}, [h('h3', { class: 'label', id: 'tileTodayH' }, 'Today'), els.tileToday]),
        els.tileTodayStone
      ]),
      h('article', { class: 'tile', 'aria-labelledby': 'tileWeekH' }, [
        h('div', {}, [h('h3', { class: 'label', id: 'tileWeekH' }, 'Week'), els.tileWeek, h('p', { class: 'tile-sub' }, 'of 30h')]),
        h('span', { class: 'tile-stone' }, [stone('clear', 34)])
      ]),
      h('article', { class: 'tile', 'aria-labelledby': 'tileGoalH' }, [
        h('div', {}, [h('h3', { class: 'label', id: 'tileGoalH' }, 'To goal'), els.tileGoal, els.tileGoalSub]),
        h('span', { class: 'tile-stone' }, [stone('clear', 34)])
      ])
    ])
  );
  renderToday();
}

function currentState() {
  const ref = today();
  const pace = weekPace(liveWeekData(), ref);
  return deriveTodayState({
    isRunning: S.isRunning,
    pausedTime: S.pausedTime,
    todaySeconds: S.todaySeconds,
    todayTotal: liveTodaySeconds(),
    breakActive: breakActive(),
    breakUsed: breakUsedToday(),
    breakCappedAt: S.breakCappedAt,
    doneAt: S.doneAt,
    offDay: isOffDay(ref),
    weekMet: pace.met
  });
}

function onPrimary() {
  const st = currentState();
  if (st.primary.action === 'start') startTimer();
  else if (st.primary.action === 'pause') pauseTimer();
  else if (st.primary.action === 'resume-from-break') endBreak();
}

// Flip the dial between its work and break faces. Only one face is ever
// displayed, so nothing depends on backface hiding: the card turns edge-on,
// the face swaps, and it turns back.
function setFace(next) {
  if (next === face) return;
  face = next;
  const el = els.flip;
  clearTimeout(flipTimer);
  const still = firstRender || matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden || !el.isConnected || el.offsetParent === null;
  if (still) {
    el.classList.remove('is-turning-out', 'is-turning-in', 'is-turned');
    el.dataset.face = next;
    return;
  }
  el.classList.remove('is-turning-in', 'is-turned');
  el.classList.add('is-turning-out');
  flipTimer = setTimeout(() => {
    el.dataset.face = next;
    el.classList.remove('is-turning-out');
    el.classList.add('is-turned');
    void el.offsetWidth; // commit the edge-on start before turning back
    el.classList.remove('is-turned');
    el.classList.add('is-turning-in');
    flipTimer = setTimeout(() => el.classList.remove('is-turning-in'), 320);
  }, 240);
}

export function renderToday() {
  if (!els) return;
  const ref = today();
  const key = todayKey();
  const gem = gemFor(ref).id;
  const total = liveTodaySeconds();
  const st = currentState();
  const onBreak = st.state === 'on-break';
  const used = breakUsedToday();
  const left = breakRemainingSeconds();

  if (intentKey !== key) {
    intentKey = key;
    els.intent.value = getIntent(key);
  }
  els.intent.disabled = S.readOnly;

  // work card
  els.workCard.dataset.state = st.state;
  workDial.update(total, gem);
  breakDial.update(used);
  // The face stays on the break side at the 30-minute stop, full, until Back to work.
  const capped = st.state === 'break-exhausted';
  setFace(onBreak || capped ? 'break' : 'work');
  setText(els.figure, formatHM(total));
  const { live, extra } = statusLine(st, total);
  setText(els.statusLive, live);
  setText(els.statusExtra, extra);
  setText(els.dialLabel, onBreak || capped
    ? `Break dial: ${minutes(used)} of 30 used, ${minutes(Math.ceil(left / 60) * 60)} left.`
    : `Today's dial: ${hmWords(total)} of 6 hours.`);

  // break line
  els.breakLine.classList.toggle('is-active', onBreak || capped);
  const leftText = minutes(Math.ceil(left / 60) * 60);
  let breakText;
  if (onBreak) breakText = [h('strong', {}, 'On break'), ` · ${minutes(used)} used · ${leftText} left`];
  else if (capped) breakText = [h('strong', {}, '30m used'), ' · break over'];
  else if (st.breakAllUsed) breakText = [h('strong', {}, '30m used'), ' · no break left today'];
  else if (used > 0) breakText = [h('strong', {}, `${minutes(used)} used`), ` · ${leftText} left`];
  else breakText = [h('strong', {}, 'Break'), ' · 30m available'];
  const textSig = JSON.stringify(breakText.map((p) => (typeof p === 'string' ? p : p.textContent)));
  if (els.breakText.dataset.sig !== textSig) {
    els.breakText.dataset.sig = textSig;
    clear(els.breakText).append(...breakText);
  }

  // controls, rebuilt only when the state changes
  const sig = `${st.state}|${st.canBreak}|${st.breakAllUsed}|${S.readOnly}`;
  if (sig !== lastActionSig) {
    lastActionSig = sig;
    const p = st.primary;
    clear(els.primary.querySelector('.btn-glyph')).appendChild(icon(p.icon));
    setText(els.primary.querySelector('.btn-label'), p.label);
    els.primary.disabled = S.readOnly;
    els.primary.dataset.action = p.action;
    els.primary.setAttribute('aria-label', p.label === 'Start' ? 'Start work' : p.label);

    const canFinish = st.secondary.some((a) => a.action === 'finish');
    els.finish.hidden = !canFinish;
    els.finish.disabled = S.readOnly;

    const showBreakBtn = !onBreak && st.canBreak;
    if (showBreakBtn && !els.breakBtn.isConnected) els.breakLine.appendChild(els.breakBtn);
    if (!showBreakBtn && els.breakBtn.isConnected) els.breakBtn.remove();
    els.breakBtn.disabled = S.readOnly;
  }

  // The running stretch rides on the button; a break doesn't reset it.
  const meta = els.primary.querySelector('.btn-meta');
  const showStretch = st.state === 'working' || st.state === 'paused' || st.state === 'on-break' || st.state === 'break-exhausted';
  setText(meta, showStretch ? formatClock(S.todaySeconds) : '');

  renderWeek(ref, gem, total);
  renderGap();
  firstRender = false;
}

// The goal always sits beside the figure: "Today · 6h goal · 2h 15m to go".
function statusLine(st, total) {
  const toGoal = Math.max(0, DAILY_GOAL - total);
  const goal = total === 0 ? ' · 6h goal' : (toGoal > 0 ? ` · 6h goal · ${formatRemaining(toGoal)} to go` : ' · 6h goal reached');
  switch (st.state) {
    case 'working': return { live: 'Working', extra: goal };
    case 'paused': return { live: 'Paused', extra: goal };
    case 'on-break': return { live: 'On break', extra: goal };
    case 'break-exhausted': return { live: 'Break over', extra: ' · stopped at 30m' };
    case 'day-done': return { live: `Day closed at ${formatTimeOfDay(S.doneAt)}`, extra: goal };
    default: return { live: st.offDay ? 'Rest day' : 'Today', extra: st.offDay && total === 0 ? ' · anything logged still counts' : goal };
  }
}

function renderWeek(ref, gem, total) {
  const data = liveWeekData();
  const days = weekSeries(data, ref);
  const pace = weekPace(data, ref);
  const sig = days.map((d) => `${d.key}:${Math.floor(d.seconds / 60)}`).join('|');
  if (sig !== lastWeekSig) {
    lastWeekSig = sig;
    clear(els.weekDials);
    for (const d of days) {
      const value = d.seconds ? formatHM(d.seconds) : (d.off ? 'Rest' : '–');
      const label = `${weekdayLong(d.date)}${d.isToday ? ' (today)' : ''}: ${d.seconds ? hmWords(d.seconds) : (d.off ? 'rest day' : 'nothing logged')}`;
      els.weekDials.appendChild(h('li', { class: `wd${d.isToday ? ' is-today' : ''}${d.off ? ' is-off' : ''}${d.isFuture ? ' is-future' : ''}` }, [
        h('a', { class: 'wd-link', href: d.isFuture ? null : `#/log/${d.key}`, 'aria-label': label, 'aria-disabled': d.isFuture ? 'true' : null }, [
          h('span', { class: 'wd-day' }, weekdayShort(d.date).slice(0, 2).toUpperCase()),
          miniDial({ seconds: d.seconds, gem: d.gem, off: d.off, isToday: d.isToday, isFuture: d.isFuture, size: 44 }),
          h('span', { class: 'wd-hours num' }, value)
        ])
      ]));
    }
  }

  // tiles
  setText(els.tileToday, formatHM(total));
  if (els.tileTodayStone.dataset.gem !== gem) {
    els.tileTodayStone.dataset.gem = gem;
    clear(els.tileTodayStone).appendChild(stone(gem, 34));
  }
  setText(els.tileWeek, formatHM(pace.total));
  setText(els.tileGoal, pace.met ? 'Done' : formatRemaining(pace.remaining));
  const leftNames = pace.workdaysLeft > 3 ? `${pace.workdaysLeft} workdays` : pace.workdaysLeftNames.join(', ');
  setText(els.tileGoalSub, pace.met ? `${formatHM(pace.total - WEEKLY_GOAL)} over` : (pace.workdaysLeft ? leftNames : 'this week'));
}

function timeValue(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function renderGap() {
  const g = S.gapReview;
  const sig = g ? `${g.kind}|${g.dayKey}|${g.lastSeenAt}` : '';
  if (sig === lastGapSig) return;
  lastGapSig = sig;
  clear(els.gap);
  if (!g) return;
  const dayName = weekdayLong(parseDateKey(g.dayKey));
  const seen = formatTimeOfDay(g.lastSeenAt);
  const text = g.kind === 'carried'
    ? `${dayName}’s timer was still running when FlowFocus closed, so it was counted until midnight. FlowFocus was last open at ${seen}.`
    : g.kind === 'asleep'
      ? `The timer kept counting while this device was asleep, since ${seen}.`
      : `The timer kept counting while FlowFocus was closed, since ${seen}.`;
  const timeInput = h('input', { type: 'time', class: 'gap-time', value: timeValue(g.lastSeenAt), 'aria-label': 'Stop time' });
  const keep = h('button', { class: 'btn btn-soft btn-small', type: 'button' }, g.kind === 'carried' ? 'Keep it' : 'Keep counting');
  const trim = h('button', { class: 'btn btn-primary btn-small', type: 'button' }, 'Stop it at this time');
  keep.addEventListener('click', () => keepGap());
  trim.addEventListener('click', () => {
    const [hh, mm] = (timeInput.value || '').split(':').map(Number);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return;
    const base = parseDateKey(g.dayKey);
    base.setHours(hh, mm, 0, 0);
    trimGap(base.getTime());
  });
  els.gap.appendChild(h('div', { class: 'card banner banner-gap', role: 'region', 'aria-label': 'Check the time counted' }, [
    h('p', { class: 'banner-text' }, text),
    h('div', { class: 'banner-actions' }, [h('label', { class: 'gap-field' }, [h('span', {}, 'Stopped at'), timeInput]), trim, keep])
  ]));
}
