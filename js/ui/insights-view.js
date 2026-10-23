// Insights: your own hours, read back to you. The week as one numeral filled
// day by day, plain sentences, the last 30 days as small floods, the weekday
// rhythm, week by week, and streaks and records. Everything is drawn here from
// the ledger. The numerals are built once and filled in place; the plainer
// parts are redrawn only when their figures change.
import { h, clear, setText } from './dom.js';
import { nf, setNf, rise } from './numeral.js';
import { gem as gemStone } from './gem.js';
import { S } from '../state.js';
import { liveWeekData } from '../store.js';
import {
  weekSeries, weekPlan, standouts, lastDays, weekdayPattern, weeklyTotals, calculateStreak, longestStreak,
  bestDayEver, bestDay, lifetime, averagePerWorkday, firstTrackedKey
} from '../insights.js';
import { today, todayKey, weekStart, weekdayLong, parseDateKey, dayDiff } from '../dates.js';
import { formatHM, formatRemaining } from '../format.js';
import { DAILY_GOAL, WEEKLY_GOAL } from '../config.js';
import { mono, spoken, dayLevel, longDate, shortDate, range } from './words.js';
import { gemFor } from '../gems.js';

const CHOICES = [[4, '4 weeks'], [8, '8 weeks'], [12, '12 weeks'], ['all', 'All']];
const HEAD = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

let root = null;
let els = null;
let pick = 1;
const sigs = {};

const gem20 = (id) => gemStone(id, 20, { motion: 'none' });
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// ------------------------------------------------------------- mount

