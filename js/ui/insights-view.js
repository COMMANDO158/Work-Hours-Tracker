// Insights: the week as a rosette, then patterns over days and weeks. Every
// chart is drawn here in SVG/HTML from the ledger; nothing loads from a CDN.
import { h, clear } from './dom.js';
import { rosette, miniDial, stone, weekDial } from './dial.js';
import { liveWeekData } from '../store.js';
import {
  weekSeries, weekPace, lastDays, weekdayPattern, weeklyTotals, calculateStreak, longestStreak,
  bestDayEver, bestDay, lifetime, averagePerWorkday, observations, firstTrackedKey
} from '../insights.js';
import { today, weekdayLong, weekdayShort, weekdayLetter, getWeekDates } from '../dates.js';
import { formatHM, formatRemaining, formatShortDate, plural } from '../format.js';
import { DAILY_GOAL } from '../config.js';

let root = null;
let rhythmWeeks = 8;

export function mountInsights(el) {
  root = el;
  renderInsights();
}

function hoursWords(seconds) {
  const s = Math.floor(seconds);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  if (!s) return 'nothing logged';
  return `${hh ? `${hh} hour${hh === 1 ? '' : 's'} ` : ''}${mm} minutes`;
}

function section(title, lede, body, cls = '') {
  return h('section', { class: `insight ${cls}`, 'aria-label': title }, [
    h('header', { class: 'insight-head' }, [h('h2', { class: 'label' }, title), lede ? h('p', { class: 'insight-lede' }, lede) : null]),
    body
  ]);
}

export function renderInsights() {
  if (!root) return;
  const ref = today();
  const data = liveWeekData();
  clear(root);
  root.appendChild(h('header', { class: 'view-head' }, [
    h('h1', { class: 'view-title' }, 'Insights'),
    h('p', { class: 'view-lede' }, 'Your own hours, read back to you. Rest days are Tuesday and Friday.')
  ]));

  if (!firstTrackedKey(data)) {
    root.appendChild(h('div', { class: 'empty' }, [
      rosette({ days: [], size: 120 }),
      h('p', { class: 'empty-title' }, 'Nothing tracked yet'),
      h('p', { class: 'empty-text' }, 'Start the dial on Today, or add a past day in Log. Your week fills this rosette one gem at a time.')
    ]));
    return;
  }

  root.append(
    thisWeek(data, ref),
    notes(data, ref),
    lastThirty(data, ref),
    rhythm(data, ref),
    twelveWeeks(data, ref),
    records(data, ref)
  );
}

function thisWeek(data, ref) {
  const days = weekSeries(data, ref);
  const pace = weekPace(data, ref);
  const legend = h('ol', { class: 'legend' }, days.map((d) => h('li', { class: `legend-row${d.isToday ? ' is-today' : ''}${d.off ? ' is-off' : ''}` }, [
    stone(d.gem, 18),
    h('span', { class: 'legend-day' }, weekdayShort(d.date)),
    h('span', { class: 'legend-hours num' }, d.seconds ? formatHM(d.seconds) : (d.off ? 'rest' : '–'))
  ])));
  const line = pace.met
    ? 'The 30 hours are in. Anything more is extra.'
    : pace.workdaysLeft
      ? `${formatRemaining(pace.remaining)} to go across ${plural(pace.workdaysLeft, 'workday', 'workdays')}: ${pace.workdaysLeftNames.join(' and ')}.`
      : 'No workdays left this week.';
  return section('This week', null, h('div', { class: 'week-rosette' }, [
    rosette({ days, size: 210, isCurrent: true, label: `This week: ${hoursWords(pace.total)} of 30 hours` }),
    h('div', { class: 'week-rosette-side' }, [
      h('p', { class: 'week-rosette-figure' }, [h('span', { class: 'num' }, formatHM(pace.total)), h('span', { class: 'of' }, ' of 30h')]),
      h('p', { class: 'week-rosette-line' }, line),
      legend
    ])
  ]), 'insight-week');
}

function notes(data, ref) {
  const list = observations(data, ref);
  return section('What stands out', null, h('ul', { class: 'notes' }, list.map((t) => h('li', {}, t))), 'insight-notes');
}

function lastThirty(data, ref) {
  const days = lastDays(data, ref, 30);
  const total = days.reduce((s, d) => s + d.seconds, 0);
  const atGoal = days.filter((d) => d.seconds >= DAILY_GOAL).length;
  const perWorkday = averagePerWorkday(data, ref, 30);
  const grid = h('div', { class: 'cal', role: 'list', 'aria-label': 'Last 30 days' });
  // weekday header, Saturday first
  const head = h('div', { class: 'cal-head', 'aria-hidden': 'true' }, getWeekDates(ref).map((d) => h('span', {}, weekdayLetter(d))));
  const pad = (days[0].date.getDay() + 1) % 7;
  for (let i = 0; i < pad; i++) grid.appendChild(h('span', { class: 'cal-pad', 'aria-hidden': 'true' }));
  for (const d of days) {
    const label = `${weekdayLong(d.date)} ${formatShortDate(d.date)}: ${d.seconds ? hoursWords(d.seconds) : (d.off ? 'rest day' : 'nothing logged')}`;
    grid.appendChild(h('a', {
      class: `cal-day${d.isToday ? ' is-today' : ''}${d.off ? ' is-off' : ''}`,
      href: `#/log/${d.key}`, role: 'listitem', 'aria-label': label
    }, [
      miniDial({ seconds: d.seconds, gem: d.gem, off: d.off, isToday: d.isToday, size: 34 }),
      h('span', { class: 'cal-date num' }, String(d.date.getDate()))
    ]));
  }
  return section('Last 30 days', `${formatHM(total)} in total · ${formatHM(perWorkday)} per workday · ${plural(atGoal, 'day', 'days')} at 6h or more`,
    h('div', { class: 'cal-wrap' }, [head, grid]), 'insight-cal');
}

