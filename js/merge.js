// Multi-device merge rules, ported unchanged from the original tracker.
// Pure: callers pass the objects to read and mutate.
//
//  * Every day's total has a "last modified" time (meta). Past days merge
//    one at a time and the newest edit wins.
//  * Today is a running counter several devices may add to, so it merges
//    additively against the last value both sides agreed on (syncBase).
//  * A failed fetch is an error, never "the cloud is empty".

// Merge a cloud copy into local data, one day at a time, skipping skipKey.
// Mutates local.weekData and local.weekMeta. Returns how many days changed.
export function mergeRemoteData(local, remote, skipKey) {
  const remoteWeek = remote.weekData || {};
  const remoteMeta = remote.meta || {};
  const weekData = local.weekData;
  const weekMeta = local.weekMeta;
  let changed = 0;

  for (const key of Object.keys(remoteWeek)) {
    const rv = remoteWeek[key];
    if (typeof rv !== 'number' || !isFinite(rv) || rv < 0) continue;   // ignore junk
    const rt = Number(remoteMeta[key]) || 0;
    const lv = weekData[key];
    const lt = Number(weekMeta[key]) || 0;

    // Today is merged additively (see mergeToday), not by timestamp.
    if (key === skipKey) continue;

    if (lv === undefined) {
      weekData[key] = rv;
      if (rt) weekMeta[key] = rt;
      changed++;
      continue;
    }
    if (lv === rv) {
      if (rt > lt) weekMeta[key] = rt;
      continue;
    }

    // Values differ: newest edit wins. If timestamps are unknown or tied,
    // keep the larger value so hours are never silently lost.
    let takeRemote;
    if (lt && rt && lt !== rt) takeRemote = rt > lt;
    else if (rt && !lt) takeRemote = true;     // remote was deliberately edited; ours is untouched/legacy
    else if (lt && !rt) takeRemote = false;
    else takeRemote = rv > lv;

    if (takeRemote) {
      weekData[key] = rv;
      if (rt) weekMeta[key] = rt; else delete weekMeta[key];
      changed++;
    }
  }
  return changed;
}

// Today merges by ADDING each side's new time to the last agreed value:
//   merged = lastAgreed + (time added here) + (time added elsewhere)
// Returns the seconds that arrived from other devices (can be negative) and
// the new banked value for today.
export function mergeToday(remoteToday, today, { todaySavedSeconds, todaySeconds, syncBase }) {
  if (typeof remoteToday !== 'number' || !isFinite(remoteToday) || remoteToday < 0) {
    return { delta: 0, todaySavedSeconds };
  }
  const localLive = todaySavedSeconds + todaySeconds;
  const baseKnown = syncBase.key === today;
  // No history and identical totals: same data, not two separate hours that happen to match.
  if (!baseKnown && remoteToday === localLive) return { delta: 0, todaySavedSeconds };
  const theirDelta = remoteToday - (baseKnown ? syncBase.value : 0);
  if (theirDelta === 0) return { delta: 0, todaySavedSeconds };
  return { delta: theirDelta, todaySavedSeconds: Math.max(0, todaySavedSeconds + theirDelta) };
}

// Would pushing our merged data tell the cloud anything new?
export function cloudNeedsUpdate(weekData, weekMeta, remote) {
  const remoteWeek = remote.weekData || {};
  const remoteMeta = remote.meta || {};
  for (const key of Object.keys(weekData)) {
    if (remoteWeek[key] === undefined && weekData[key] === 0) continue;   // empty placeholder day
    if (remoteWeek[key] !== weekData[key]) return true;
  }
  for (const key of Object.keys(weekMeta)) {
    if ((Number(remoteMeta[key]) || 0) !== weekMeta[key]) return true;
  }
  return false;
}