export function mountInsights(el) {
  root = el;
  root.innerHTML = `
    <div class="page-head">
      <h1 tabindex="-1">Insights</h1>
      <p class="lede">Your own hours, read back to you. Days are full at 6h, weeks at 30h, and Tuesday and Friday are rest days.</p>
    </div>

    <div class="ins-empty" hidden>
      <strong>Nothing tracked yet</strong>
      <p>Start the clock on Today, or add a past day in the Log. Your hours are read back here once a few days are in.</p>
    </div>

    <div class="ins-all">
      <section class="ins" aria-labelledby="pace-title">
        <h2 id="pace-title">This week’s pace</h2>
        <div class="pace">
          <div class="pace-fig">
            <span class="nf pace-nf" aria-hidden="true"> </span>
            <p class="pace-of"><strong></strong><span></span></p>
          </div>
          <div class="pace-side">
            <p class="pace-fact" data-k="togo"><span class="v"></span><span class="k"></span></p>
            <p class="pace-fact" data-k="per"><span class="v"></span><span class="k"></span></p>
            <div data-k="left">
              <p class="pace-fact"><span class="k">The workdays that remain</span></p>
              <ul class="left-days"></ul>
            </div>
          </div>
        </div>
      </section>

      <section class="ins ins-band" aria-labelledby="notes-title">
        <div class="notes-grid">
          <h2 id="notes-title">What stands out</h2>
          <ul class="notes"></ul>
        </div>
      </section>

      <section class="ins" aria-labelledby="thirty-title">
        <h2 id="thirty-title">The last 30 days</h2>
        <div class="thirty">
          <div class="facts">
            <p class="fact" data-k="t-total"><span class="v"></span><span class="k"></span></p>
            <p class="fact" data-k="t-avg"><span class="v"></span><span class="k">on an average workday</span></p>
            <p class="fact" data-k="t-goal"><span class="v"></span><span class="k">reached 6h or more</span></p>
          </div>
          <div>
            <div class="cal" role="list" aria-label="The last 30 days, each filled to its hours against 6h"></div>
            <p class="cal-key">Each square fills from the bottom and is full at 6h. Today is outlined; empty outlined squares are rest days. Tap a day to correct it in the log.</p>
          </div>
        </div>
      </section>

      <section class="ins" aria-labelledby="rhythm-title">
        <div class="rhythm-top">
          <div>
            <h2 id="rhythm-title">The weekday rhythm</h2>
            <p class="ins-lede" data-k="rhythm-lede"></p>
          </div>
          <div class="seg" role="radiogroup" aria-label="Weeks to average"></div>
        </div>
        <div class="rh-wrap">
          <div class="rh-six" aria-hidden="true"><span>6h</span></div>
          <ol class="rhythm" aria-label="Average per weekday, Saturday to Friday"></ol>
        </div>
      </section>

      <section class="ins ins-band" aria-labelledby="weeks-title">
        <h2 id="weeks-title">Week by week</h2>
        <p class="ins-lede" data-k="weeks-lede"></p>
        <div class="weeks-chart"></div>
      </section>

      <section class="ins" aria-labelledby="records-title">
        <h2 id="records-title">Streaks and records</h2>
        <div class="records">
          <div class="streak">
            <span class="v"></span>
            <span class="k"></span>
            <span class="n">This is the current streak. Rest days don’t break it, and a short start to today doesn’t either.</span>
          </div>
          <div class="best">
            <div class="best-item" data-k="best-ever"><p><strong>Best day ever</strong><span></span></p></div>
            <div class="best-item" data-k="best-week"><p><strong>Best day this week</strong><span></span></p></div>
          </div>
          <dl class="ledger">
            <div><dt>Longest streak</dt><dd data-k="longest"></dd></div>
            <div><dt>Days with 30m or more</dt><dd data-k="with30"></dd></div>
            <div><dt>Total tracked</dt><dd data-k="total"></dd></div>
          </dl>
        </div>
      </section>
    </div>`;

  const q = (s) => root.querySelector(s);
  const k = (name) => q(`[data-k="${name}"]`);
  els = {
    empty: q('.ins-empty'),
    all: q('.ins-all'),
    paceNf: q('.pace-nf'),
    paceLead: q('.pace-of strong'),
    paceRest: q('.pace-of span'),
    togo: k('togo'),
    per: k('per'),
    left: k('left'),
    leftList: q('.left-days'),
    notes: q('.notes'),
    tTotal: k('t-total'),
    tAvg: k('t-avg'),
    tGoal: k('t-goal'),
    cal: q('.cal'),
    rhythmLede: k('rhythm-lede'),
    seg: q('.seg'),
    rhWrap: q('.rh-wrap'),
    rhSix: q('.rh-six'),
    rhythm: q('.rhythm'),
    weeksLede: k('weeks-lede'),
    chart: q('.weeks-chart'),
    streakV: q('.streak .v'),
    streakK: q('.streak .k'),
    bestEver: k('best-ever'),
    bestWeek: k('best-week'),
    longest: k('longest'),
    with30: k('with30'),
    total: k('total')
  };

  // the weekday rhythm: seven numerals, made once
  els.rh = HEAD.map((short, i) => {
    const sr = h('span', { class: 'sr-only' });
    const figure = nf('0h00', 0);
    const gemSlot = h('span', { class: 'rh-gem' });
    const name = h('span', { class: 'rh-name' }, [gemSlot]);
    const line = h('span', { class: 'muted rh-line' });
    const li = h('li', { class: 'rh' }, [sr, figure, h('span', { class: 'rh-meta', 'aria-hidden': 'true' }, [name, line])]);
    els.rhythm.appendChild(li);
    return { li, sr, nf: figure, gemSlot, name, line, i, short };
  });
  CHOICES.forEach(([, label], i) => {
    const b = h('button', { type: 'button', role: 'radio', 'aria-checked': String(i === pick), tabindex: i === pick ? '0' : '-1', 'data-i': String(i) }, label);
    els.seg.appendChild(b);
  });
  els.seg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) select(Number(b.dataset.i), false);
  });
  els.seg.addEventListener('keydown', (e) => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    select((pick + d + CHOICES.length) % CHOICES.length, true);
  });

  // the best days: two numerals, made once
  for (const item of [els.bestEver, els.bestWeek]) {
    item.prepend(nf('0h00', 0));
  }
  rise(root);

  addEventListener('resize', () => { if (document.body.dataset.route === 'insights') drawLines(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (document.body.dataset.route === 'insights') drawLines(); });
  renderInsights();
}

function select(i, focus) {
  pick = i;
  els.seg.querySelectorAll('button').forEach((b, j) => {
    b.setAttribute('aria-checked', String(j === i));
    b.tabIndex = j === i ? 0 : -1;
    if (j === i && focus) b.focus();
  });
  renderInsights();
}

// ------------------------------------------------------------- render

