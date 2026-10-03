// Analytics computed from the ledger. Pure: pass the (live) day map and a reference date.
import { DAILY_GOAL, WEEKLY_GOAL, STREAK_MIN } from './config.js';
import {
  getDateKey, parseDateKey, addDays, startOfDay, getWeekDates, weekStart,
  isOffDay, weekdayLong, weekdayShort
} from './dates.js';
import { gemFor } from './gems.js';
import { formatHM, formatRemaining } from './format.js';

const secondsOf = (data, key) => {
  const v = data[key];
  return typeof v === 'number' && isFinite(v) && v > 0 ? v : 0;
};

export function firstTrackedKey(data) {
  let first = null;
  for (const key of Object.keys(data)) {
    if (secondsOf(data, key) > 0 && (first === null || key < first)) first = key;
  }
  return first;
}

// Consecutive workdays with at least 30 minutes, counting back from today.
// Rest days (Tue/Fri) neither add to nor break it, and today still being under
// 30 minutes does not reset it. No upper cap.
export function calculateStreak(data, ref) {
  const first = firstTrackedKey(data);
  if (!first) return 0;
  const todayK = getDateKey(ref);
  let streak = 0;
  for (let d = startOfDay(ref); ; d = addDays(d, -1)) {
    const key = getDateKey(d);
    if (key < first) break;
    const v = secondsOf(data, key);
    if (key === todayK && v < STREAK_MIN) continue;
    if (isOffDay(d)) continue;
    if (v >= STREAK_MIN) streak++;
    else break;
  }
  return streak;
}

export function longestStreak(data, ref) {
  const first = firstTrackedKey(data);
  if (!first) return 0;
  const todayK = getDateKey(ref);
  let best = 0;
  let run = 0;
  for (let d = parseDateKey(first); getDateKey(d) <= todayK; d = addDays(d, 1)) {
    const key = getDateKey(d);
    const v = secondsOf(data, key);
    if (isOffDay(d)) continue;
    if (v >= STREAK_MIN) { run++; best = Math.max(best, run); }
    else if (key !== todayK) run = 0;
  }
  return best;
}

export function daySummary(data, date, todayK) {
  const key = getDateKey(date);
  return {
    key,
    date,
    seconds: secondsOf(data, key),
    off: isOffDay(date),
    isToday: key === todayK,
    isFuture: key > todayK,
    gem: gemFor(date).id
  };
}

export function weekSeries(data, ref) {
  const todayK = getDateKey(ref);
  return getWeekDates(ref).map((d) => daySummary(data, d, todayK));
}

export function weekTotal(data, ref) {
  return weekSeries(data, ref).reduce((sum, d) => sum + d.seconds, 0);
}

// How the week stands against 30 hours, counting only workdays that remain.
export function weekPace(data, ref) {
  const days = weekSeries(data, ref);
  const total = days.reduce((s, d) => s + d.seconds, 0);
  const remaining = Math.max(0, WEEKLY_GOAL - total);
  const todayIdx = days.findIndex((d) => d.isToday);
  const left = days.filter((d, i) => i >= todayIdx && !d.off);
  const leftAfterToday = days.filter((d, i) => i > todayIdx && !d.off);
  const throughYesterday = days.filter((d, i) => i < todayIdx).reduce((s, d) => s + d.seconds, 0);
  const todayDay = days[todayIdx];
  const todayIsWorkday = todayDay && !todayDay.off;
  const workdaysBefore = days.filter((d, i) => i < todayIdx && !d.off).length;
  const todayTarget = todayIsWorkday && left.length
    ? Math.max(0, (WEEKLY_GOAL - throughYesterday) / left.length)
    : 0;
  return {
    total,
    remaining,
    met: total >= WEEKLY_GOAL,
    workdaysLeft: left.length,
    workdaysLeftNames: left.map((d) => weekdayShort(d.date)),
    workdaysAfterToday: leftAfterToday.length,
    perWorkday: left.length ? remaining / left.length : remaining,
    todayTarget,
    todayRemaining: Math.max(0, todayTarget - (todayDay ? todayDay.seconds : 0)),
    aheadBehind: throughYesterday - DAILY_GOAL * workdaysBefore
  };
}

export function lastDays(data, ref, count = 30) {
  const todayK = getDateKey(ref);
  const out = [];
  for (let i = count - 1; i >= 0; i--) out.push(daySummary(data, addDays(startOfDay(ref), -i), todayK));
  return out;
}

// Average hours per weekday (Saturday first) over the last `weeks` full weeks
// plus the current week's finished days. Today is excluded (still in progress),
// and nothing before the first tracked day is counted.
export function weekdayPattern(data, ref, weeks = 8) {
  const first = firstTrackedKey(data);
  const todayK = getDateKey(ref);
  const start = addDays(weekStart(ref), -7 * weeks);
  const buckets = Array.from({ length: 7 }, () => ({ total: 0, count: 0 }));
  if (first) {
    for (let d = start; getDateKey(d) < todayK; d = addDays(d, 1)) {
      const key = getDateKey(d);
      if (key < first) continue;
      const idx = (d.getDay() + 1) % 7;
      buckets[idx].total += secondsOf(data, key);
      buckets[idx].count++;
    }
  }
  return getWeekDates(ref).map((d, i) => ({
    date: d,
    name: weekdayLong(d),
    short: weekdayShort(d),
    gem: gemFor(d).id,
    off: isOffDay(d),
    average: buckets[i].count ? buckets[i].total / buckets[i].count : 0,
    samples: buckets[i].count
  }));
}

