// Run with: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getDateKey, weekKeys, weekStart, addDays, isOffDayKey, midnightAfter, parseDateKey } from '../js/dates.js';
import { mergeRemoteData, mergeToday, cloudNeedsUpdate } from '../js/merge.js';
import { calculateStreak, longestStreak, weekPace, weekdayPattern, lastDays, observations } from '../js/insights.js';
import { parseDuration, formatHM, formatRemaining, clampDay, formatEditable } from '../js/format.js';
import { deriveTodayState } from '../js/today-state.js';
import { GEMS } from '../js/gems.js';
import { CUT_IDS, cutFor, facesOf, toneAt, isConvex, isPlanar } from '../js/gem-cuts.js';

const H = 3600;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------- dates

test('weeks start on Saturday for every weekday', () => {
  // 2026-10-03 is a Saturday
  const sat = new Date(2026, 9, 3, 15, 0);
  for (let i = 0; i < 7; i++) {
    const d = addDays(sat, i);
    d.setHours(9, 30);
    assert.equal(getDateKey(weekStart(d)), '2026-10-03', `day offset ${i}`);
    assert.deepEqual(weekKeys(d), ['2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']);
  }
  assert.equal(getDateKey(weekStart(new Date(2026, 9, 2, 23, 59))), '2026-09-26');
});

test('week math survives a DST change', () => {
  // EU DST ends 2026-10-25 (Sunday); the week runs Sat 24 to Fri 30.
  const keys = weekKeys(new Date(2026, 9, 27, 12));
  assert.deepEqual(keys, ['2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30']);
});

test('Tuesday and Friday are rest days', () => {
  assert.equal(isOffDayKey('2026-10-06'), true);  // Tue
  assert.equal(isOffDayKey('2026-10-09'), true);  // Fri
  assert.equal(isOffDayKey('2026-10-07'), false); // Wed
});

test('midnightAfter is local midnight', () => {
  assert.equal(midnightAfter('2026-10-03'), new Date(2026, 9, 4).getTime());
});

// ---------------------------------------------------------------- merge

test('mergeRemoteData: missing local day takes remote and its meta', () => {
  const local = { weekData: {}, weekMeta: {} };
  const n = mergeRemoteData(local, { weekData: { '2026-09-01': 100 }, meta: { '2026-09-01': 5 } }, null);
  assert.equal(n, 1);
  assert.deepEqual(local, { weekData: { '2026-09-01': 100 }, weekMeta: { '2026-09-01': 5 } });
});

test('mergeRemoteData: equal values adopt the newer timestamp', () => {
  const local = { weekData: { a: 100 }, weekMeta: { a: 3 } };
  assert.equal(mergeRemoteData(local, { weekData: { a: 100 }, meta: { a: 9 } }, null), 0);
  assert.equal(local.weekMeta.a, 9);
});

test('mergeRemoteData: newest edit wins, unknown times keep the larger value', () => {
  const l1 = { weekData: { a: 100 }, weekMeta: { a: 10 } };
  mergeRemoteData(l1, { weekData: { a: 50 }, meta: { a: 20 } }, null);
  assert.equal(l1.weekData.a, 50);

  const l2 = { weekData: { a: 100 }, weekMeta: { a: 30 } };
  mergeRemoteData(l2, { weekData: { a: 50 }, meta: { a: 20 } }, null);
  assert.equal(l2.weekData.a, 100);

  const l3 = { weekData: { a: 100 }, weekMeta: {} };
  mergeRemoteData(l3, { weekData: { a: 50 }, meta: { a: 20 } }, null);
  assert.equal(l3.weekData.a, 50, 'remote stamped, local legacy: remote wins');

  const l4 = { weekData: { a: 100 }, weekMeta: { a: 5 } };
  mergeRemoteData(l4, { weekData: { a: 500 }, meta: {} }, null);
  assert.equal(l4.weekData.a, 100, 'local stamped, remote legacy: local wins');

  const l5 = { weekData: { a: 100 }, weekMeta: {} };
  mergeRemoteData(l5, { weekData: { a: 500 } }, null);
  assert.equal(l5.weekData.a, 500, 'neither stamped: larger wins');
});