export function renderInsights() {
  if (!root) return;
  const ref = today();
  const data = liveWeekData();
  const first = firstTrackedKey(data);
  els.empty.hidden = !!first;
  els.all.hidden = !first;
  if (!first) return;

  pace(data, ref);
  notes(data, ref);
  thirty(data, ref);
  rhythm(data, ref, first);
  weeks(data, ref, first);
  records(data, ref);
  if (document.body.dataset.route === 'insights') drawLines();
}

const changed = (name, sig) => {
  if (sigs[name] === sig) return false;
  sigs[name] = sig;
  return true;
};

// This week's pace: the week as one numeral, filled against 30h, each day's share in its own colour.
function pace(data, ref) {
  const days = weekSeries(data, ref);
  const plan = weekPlan(data, ref, { todayClosed: !!S.doneAt && !S.isRunning });
  const text = mono(plan.total);
  const fig = els.paceNf;
  if (fig.firstChild.nodeValue !== text) fig.firstChild.nodeValue = text;
  fig.classList.toggle('is-empty', !plan.total);
  if (changed('pace', `${days.map((d) => Math.floor(d.seconds / 60)).join(',')}`)) {
    [...fig.querySelectorAll('.nf-band')].forEach((b) => b.remove());
    let run = 0;
    days.filter((d) => d.seconds >= 60).forEach((d, i) => {
      const from = run / WEEKLY_GOAL;
      run += d.seconds;
      const band = h('span', { class: `nf-band${i === 0 ? ' is-first' : ''}`, 'data-gem': d.gem }, text);
      band.style.setProperty('--from', Math.min(1, from).toFixed(4));
      band.style.setProperty('--to', Math.min(1, run / WEEKLY_GOAL).toFixed(4));
      fig.appendChild(band);
    });
  }
  fig.querySelectorAll('.nf-band').forEach((b) => setText(b, text));

  setText(els.paceLead, `${formatHM(plan.total)} done`);
  setText(els.paceRest, ' of 30h, Saturday to Friday. The figure is full at 30h; each colour is one day’s share.');
  const n = plan.workdays.length;
  const [tv, tk] = els.togo.children;
  const [pv, pk] = els.per.children;
  if (plan.met) {
    setText(tv, formatHM(plan.total - WEEKLY_GOAL));
    setText(tk, 'past 30h this week. Any more time still counts.');
    els.per.hidden = true;
    els.left.hidden = true;
    return;
  }
  setText(tv, formatRemaining(plan.remaining));
  setText(tk, 'to go this week');
  els.per.hidden = false;
  els.left.hidden = !n;
  if (n) {
    pv.hidden = false;
    setText(pv, formatHM(plan.perWorkday));
    setText(pk, n === 1
      ? `on the one workday that remains${plan.includesToday ? ', today' : ''}`
      : `on each of the ${n} workdays that remain${plan.includesToday ? ', today included' : ''}`);
  } else {
    pv.hidden = true;
    setText(pk, 'No workdays remain this week. Time on a rest day still counts.');
  }
  if (changed('left', plan.workdays.map((d) => d.key).join(','))) {
    clear(els.leftList);
    for (const d of plan.workdays) {
      els.leftList.appendChild(h('li', { 'data-gem': d.gem }, [
        h('span', { class: 'g' }, [gem20(d.gem)]),
        weekdayLong(d.date),
        d.isToday ? h('span', { class: 'muted' }, 'today') : null
      ]));
    }
  }
}

// What stands out: plain sentences, each with its lead in bold.
function notes(data, ref) {
  const list = standouts(data, ref);
  if (!changed('notes', JSON.stringify(list))) return;
  clear(els.notes);
  if (!list.length) {
    els.notes.appendChild(h('li', {}, 'Once a few weeks are tracked, patterns from your own hours show up here.'));
    return;
  }
  for (const s of list) els.notes.appendChild(h('li', {}, [h('strong', {}, s.lead), s.rest]));
}

