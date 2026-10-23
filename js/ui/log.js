// Log: every week, newest first, each day a filled numeral. Any past or current
// day can be corrected in place (clamped 0 to 24h); days ahead are read-only.
// Built once and updated in place, so an open correction survives the clock.
import { S, notify } from '../state.js';
import { h, clear, setText, setAttr, setVar } from './dom.js';
import { nf, setNf, rise, release } from './numeral.js';
import { gem as gemStone } from './gem.js';
import { liveWeekData, liveTodaySeconds, setDayTotal, getIntent, setIntent, readIntents } from '../store.js';
import { weekSeries, weekPlan, firstTrackedKey } from '../insights.js';
import { today, todayKey, addDays, weekStart, weekdayLong, parseDateKey, getDateKey, isDateKey, dayDiff } from '../dates.js';
import { formatHM, parseDuration } from '../format.js';
import { MAX_DAY, WEEKLY_GOAL } from '../config.js';
import { mono, spoken, dayLevel, longDate, shortDate, range } from './words.js';

const FIRST = 5;          // weeks shown before "Show earlier weeks"
const MORE = 8;           // weeks added each time
const HINT = 'Type 5:30, 5h 30m, 5.5 or 45m. A day holds 0 to 24h.';
const wideMq = matchMedia('(min-width: 1101px)');
const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');

let root = null;
let els = null;
let shown = FIRST;
let reach = 0;            // weeks a link into the log asked for, beyond what is tracked
let built = [];           // the weeks on screen, newest first
const rows = new Map();   // date key -> its day
let structSig = '';
let editing = null;       // { key, row }
let hoursDirty = false;

// ------------------------------------------------------------- mount

export function mountLog(el) {
  root = el;
  root.innerHTML = `
    <div class="page-head">
      <h1 tabindex="-1">Log</h1>
      <p class="lede">Every day, the newest week first. Forgot the timer? Tap the day to correct its hours or its note. Days ahead are read-only.</p>
    </div>
    <div class="log-weeks"></div>
    <div class="log-more">
      <button class="b" type="button">Show earlier weeks</button>
      <p></p>
    </div>
    <p class="sr-only" aria-live="polite"></p>`;
  els = {
    weeks: root.querySelector('.log-weeks'),
    more: root.querySelector('.log-more button'),
    moreNote: root.querySelector('.log-more p'),
    announce: root.querySelector('p.sr-only[aria-live]')
  };

  // The correction form, built once and moved to the day being corrected.
  els.slot = h('li', { class: 'ed-slot' });
  els.slot.innerHTML = `
    <form class="editor" id="logEditor" novalidate aria-labelledby="edTitle">
      <p class="editor-title" id="edTitle"></p>
      <div class="field">
        <label for="edHours">Hours</label>
        <input id="edHours" name="hours" autocomplete="off" inputmode="text" spellcheck="false" aria-describedby="edHint">
      </div>
      <div class="field">
        <label for="edNote">Note</label>
        <input id="edNote" name="note" autocomplete="off" maxlength="140" placeholder="What you worked on">
      </div>
      <div class="editor-actions">
        <button type="submit" class="b b-solid">Save</button>
        <button type="button" class="b" data-act="cancel">Cancel</button>
      </div>
      <p class="hint" id="edHint" aria-live="polite"></p>
    </form>`;
  els.form = els.slot.querySelector('form');
  els.title = els.slot.querySelector('#edTitle');
  els.hours = els.slot.querySelector('#edHours');
  els.note = els.slot.querySelector('#edNote');
  els.hint = els.slot.querySelector('#edHint');

  els.hours.addEventListener('input', () => { hoursDirty = true; hint(HINT, false); });
  els.form.addEventListener('submit', (e) => { e.preventDefault(); save(); });
  els.form.querySelector('[data-act="cancel"]').addEventListener('click', () => closeEditor(true));

  els.weeks.addEventListener('click', (e) => {
    const cell = e.target.closest('button.ld-cell');
    if (!cell) return;
    const key = cell.closest('.ld').dataset.key;
    if (editing && editing.key === key) closeEditor(true);
    else openEditor(key, { focus: true });
  });
  els.weeks.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editing) { e.preventDefault(); closeEditor(true); }
  });
  els.more.addEventListener('click', () => {
    const first = built.length;
    shown = built.length + MORE;
    renderLog();
    const next = built[first] && built[first].section.querySelector('.ld-cell');
    setText(els.announce, 'Earlier weeks shown.');
    if (next) next.focus();
  });
  wideMq.addEventListener('change', () => { if (editing) placeSlot(); });

  renderLog();
}

// ------------------------------------------------------------- words

function weekName(i, start, ref) {
  const r = range(start, ref);
  return i === 0 ? `This week, ${r}` : i === 1 ? `Last week, ${r}` : r;
}

// Today stops counting among the workdays ahead once it is finished.
function todayClosed() {
  return !!S.doneAt && !S.isRunning;
}