test('mergeRemoteData: skips junk and the skip key', () => {
  const local = { weekData: { t: 10 }, weekMeta: {} };
  const n = mergeRemoteData(local, { weekData: { t: 999, bad: -1, worse: 'x', nan: NaN } }, 't');
  assert.equal(n, 0);
  assert.deepEqual(local.weekData, { t: 10 });
});

test('mergeToday adds the other device\'s time against the agreed base', () => {
  const base = { key: '2026-10-03', value: 600 };
  const r = mergeToday(900, '2026-10-03', { todaySavedSeconds: 600, todaySeconds: 300, syncBase: base });
  assert.equal(r.delta, 300);
  assert.equal(r.todaySavedSeconds, 900); // 600 + 300 elsewhere, plus 300 on our clock = 1200 live
});

test('mergeToday: unknown base and equal totals means the same data', () => {
  const r = mergeToday(1200, 'd', { todaySavedSeconds: 1200, todaySeconds: 0, syncBase: { key: null, value: 0 } });
  assert.equal(r.delta, 0);
});

test('mergeToday: negative delta from a correction elsewhere', () => {
  const r = mergeToday(300, 'd', { todaySavedSeconds: 900, todaySeconds: 0, syncBase: { key: 'd', value: 900 } });
  assert.equal(r.delta, -600);
  assert.equal(r.todaySavedSeconds, 300);
});

test('cloudNeedsUpdate ignores empty placeholder days', () => {
  assert.equal(cloudNeedsUpdate({ a: 0 }, {}, { weekData: {} }), false);
  assert.equal(cloudNeedsUpdate({ a: 5 }, {}, { weekData: {} }), true);
  assert.equal(cloudNeedsUpdate({ a: 5 }, { a: 1 }, { weekData: { a: 5 }, meta: { a: 1 } }), false);
  assert.equal(cloudNeedsUpdate({ a: 5 }, { a: 2 }, { weekData: { a: 5 }, meta: { a: 1 } }), true);
});

// ---------------------------------------------------------------- streak

function data(entries) {
  const out = {};
  for (const [k, v] of Object.entries(entries)) out[k] = v;
  return out;
}

test('streak: rest days neither add nor break; today under 30m does not reset', () => {
  // Week of Sat 26 Sep 2026. Tue 29 and Fri 2 Oct are rest days.
  const d = data({
    '2026-09-26': 6 * H, // Sat
    '2026-09-27': 6 * H, // Sun
    '2026-09-28': 6 * H, // Mon
    // Tue rest: nothing
    '2026-09-30': 6 * H, // Wed
    '2026-10-01': 1 * H, // Thu
    // Fri rest: nothing
    '2026-10-03': 600     // Sat (today) only 10 minutes so far
  });
  const ref = new Date(2026, 9, 3, 9);
  assert.equal(calculateStreak(d, ref), 5);
});

test('streak: a workday under 30 minutes ends it; work on a rest day adds nothing', () => {
  const d = data({
    '2026-09-27': 6 * H,   // Sun
    '2026-09-28': 1000,    // Mon (under 30m) breaks
    '2026-09-29': 5 * H,   // Tue rest (ignored)
    '2026-09-30': 2 * H    // Wed
  });
  assert.equal(calculateStreak(d, new Date(2026, 8, 30, 20)), 1);
});

test('streak: no 30-day cap', () => {
  const d = {};
  const start = new Date(2026, 0, 1);
  for (let i = 0; i < 80; i++) d[getDateKey(addDays(start, i))] = 2 * H;
  const ref = addDays(start, 79);
  const expected = Array.from({ length: 80 }, (_, i) => addDays(start, i)).filter((x) => ![2, 5].includes(x.getDay())).length;
  assert.equal(calculateStreak(d, ref), expected);
  assert.equal(longestStreak(d, ref), expected);
});

test('streak: empty data is zero', () => {
  assert.equal(calculateStreak({}, new Date()), 0);
  assert.equal(longestStreak({}, new Date()), 0);
});

// ---------------------------------------------------------------- pace