function rhythm(data, ref) {
  const choices = [[4, '4 weeks'], [8, '8 weeks'], [12, '12 weeks'], [520, 'All']];
  const seg = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': 'Period' }, choices.map(([n, label]) => {
    const b = h('button', { class: 'seg-btn', type: 'button', role: 'radio', 'aria-checked': rhythmWeeks === n ? 'true' : 'false' }, label);
    b.addEventListener('click', () => { rhythmWeeks = n; renderInsights(); requestAnimationFrame(() => { const el = root.querySelector('.insight-rhythm .seg-btn[aria-checked="true"]'); if (el) el.focus(); }); });
    return b;
  }));
  const pattern = weekdayPattern(data, ref, rhythmWeeks);
  const max = Math.max(DAILY_GOAL * 1.25, ...pattern.map((p) => p.average));
  const scaleHours = Math.ceil(max / 3600);
  const rows = h('ol', { class: 'bars' }, pattern.map((p) => {
    const pct = (p.average / (scaleHours * 3600)) * 100;
    const goalPct = (DAILY_GOAL / (scaleHours * 3600)) * 100;
    return h('li', { class: `bar-row${p.off ? ' is-off' : ''}`, 'aria-label': `${p.name}: ${p.samples ? hoursWords(p.average) : 'no days yet'} on average` }, [
      h('span', { class: 'bar-label' }, p.short),
      h('span', { class: 'bar-track', 'aria-hidden': 'true', style: `--goal:${goalPct}%` }, [
        ...Array.from({ length: scaleHours - 1 }, (_, t) => h('span', { class: 'bar-tick', style: `left:${((t + 1) / scaleHours) * 100}%` })),
        barFill(p, pct)
      ]),
      h('span', { class: 'bar-value num' }, p.samples ? formatHM(p.average) : '–')
    ]);
  }));
  const axis = h('div', { class: 'bars-axis', 'aria-hidden': 'true' }, [
    h('span', { class: 'bars-axis-spacer' }),
    h('span', { class: 'bars-axis-scale' }, Array.from({ length: scaleHours + 1 }, (_, i) => h('span', { style: `left:${(i / scaleHours) * 100}%` }, i === 6 ? '6h' : String(i)))),
    h('span', { class: 'bars-axis-spacer' })
  ]);
  return section('Weekday rhythm', 'Average hours on each weekday. The line marks 6 hours.', h('div', { class: 'rhythm' }, [seg, rows, axis]), 'insight-rhythm');
}

function barFill(p, pct) {
  return h('span', { class: 'bar-fill', 'data-gem': p.gem, style: `width:${pct}%` });
}

function twelveWeeks(data, ref) {
  const weeks = weeklyTotals(data, ref, 12);
  const first = firstTrackedKey(data);
  // Newest first, so this week leads and never sits orphaned on a last row.
  const shown = weeks.filter((w) => w.isCurrent || (first && w.days[6].key >= first)).reverse();
  const grid = h('ol', { class: 'weeks-grid' }, shown.map((w) => h('li', { class: `week-cell${w.isCurrent ? ' is-current' : ''}` }, [
    w.isCurrent
      ? rosette({ days: w.days, size: 72, isCurrent: true, label: `This week: ${hoursWords(w.total)}` })
      : weekDial({ seconds: w.total, size: 56, label: `Week of ${formatShortDate(w.start)}: ${hoursWords(w.total)}` }),
    h('span', { class: 'week-cell-total num' }, formatHM(w.total)),
    h('span', { class: 'week-cell-date' }, w.isCurrent ? 'This week' : formatShortDate(w.start))
  ])));
  const met = shown.filter((w) => !w.isCurrent && w.total >= 30 * 3600).length;
  const done = shown.filter((w) => !w.isCurrent).length;
  return section('Week by week', done ? `${met} of the last ${plural(done, 'finished week', 'finished weeks')} reached 30 hours.` : null, grid, 'insight-weeks');
}

function records(data, ref) {
  const streak = calculateStreak(data, ref);
  const longest = longestStreak(data, ref);
  const best = bestDayEver(data);
  const bestWeek = bestDay(weekSeries(data, ref));
  const life = lifetime(data);
  const rows = [
    ['Current streak', plural(streak, 'workday', 'workdays'), 'Workdays in a row with 30+ minutes. Rest days don’t break it.'],
    ['Longest streak', plural(longest, 'workday', 'workdays'), null],
    ['Best day this week', bestWeek ? `${formatHM(bestWeek.seconds)} · ${weekdayLong(bestWeek.date)}` : '–', null],
    ['Best day ever', best ? `${formatHM(best.seconds)} · ${formatShortDate(best.date)} ${best.date.getFullYear()}` : '–', null],
    ['Days with 30+ minutes', String(life.daysWith30), null],
    ['Total tracked', formatHM(life.total), null]
  ];
  return section('Streaks and records', null, h('dl', { class: 'records' }, rows.flatMap(([k, v, note]) => [
    h('dt', {}, k),
    h('dd', {}, [h('span', { class: 'num' }, v), note ? h('span', { class: 'records-note' }, note) : null])
  ])), 'insight-records');
}