export function weeklyTotals(data, ref, count = 12) {
  const out = [];
  const todayK = getDateKey(ref);
  const thisStart = weekStart(ref);
  for (let i = count - 1; i >= 0; i--) {
    const start = addDays(thisStart, -7 * i);
    const days = [];
    for (let j = 0; j < 7; j++) days.push(daySummary(data, addDays(start, j), todayK));
    out.push({
      start,
      startKey: getDateKey(start),
      end: addDays(start, 6),
      days,
      total: days.reduce((s, d) => s + d.seconds, 0),
      isCurrent: i === 0
    });
  }
  return out;
}

export function bestDay(days) {
  let best = null;
  for (const d of days) if (d.seconds > 0 && (!best || d.seconds > best.seconds)) best = d;
  return best;
}

export function bestDayEver(data) {
  let best = null;
  for (const key of Object.keys(data)) {
    const v = secondsOf(data, key);
    if (v > 0 && (!best || v > best.seconds)) best = { key, seconds: v, date: parseDateKey(key) };
  }
  return best;
}

export function lifetime(data) {
  let total = 0;
  let daysWith30 = 0;
  let daysTracked = 0;
  for (const key of Object.keys(data)) {
    const v = secondsOf(data, key);
    total += v;
    if (v > 0) daysTracked++;
    if (v >= STREAK_MIN) daysWith30++;
  }
  return { total, daysWith30, daysTracked };
}

// Average per workday over the last n days, excluding today and untracked history.
export function averagePerWorkday(data, ref, n = 30) {
  const first = firstTrackedKey(data);
  if (!first) return 0;
  const todayK = getDateKey(ref);
  let total = 0;
  let count = 0;
  for (let i = 1; i <= n; i++) {
    const d = addDays(startOfDay(ref), -i);
    const key = getDateKey(d);
    if (key < first || key >= todayK) continue;
    if (isOffDay(d)) continue;
    total += secondsOf(data, key);
    count++;
  }
  return count ? total / count : 0;
}

// The previous Saturday–Friday week, for the recap shown once a new week starts.
export function previousWeekRecap(data, ref) {
  const prevRef = addDays(weekStart(ref), -1);
  const days = weekSeries(data, prevRef).map((d) => ({ ...d, isToday: false, isFuture: false }));
  const total = days.reduce((s, d) => s + d.seconds, 0);
  return { total, best: bestDay(days), daysAtGoal: days.filter((d) => d.seconds >= DAILY_GOAL).length, start: getWeekDates(prevRef)[0] };
}

// One to three plain observations. No praise, no scolding.
export function observations(data, ref) {
  const out = [];
  const pace = weekPace(data, ref);
  const pattern = weekdayPattern(data, ref, 8).filter((d) => !d.off && d.samples >= 3 && d.average > 0);
  const first = firstTrackedKey(data);

  if (!first) {
    return ['Once a few days are tracked, patterns from your own hours will show up here.'];
  }

  if (pace.met) {
    out.push(`This week's 30 hours are in. Anything from here is extra.`);
  } else if (pace.workdaysLeft > 0) {
    const names = pace.workdaysLeftNames;
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
    out.push(`${formatRemaining(pace.remaining)} left this week: about ${formatRemaining(pace.perWorkday)} on each remaining workday (${list}).`);
  } else {
    out.push(`No workdays left this week. ${formatRemaining(pace.remaining)} short of 30 hours; rest days still count if you want them to.`);
  }

  if (pattern.length >= 2) {
    const sorted = [...pattern].sort((a, b) => b.average - a.average);
    const top = sorted[0];
    const low = sorted[sorted.length - 1];
    if (top.average - low.average >= 1800) {
      out.push(`${top.name}s are usually your longest workday (${formatHM(top.average)} on average); ${low.name}s are usually the shortest (${formatHM(low.average)}).`);
    }
  }

  const recent = lastDays(data, ref, 15).slice(0, 14);
  const lastWeek = recent.slice(7).filter((d) => !d.off);
  const weekBefore = recent.slice(0, 7).filter((d) => !d.off);
  const avg = (arr) => (arr.length ? arr.reduce((s, d) => s + d.seconds, 0) / arr.length : 0);
  const a1 = avg(lastWeek);
  const a0 = avg(weekBefore);
  if (out.length < 3 && a0 > 0 && Math.abs(a1 - a0) >= 3600) {
    out.push(`Over the last seven days your workdays averaged ${formatHM(a1)}, ${a1 > a0 ? 'up' : 'down'} from ${formatHM(a0)} the week before.`);
  }

  return out.slice(0, 3);
}