test('pace counts only remaining workdays', () => {
  // Wednesday 30 Sep 2026; week Sat 26 – Fri 2. Remaining workdays: Wed, Thu.
  const d = data({ '2026-09-26': 6 * H, '2026-09-27': 6 * H, '2026-09-28': 6 * H });
  const p = weekPace(d, new Date(2026, 8, 30, 10));
  assert.equal(p.total, 18 * H);
  assert.equal(p.remaining, 12 * H);
  assert.equal(p.workdaysLeft, 2);
  assert.deepEqual(p.workdaysLeftNames, ['Wed', 'Thu']);
  assert.equal(p.perWorkday, 6 * H);
  assert.equal(p.todayTarget, 6 * H);
  assert.equal(p.aheadBehind, 0);
});

test('pace on a rest day has no target for today', () => {
  const p = weekPace({}, new Date(2026, 8, 29, 10)); // Tuesday
  assert.equal(p.todayTarget, 0);
  assert.deepEqual(p.workdaysLeftNames, ['Wed', 'Thu']);
});

test('pace on Friday has no workdays left', () => {
  const p = weekPace({}, new Date(2026, 9, 2, 10));
  assert.equal(p.workdaysLeft, 0);
  assert.equal(p.met, false);
});

test('weekday pattern starts Saturday and excludes today', () => {
  const ref = new Date(2026, 9, 3, 10); // Saturday
  const d = data({ '2026-09-26': 4 * H, '2026-10-03': 9 * H });
  const p = weekdayPattern(d, ref, 4);
  assert.equal(p[0].short, 'Sat');
  assert.equal(p[0].average, 4 * H);
  assert.equal(p[0].samples, 1);
});

test('lastDays returns 30 days ending today', () => {
  const ref = new Date(2026, 9, 3, 10);
  const days = lastDays({}, ref, 30);
  assert.equal(days.length, 30);
  assert.equal(days[29].key, '2026-10-03');
  assert.equal(days[29].isToday, true);
});

test('observations never cheerlead', () => {
  const ref = new Date(2026, 8, 30, 10);
  const lines = observations({ '2026-09-26': 6 * H }, ref);
  assert.ok(lines.length >= 1 && lines.length <= 3);
  for (const l of lines) assert.ok(!/!|great|amazing|awesome|incredible/i.test(l), l);
});

// ---------------------------------------------------------------- format

test('parseDuration accepts the documented forms', () => {
  assert.equal(parseDuration('5:30'), 5.5 * H);
  assert.equal(parseDuration('5h30'), 5.5 * H);
  assert.equal(parseDuration('5h 30m'), 5.5 * H);
  assert.equal(parseDuration('5.5'), 5.5 * H);
  assert.equal(parseDuration('5,5h'), 5.5 * H);
  assert.equal(parseDuration('330m'), 5.5 * H);
  assert.equal(parseDuration('45m'), 45 * 60);
  assert.equal(parseDuration('6'), 6 * H);
  assert.equal(parseDuration('90'), 90 * 60);
  assert.equal(parseDuration(''), null);
  assert.equal(parseDuration('soon'), null);
});

test('clamps and formats', () => {
  assert.equal(clampDay(25 * H), 24 * H);
  assert.equal(clampDay(-5), 0);
  assert.equal(formatHM(3 * H + 5 * 60 + 59), '3h 05m');
  assert.equal(formatHM(59), '0m');
  assert.equal(formatRemaining(61), '2m');
  assert.equal(formatEditable(5.5 * H), '5:30');
});

// ---------------------------------------------------------------- today state

const base = {
  isRunning: false, pausedTime: 0, todaySeconds: 0, todayTotal: 0, breakActive: false,
  breakUsed: 0, breakCappedAt: null, doneAt: null, offDay: false, weekMet: false
};

