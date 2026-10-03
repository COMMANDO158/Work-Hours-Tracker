// Log: every week, newest first. Any past or current day can be corrected in
// place; nothing opens a modal.
import { S, notify } from '../state.js';
import { h, icon, clear, setText } from './dom.js';
import { miniDial, rosette, weekDial } from './dial.js';
import { liveWeekData, liveTodaySeconds, setDayTotal, getIntent, setIntent, readIntents } from '../store.js';
import { weekSeries } from '../insights.js';
import {
  today, todayKey, addDays, weekStart, weekdayLong, parseDateKey
} from '../dates.js';
import { formatHM, formatEditable, formatShortDate, parseDuration, clampDay } from '../format.js';
import { MAX_DAY } from '../config.js';

let root = null;
let weeksShown = 4;
let openKey = null;
let draft = null; // { key, base, steps, typed, text, note }
let todayRow = null;

// "Sep 12 – 18", or "Aug 29 – Sep 4" across a month.
function rangeText(start) {
  const end = addDays(start, 6);
  if (start.getMonth() === end.getMonth()) return `${formatShortDate(start)} – ${end.getDate()}`;
  return `${formatShortDate(start)} – ${formatShortDate(end)}`;
}

function weekTitle(start, ref) {
  const thisStart = weekStart(ref);
  const diff = Math.round((thisStart - start) / (7 * 86400000));
  if (diff === 0) return 'This week';
  if (diff === 1) return 'Last week';
  return rangeText(start);
}

function hoursLabel(seconds) {
  const s = Math.floor(seconds);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  if (!s) return 'nothing logged';
  return `${hh ? `${hh} hour${hh === 1 ? '' : 's'} ` : ''}${mm} minutes`;
}

export function mountLog(el) {
  root = el;
  renderLog();
}

export function openDay(key) {
  if (!root) return;
  const ref = today();
  if (key > todayKey()) return;
  // Make sure that week is rendered.
  const weeksBack = Math.round((weekStart(ref) - weekStart(parseDateKey(key))) / (7 * 86400000));
  if (weeksBack + 1 > weeksShown) weeksShown = weeksBack + 1;
  startDraft(key);
  renderLog();
  requestAnimationFrame(() => {
    const row = root.querySelector(`[data-key="${key}"]`);
    if (row) {
      row.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      const input = row.querySelector('.editor-hours');
      if (input) input.focus({ preventScroll: true });
    }
  });
}

function startDraft(key) {
  const base = key === todayKey() ? liveTodaySeconds() : (S.weekData[key] || 0);
  openKey = key;
  draft = { key, base, steps: 0, typed: false, text: formatEditable(base), note: getIntent(key), error: '' };
}

function closeDraft() {
  openKey = null;
  draft = null;
  renderLog();
}

function draftValue() {
  if (!draft) return 0;
  if (draft.typed) return parseDuration(draft.text);
  const live = draft.key === todayKey() ? liveTodaySeconds() : (S.weekData[draft.key] || 0);
  return clampDay(live + draft.steps);
}

function saveDraft() {
  if (!draft) return;
  const value = draftValue();
  if (value === null || !Number.isFinite(value)) {
    draft.error = 'That isn’t a time. Try 5:30, 5h30 or 5.5.';
    renderLog();
    return;
  }
  if (value > MAX_DAY) {
    draft.error = 'A day can’t hold more than 24 hours.';
    renderLog();
    return;
  }
  const { key, note } = draft;
  const result = setDayTotal(key, value);
  setIntent(key, note);
  openKey = null;
  draft = null;
  renderLog();
  if (result && result.changed) {
    const name = key === todayKey() ? 'Today' : weekdayLong(parseDateKey(key));
    const prev = result.prev;
    notify('Saved', `${name} is now ${formatHM(result.next)}.`, {
      action: { label: 'Undo', run: () => { setDayTotal(key, prev); renderLog(); } }
    });
  }
}