function face(d, per) {
  if (d.isFuture) return d.off ? { text: 'Rest', lvl: 0 } : { text: mono(per), lvl: 0 };
  if (d.off && !d.seconds) return { text: 'Rest', lvl: 0 };
  return { text: mono(d.seconds), lvl: dayLevel(d.seconds) };
}

function lineText(d, note) {
  if (d.isFuture) return d.off ? 'Rest day' : 'Ahead';
  return [d.off ? 'Rest day' : '', note || ''].filter(Boolean).join(' · ');
}

function said(d, note, per) {
  const when = `${weekdayLong(d.date)} ${longDate(d.date)}`;
  if (d.isFuture) {
    return `${when}, ${d.off ? 'rest day' : per ? `ahead: ${spoken(per)} would keep this week on 30 hours` : 'ahead'}. Read-only.`;
  }
  const what = d.off && !d.seconds ? 'rest day, nothing logged' : `${spoken(d.seconds)}${d.off ? ', on a rest day' : ''}`;
  return `${when}${d.isToday ? ', today' : ''}: ${what}${note ? `. ${note}` : ''}.${S.readOnly ? '' : ' Correct this day.'}`;
}

// ------------------------------------------------------------- build

// Weeks from this one back to the first one with any time in it.
function weeksAvailable(ref, data) {
  const first = firstTrackedKey(data);
  const tracked = first ? Math.round(dayDiff(weekStart(parseDateKey(first)), weekStart(ref)) / 7) + 1 : 1;
  return Math.max(1, tracked, reach);
}

function appendWeek(i, ref, data) {
  const start = addDays(weekStart(ref), -7 * i);
  const id = `wk-${getDateKey(start)}`;
  const tKey = todayKey();
  const title = h('h2', { id });
  const totalStrong = h('strong');
  const totalRest = h('span');
  const bar = h('span');
  const list = h('ol', { class: 'lw-days' });
  const section = h('section', { class: 'lw', 'aria-labelledby': id, 'data-week': String(i) }, [
    h('div', { class: 'lw-head' }, [title, h('p', { class: 'lw-total' }, [totalStrong, totalRest]), h('div', { class: 'bar', 'aria-hidden': 'true' }, [bar])]),
    list
  ]);
  for (const d of weekSeries(data, start)) {
    const future = d.key > tKey;
    const editable = !future && !S.readOnly;
    const figure = nf('', 0);
    const now = h('span', { class: 'now' });
    const lt = h('span');
    const meta = h('span', { class: 'ld-meta', 'aria-hidden': 'true' }, [
      h('span', { class: 'ld-name' }, [
        h('span', { class: 'ld-gem' }, [gemStone(d.gem, 20, { motion: 'none' })]),
        h('span', { class: 'ld-day' }, weekdayLong(d.date)),
        h('span', { class: 'muted' }, shortDate(d.date))
      ]),
      h('span', { class: 'ld-line' }, [now, lt])
    ]);
    const cell = editable
      ? h('button', { class: 'ld-cell', type: 'button', 'aria-expanded': 'false' }, [figure, meta])
      : h('div', { class: 'ld-cell', role: 'group' }, [figure, meta]);
    const li = h('li', { class: 'ld', 'data-gem': d.gem, 'data-key': d.key }, [cell]);
    list.appendChild(li);
    rows.set(d.key, { key: d.key, li, cell, nf: figure, now, lt, future, list });
  }
  els.weeks.appendChild(section);
  built.push({ i, start, section, title, list, totalStrong, totalRest, bar });
  rise(section);
}

function update(ref, data) {
  const tKey = todayKey();
  const notes = readIntents();
  const per = weekPlan(data, ref, { todayClosed: todayClosed() }).perWorkday;
  for (const w of built) {
    const days = weekSeries(data, w.start).map((d) => ({ ...d, isToday: d.key === tKey, isFuture: d.key > tKey }));
    const total = days.reduce((s, d) => s + d.seconds, 0);
    setText(w.title, weekName(w.i, w.start, ref));
    setAttr(w.list, 'aria-label', `${weekName(w.i, w.start, ref)}, Saturday to Friday`);
    setText(w.totalStrong, formatHM(total));
    setText(w.totalRest, ` of 30h${total >= WEEKLY_GOAL ? ', reached' : ''}`);
    setVar(w.bar, '--p', Math.min(1, total / WEEKLY_GOAL).toFixed(4));
    for (const d of days) {
      const row = rows.get(d.key);
      if (!row) continue;
      const f = face(d, per);
      setNf(row.nf, f.text, f.lvl);
      row.li.classList.toggle('is-today', d.isToday);
      const text = lineText(d, notes[d.key]);
      setText(row.now, d.isToday ? 'Today' : '');
      setText(row.lt, d.isToday && text ? ` · ${text}` : text);
      setAttr(row.cell, 'aria-label', said(d, notes[d.key], per));
    }
  }
}