test('today states expose one primary action each', () => {
  assert.equal(deriveTodayState(base).state, 'idle-fresh');
  assert.equal(deriveTodayState(base).primary.label, 'Start');
  assert.equal(deriveTodayState({ ...base, isRunning: true, todayTotal: 60 }).primary.action, 'pause');
  assert.equal(deriveTodayState({ ...base, pausedTime: 5000, todaySeconds: 5, todayTotal: 5 }).primary.label, 'Resume');
  assert.equal(deriveTodayState({ ...base, breakActive: true, todayTotal: 60 }).primary.label, 'Back to work');
  assert.equal(deriveTodayState({ ...base, todayTotal: 60, breakCappedAt: 1, breakUsed: 1800 }).state, 'break-exhausted');
  assert.equal(deriveTodayState({ ...base, todayTotal: 60, doneAt: 1 }).state, 'day-done');
  // The clock stops at the 30-minute break mark: that reads as "break over", not an ordinary pause.
  const capped = deriveTodayState({ ...base, pausedTime: 4000000, todaySeconds: 4000, todayTotal: 9000, breakCappedAt: 1, breakUsed: 1800 });
  assert.equal(capped.state, 'break-exhausted');
  assert.equal(capped.primary.label, 'Back to work');
});

test('break needs some work first and an allowance left', () => {
  const fresh = deriveTodayState(base);
  assert.equal(fresh.canBreak, false);
  const working = deriveTodayState({ ...base, isRunning: true, todayTotal: 60 });
  assert.equal(working.canBreak, true);
  const used = deriveTodayState({ ...base, isRunning: true, todayTotal: 60, breakUsed: 1800 });
  assert.equal(used.canBreak, false);
  assert.ok(!used.secondary.some((a) => a.action === 'break'));
});

// ---------------------------------------------------------------- service worker

test('APP_SHELL lists every shipped file, and every listed file exists', () => {
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  const listed = [...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);
  for (const p of listed) assert.ok(existsSync(join(root, p)), `listed but missing: ${p}`);
  const walk = (dir) => readdirSync(join(root, dir)).flatMap((f) => {
    const rel = `${dir}/${f}`;
    return statSync(join(root, rel)).isDirectory() ? walk(rel) : [rel];
  });
  for (const f of [...walk('js'), ...walk('css'), ...walk('assets')]) {
    assert.ok(listed.includes(f), `shipped but not cached: ${f}`);
  }
});

test('parseDateKey round-trips', () => {
  assert.equal(getDateKey(parseDateKey('2026-02-28')), '2026-02-28');
});

// ---------------------------------------------------------------- gem cuts

test('every gem, and Clear, has its own cut', () => {
  const ids = [...GEMS.map((g) => g.id), 'clear'];
  assert.deepEqual([...CUT_IDS].sort(), [...ids].sort());
  const cuts = ids.map((id) => cutFor(id).cut);
  assert.equal(new Set(cuts).size, ids.length, 'no two gems share a cut');
});

test('gem cuts are closed convex solids of flat faces', () => {
  for (const id of CUT_IDS) {
    for (const lod of ['full', 'lite']) {
      for (const polys of cutFor(id, lod).solids) {
        assert.ok(polys.every((p) => isPlanar(p)), `${id} ${lod}: a face is not flat`);
        assert.ok(isConvex(polys), `${id} ${lod}: not convex, so back faces would show`);
      }
    }
  }
});

test('gem faces stay within budget and are drawable', () => {
  for (const id of CUT_IDS) {
    const full = facesOf(cutFor(id, 'full'));
    const lite = facesOf(cutFor(id, 'lite'));
    assert.ok(full.length <= 45, `${id}: ${full.length} faces at full size`);
    assert.ok(lite.length <= 20, `${id}: ${lite.length} faces when small`);
    for (const f of [...full, ...lite]) {
      assert.ok(f.w > 0.01 && f.h > 0.01, `${id}: a face is too thin to draw`);
      const nums = [f.w, f.h, ...f.o, ...f.u, ...f.v, ...f.n, ...f.clip.flat()];
      assert.ok(nums.every(Number.isFinite), `${id}: a face has a non-finite number`);
      assert.ok(f.clip.flat().every((x) => x >= -1e-6 && x <= 100 + 1e-6), `${id}: clip outside the face`);
      assert.ok(f.c.every((x) => Number.isFinite(x) && x >= 0 && x <= 100), `${id}: facet centre outside the face`);
    }
    const cut = cutFor(id);
    const tones = full.map((f) => toneAt(f.n, cut.light, cut.rest));
    assert.ok(Math.max(...tones) - Math.min(...tones) > 0.3, `${id}: facets need light and shade`);
  }
});