export function renderLog() {
  if (!root) return;
  const ref = today();
  const data = liveWeekData();
  const intents = readIntents();
  const tKey = todayKey();
  const focused = document.activeElement;
  const refocus = focused && root.contains(focused) && focused.classList.contains('editor-hours') ? 'hours'
    : focused && root.contains(focused) && focused.classList.contains('editor-note') ? 'note' : null;

  clear(root);
  todayRow = null;
  root.appendChild(h('header', { class: 'view-head' }, [
    h('h1', { class: 'view-title' }, 'Log'),
    h('p', { class: 'view-lede' }, 'Tap a day to correct its hours or its note.')
  ]));

  for (let i = 0; i < weeksShown; i++) {
    const start = addDays(weekStart(ref), -7 * i);
    const days = weekSeries(data, start).map((d) => ({ ...d, isToday: d.key === tKey, isFuture: d.key > tKey }));
    const total = days.reduce((s, d) => s + d.seconds, 0);
    const title = weekTitle(start, ref);
    const list = h('ol', { class: 'day-list' });

    for (const d of days) list.appendChild(dayRow(d, intents[d.key]));

    root.appendChild(h('section', { class: 'log-week', 'aria-label': title }, [
      h('header', { class: 'log-week-head' }, [
        i === 0
          ? rosette({ days, size: 56, isCurrent: true, label: `${title}: ${hoursLabel(total)} of 30 hours` })
          : weekDial({ seconds: total, size: 56, label: `${title}: ${hoursLabel(total)} of 30 hours` }),
        h('div', { class: 'log-week-title' }, [
          h('h2', {}, title),
          i < 2 ? h('p', { class: 'log-week-range' }, rangeText(start)) : null
        ]),
        h('p', { class: 'log-week-total' }, [h('span', { class: 'num' }, formatHM(total)), h('span', { class: 'of' }, ' of 30h')])
      ]),
      list
    ]));
  }

  const more = h('button', { class: 'btn btn-quiet btn-more', type: 'button' }, 'Show 4 earlier weeks');
  more.addEventListener('click', () => { weeksShown += 4; renderLog(); });
  root.appendChild(more);

  if (refocus && openKey) {
    const el = root.querySelector(refocus === 'hours' ? '.editor-hours' : '.editor-note');
    if (el) { el.focus({ preventScroll: true }); const len = el.value.length; try { el.setSelectionRange(len, len); } catch { /* not text */ } }
  }
}

function dayRow(d, note) {
  const name = weekdayLong(d.date);
  const dateText = formatShortDate(d.date);
  const open = openKey === d.key;
  const meta = note || (d.off ? 'Rest day' : '');
  const hours = h('span', { class: 'day-hours num' }, d.seconds ? formatHM(d.seconds) : '–');
  const dial = miniDial({ seconds: d.seconds, gem: d.gem, off: d.off, isToday: d.isToday, isFuture: d.isFuture, size: 34 });
  const inner = [
    dial,
    h('span', { class: 'day-name' }, [h('span', { class: 'day-weekday' }, name), d.isToday ? h('span', { class: 'day-pill' }, 'Today') : h('span', { class: 'day-date' }, dateText)]),
    h('span', { class: `day-meta${note ? ' has-note' : ''}` }, meta),
    hours
  ];

  const li = h('li', { class: `day-row${d.isToday ? ' is-today' : ''}${d.off ? ' is-off' : ''}${d.isFuture ? ' is-future' : ''}${open ? ' is-open' : ''}`, 'data-key': d.key });
  if (d.isFuture || S.readOnly) {
    li.appendChild(h('div', { class: 'day-main', 'aria-label': `${name} ${dateText}: ${d.isFuture ? 'upcoming' : hoursLabel(d.seconds)}` }, inner));
  } else {
    const btn = h('button', {
      class: 'day-main', type: 'button', 'aria-expanded': open ? 'true' : 'false',
      'aria-controls': `editor-${d.key}`,
      'aria-label': `${name} ${dateText}: ${hoursLabel(d.seconds)}${note ? `, note: ${note}` : ''}. Edit`
    }, inner);
    btn.addEventListener('click', () => {
      if (openKey === d.key) closeDraft();
      else { startDraft(d.key); renderLog(); requestAnimationFrame(() => { const i = root.querySelector('.editor-hours'); if (i) i.focus(); }); }
    });
    li.appendChild(btn);
  }
  if (d.isToday) todayRow = { hours, li, d };
  if (open && draft) li.appendChild(editor(d));
  return li;
}