export function renderLog() {
  if (!root) return;
  const ref = today();
  const sig = `${todayKey()}|${S.readOnly}`;
  if (sig !== structSig) {
    structSig = sig;
    closeEditor(false);
    release(els.weeks);
    clear(els.weeks);
    built = [];
    rows.clear();
  }
  const data = liveWeekData();
  const avail = weeksAvailable(ref, data);
  const want = Math.min(Math.max(shown, reach), avail);
  while (built.length < want) appendWeek(built.length, ref, data);
  update(ref, data);

  const rest = avail - built.length;
  els.more.hidden = rest <= 0;
  const oldest = addDays(weekStart(ref), -7 * (avail - 1));
  const back = `${longDate(oldest)}${oldest.getFullYear() !== ref.getFullYear() ? ` ${oldest.getFullYear()}` : ''}`;
  setText(els.moreNote, rest > 0
    ? `${rest} earlier week${rest === 1 ? '' : 's'}, back to ${back}.`
    : avail > 1 ? `That is everything, back to ${back}.` : '');
}

// Once a minute: today's numeral and the week's totals, in place.
export function tickLog() {
  if (root && document.body.dataset.route === 'log') renderLog();
}

// ------------------------------------------------------------- the correction

function hint(text, error) {
  setText(els.hint, text);
  els.hint.classList.toggle('is-error', error);
  setAttr(els.hours, 'aria-invalid', error ? 'true' : null);
}

function placeSlot() {
  if (!editing) return;
  const { row } = editing;
  if (wideMq.matches) row.list.appendChild(els.slot);
  else row.li.after(els.slot);
}

function openEditor(key, { focus = true } = {}) {
  const row = rows.get(key);
  if (!row || row.future || S.readOnly || row.cell.tagName !== 'BUTTON') return false;
  closeEditor(false);
  editing = { key, row };
  row.li.classList.add('is-editing');
  row.cell.setAttribute('aria-expanded', 'true');
  row.cell.setAttribute('aria-controls', 'logEditor');
  placeSlot();
  const date = parseDateKey(key);
  setText(els.title, `Correct ${weekdayLong(date)} ${longDate(date)}`);
  const isToday = key === todayKey();
  els.hours.value = formatHM(isToday ? liveTodaySeconds() : (S.weekData[key] || 0));
  els.note.value = getIntent(key);
  hoursDirty = false;
  hint(isToday && S.isRunning ? `${HINT} The timer keeps running from the new total.` : HINT, false);
  if (focus) {
    els.hours.focus({ preventScroll: true });
    els.hours.select();
    const r = els.slot.getBoundingClientRect();
    if (r.bottom > innerHeight || r.top < 0) row.li.scrollIntoView({ block: 'center', behavior: reduceMq.matches ? 'auto' : 'smooth' });
  }
  return true;
}

function closeEditor(focus) {
  if (!editing) return;
  const { row } = editing;
  editing = null;
  row.li.classList.remove('is-editing');
  row.cell.setAttribute('aria-expanded', 'false');
  row.cell.removeAttribute('aria-controls');
  els.slot.remove();
  if (focus && row.cell.isConnected) row.cell.focus();
}

function save() {
  if (!editing) return;
  const { key } = editing;
  let result = null;
  if (hoursDirty) {
    const value = parseDuration(els.hours.value);
    if (value === null || !Number.isFinite(value)) {
      hint('That isn’t a time this can read. Try 5:30, 5h 30m, 5.5 or 45m.', true);
      els.hours.focus();
      return;
    }
    if (value > MAX_DAY) {
      hint('A day holds at most 24h. Try a smaller figure.', true);
      els.hours.focus();
      return;
    }
    result = setDayTotal(key, value);
  }
  setIntent(key, els.note.value);
  closeEditor(true);
  renderLog();
  const name = key === todayKey() ? 'Today' : weekdayLong(parseDateKey(key));
  if (result && result.changed) {
    const prev = result.prev;
    notify('Saved', `${name} is now ${formatHM(result.next)}.`, {
      action: { label: 'Undo', run: () => { setDayTotal(key, prev); renderLog(); } }
    });
  } else {
    setText(els.announce, `Saved. ${name} is unchanged at ${spoken(key === todayKey() ? liveTodaySeconds() : (S.weekData[key] || 0))}.`);
  }
}

// From a link such as #/log/2026-10-12: show that week and open the day.
export function openDay(key) {
  if (!root) return;
  if (!isDateKey(key) || key > todayKey()) { renderLog(); return; }
  const ref = today();
  const back = Math.round(dayDiff(weekStart(parseDateKey(key)), weekStart(ref)) / 7);
  reach = Math.max(reach, back + 1);
  if (back + 1 > shown) shown = back + 1;
  renderLog();
  if (!openEditor(key, { focus: false })) return;
  requestAnimationFrame(() => {
    if (!editing || editing.key !== key) return;
    editing.row.li.scrollIntoView({ block: 'center', behavior: reduceMq.matches ? 'auto' : 'smooth' });
    els.hours.focus({ preventScroll: true });
    els.hours.select();
  });
}