// The last 30 days: three figures and a calendar of small floods.
function thirty(data, ref) {
  const days = lastDays(data, ref, 30);
  const total = days.reduce((s, d) => s + d.seconds, 0);
  const atGoal = days.filter((d) => d.seconds >= DAILY_GOAL).length;
  setText(els.tTotal.children[0], formatHM(total));
  setText(els.tTotal.children[1], `in total, ${longDate(days[0].date)} to today`);
  setText(els.tAvg.children[0], formatHM(averagePerWorkday(data, ref, 30)));
  setText(els.tGoal.children[0], plural(atGoal, 'day', 'days'));

  if (!changed('cal', `${todayKey()}|${days.map((d) => Math.floor(d.seconds / 60)).join(',')}`)) return;
  clear(els.cal);
  for (const s of HEAD) els.cal.appendChild(h('span', { class: 'cal-head', 'aria-hidden': 'true' }, s));
  const pad = (days[0].date.getDay() + 1) % 7; // weeks start on Saturday
  for (let i = 0; i < pad; i++) els.cal.appendChild(h('span', { 'aria-hidden': 'true' }));
  for (const d of days) {
    const lvl = dayLevel(d.seconds);
    const rest = d.off && !d.seconds;
    const what = rest ? 'rest day, nothing logged' : `${spoken(d.seconds)}${d.off ? ', on a rest day' : ''}`;
    const fill = h('span', { class: 'lvl' });
    fill.style.setProperty('--lvl', lvl.toFixed(4));
    els.cal.appendChild(h('a', {
      class: `cal-day${d.isToday ? ' is-today' : ''}${rest ? ' is-rest' : ''}${lvl > 0.86 ? ' is-high' : ''}`,
      'data-gem': d.gem,
      href: d.isToday ? '#/today' : `#/log/${d.key}`,
      role: 'listitem',
      'aria-label': `${weekdayLong(d.date)} ${longDate(d.date)}${d.isToday ? ', today so far' : ''}: ${what}`
    }, [fill, h('span', { class: 'd', 'aria-hidden': 'true' }, String(d.date.getDate()))]));
  }
}

// The weekday rhythm: seven numerals, each filled to its weekday's average.
function rhythm(data, ref, first) {
  const finished = Math.max(1, Math.round(dayDiff(weekStart(parseDateKey(first)), weekStart(ref)) / 7));
  const choice = CHOICES[pick][0];
  const n = choice === 'all' ? finished : choice;
  const rows = weekdayPattern(data, ref, n);
  setText(els.rhythmLede, `The average for each weekday over ${choice === 'all' ? `all ${plural(finished, 'finished week', 'finished weeks')}` : `the last ${CHOICES[pick][1]}`}. Each figure is full at 6h; the line marks it.`);
  rows.forEach((d, i) => {
    const r = els.rh[i];
    if (r.li.dataset.gem !== d.gem) {
      r.li.dataset.gem = d.gem;
      clear(r.gemSlot).appendChild(gem20(d.gem));
      r.name.append(d.name);
    }
    setNf(r.nf, mono(d.average), dayLevel(d.average));
    setText(r.line, d.off ? 'Rest day' : !d.samples ? 'No days yet'
      : d.average >= DAILY_GOAL ? `${formatHM(d.average - DAILY_GOAL)} over 6h` : `${formatRemaining(DAILY_GOAL - d.average)} under 6h`);
    setText(r.sr, `${d.name}${d.off ? ', rest day' : ''}: ${d.samples ? `${spoken(d.average)} on average` : 'no days yet'}.`);
  });
}