function editor(d) {
  const shown = draft.typed ? draft.text : formatEditable(draftValue());
  const input = h('input', {
    class: 'editor-hours', id: `hours-${d.key}`, type: 'text', inputmode: 'decimal', autocomplete: 'off',
    value: shown, 'aria-describedby': `hint-${d.key}`, 'aria-invalid': draft.error ? 'true' : null
  });
  input.addEventListener('input', () => { draft.typed = true; draft.text = input.value; draft.error = ''; errorEl.textContent = ''; });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveDraft(); }
    if (e.key === 'Escape') { e.preventDefault(); closeDraft(); }
  });

  const step = (delta, label) => {
    const b = h('button', { class: 'step', type: 'button', 'aria-label': `${delta > 0 ? 'Add' : 'Remove'} ${label}` }, `${delta > 0 ? '+' : '−'}${label}`);
    b.addEventListener('click', () => {
      // Steps move relative to the live value, so a running timer keeps its seconds.
      const live = d.key === todayKey() ? liveTodaySeconds() : (S.weekData[d.key] || 0);
      let current = live + draft.steps;
      if (draft.typed) {
        const parsed = parseDuration(draft.text);
        if (parsed !== null) current = parsed;
        draft.typed = false;
      }
      const nextVal = clampDay(current + delta);
      draft.steps = nextVal - live;
      draft.error = '';
      errorEl.textContent = '';
      input.value = formatEditable(nextVal);
    });
    return b;
  };

  const note = h('input', {
    class: 'editor-note', id: `note-${d.key}`, type: 'text', maxlength: '140', autocomplete: 'off',
    value: draft.note || '', placeholder: 'What you worked on (optional)'
  });
  note.addEventListener('input', () => { draft.note = note.value; });
  note.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveDraft(); }
    if (e.key === 'Escape') { e.preventDefault(); closeDraft(); }
  });

  const errorEl = h('p', { class: 'editor-error', role: 'alert' }, draft.error || '');
  const save = h('button', { class: 'btn btn-ink', type: 'button' }, [icon('check'), h('span', {}, 'Save')]);
  const cancel = h('button', { class: 'btn btn-quiet', type: 'button' }, 'Cancel');
  save.addEventListener('click', saveDraft);
  cancel.addEventListener('click', closeDraft);

  return h('div', { class: 'editor', id: `editor-${d.key}` }, [
    h('div', { class: 'editor-row' }, [
      h('label', { class: 'editor-label', for: `hours-${d.key}` }, d.key === todayKey() ? 'Today’s hours' : 'Hours'),
      h('div', { class: 'editor-stepper' }, [step(-1800, '30m'), step(-900, '15m'), input, step(900, '15m'), step(1800, '30m')]),
      h('p', { class: 'editor-hint', id: `hint-${d.key}` }, d.key === todayKey() && S.isRunning
        ? 'Type 5:30, 5h30 or 5.5. The timer keeps running from the new total.'
        : 'Type 5:30, 5h30 or 5.5.')
    ]),
    errorEl,
    h('label', { class: 'editor-label', for: `note-${d.key}` }, 'Note'),
    note,
    h('div', { class: 'editor-actions' }, [cancel, save])
  ]);
}

// Once a minute: keep today's row current without rebuilding the list.
export function tickLog() {
  if (!todayRow || openKey === todayRow.d.key) return;
  const s = liveTodaySeconds();
  setText(todayRow.hours, s ? formatHM(s) : '–');
  const old = todayRow.li.querySelector('svg.mini');
  if (old) old.replaceWith(miniDial({ seconds: s, gem: todayRow.d.gem, off: todayRow.d.off, isToday: true, size: 34 }));
}