// Week by week: each finished week a glass, filled day by day, the 30h line across.
function weeks(data, ref, first) {
  const all = weeklyTotals(data, ref, 11).filter((w) => !w.isCurrent && w.days[6].key >= first);
  const sig = all.map((w) => `${w.startKey}:${w.days.map((d) => Math.floor(d.seconds / 60)).join('.')}`).join('|');
  if (!changed('weeks', sig)) return;
  const reached = all.filter((w) => w.total >= WEEKLY_GOAL).length;
  setText(els.weeksLede, all.length
    ? `${reached} of the last ${plural(all.length, 'finished week', 'finished weeks')} reached 30h. Each glass fills day by day, Saturday at the bottom, in each day’s colour.`
    : 'No finished weeks yet. Each week appears here once its Friday is over.');
  clear(els.chart);
  if (!all.length) return;
  const max = Math.max(36 * 3600, ...all.map((w) => w.total));
  const cols = h('ol', { class: 'wk-cols' });
  for (const w of all) {
    const glass = h('div', { class: 'glass', 'aria-hidden': 'true' });
    let run = 0;
    for (const d of w.days.filter((x) => x.seconds > 0)) {
      const seg = h('span', { class: 'seg-day', 'data-gem': d.gem });
      seg.style.bottom = `${((run / max) * 100).toFixed(3)}%`;
      seg.style.height = `${((d.seconds / max) * 100).toFixed(3)}%`;
      run += d.seconds;
      glass.appendChild(seg);
    }
    const gap = WEEKLY_GOAL - w.total;
    const words = gap > 0 ? `${formatHM(gap)} short` : 'reached';
    cols.appendChild(h('li', { class: 'wk-col' }, [
      h('span', { class: 'sr-only' }, `Week of ${longDate(w.start)}: ${spoken(w.total)}, ${gap > 0 ? `${spoken(gap)} short of 30 hours` : '30 hours reached'}.`),
      glass,
      h('span', { class: 't', 'aria-hidden': 'true' }, formatHM(w.total)),
      h('span', { class: 's', 'aria-hidden': 'true' }, [
        h('span', { class: 'rg-long' }, range(w.start, ref)),
        h('span', { class: 'rg-short' }, shortDate(w.start)),
        h('br'),
        gap > 0 ? words : h('strong', {}, words)
      ])
    ]));
  }
  els.chart.appendChild(cols);
  els.chart.dataset.max = String(max);
}

// Lines that follow the layout: the 6h line on the rhythm's cap height, and the 30h line across each row of glasses.
function drawLines() {
  const fig = els.rh[0] && els.rh[0].nf;
  if (fig && fig.offsetParent) {
    const top = `${Math.round(fig.getBoundingClientRect().top - els.rhWrap.getBoundingClientRect().top)}px`;
    if (els.rhSix.style.top !== top) els.rhSix.style.top = top;
  }
  els.chart.querySelectorAll('.thirty-line').forEach((x) => x.remove());
  const max = Number(els.chart.dataset.max);
  if (!max) return;
  const tops = new Map();
  els.chart.querySelectorAll('.glass').forEach((g) => { if (!tops.has(g.offsetTop)) tops.set(g.offsetTop, g); });
  tops.forEach((g) => {
    const line = h('div', { class: 'thirty-line', 'aria-hidden': 'true' }, [h('span', {}, '30h')]);
    line.style.top = `${g.offsetTop + g.offsetHeight * (1 - WEEKLY_GOAL / max)}px`;
    els.chart.appendChild(line);
  });
}

// Streaks and records.
function records(data, ref) {
  const streak = calculateStreak(data, ref);
  setText(els.streakV, String(streak));
  setText(els.streakK, `${streak === 1 ? 'workday' : 'workdays'} in a row with 30m or more`);

  const best = bestDayEver(data);
  const ever = els.bestEver;
  if (best) {
    const g = gemFor(best.date).id;
    if (ever.dataset.gem !== g) ever.dataset.gem = g;
    setNf(ever.querySelector('.nf'), mono(best.seconds), dayLevel(best.seconds));
    setText(ever.querySelector('p span'), `${weekdayLong(best.date)} ${longDate(best.date)} ${best.date.getFullYear()}, ${formatHM(best.seconds)}`);
  }

  const bw = bestDay(weekSeries(data, ref));
  const wk = els.bestWeek;
  if (bw) {
    if (wk.dataset.gem !== bw.gem) wk.dataset.gem = bw.gem;
    setNf(wk.querySelector('.nf'), mono(bw.seconds), dayLevel(bw.seconds));
    setText(wk.querySelector('p span'), `${weekdayLong(bw.date)}${bw.isToday ? ', today so far' : ''}, ${formatHM(bw.seconds)}`);
  } else {
    setNf(wk.querySelector('.nf'), '0h00', 0);
    setText(wk.querySelector('p span'), 'Nothing logged yet this week.');
  }

  const life = lifetime(data);
  setText(els.longest, plural(longestStreak(data, ref), 'workday', 'workdays'));
  setText(els.with30, String(life.daysWith30));
  setText(els.total, formatHM(life.total));
}
