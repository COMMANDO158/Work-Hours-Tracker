// Which state Today is in, and the one primary action that state offers. Pure.
import { BREAK_LIMIT, DAILY_GOAL } from './config.js';

export function deriveTodayState(input) {
  const {
    isRunning, pausedTime, todaySeconds, todayTotal, breakActive, breakUsed,
    breakCappedAt, doneAt, offDay, weekMet
  } = input;
  const breakRemaining = Math.max(0, BREAK_LIMIT - breakUsed);
  const canBreak = !breakActive && breakRemaining > 0 && (isRunning || todayTotal > 0);

  // The clock keeps running through a break; when the 30 minutes run out it
  // stops at that moment, which reads as "break over", not as an ordinary pause.
  let state;
  if (breakActive) state = 'on-break';
  else if (isRunning) state = 'working';
  else if (breakCappedAt) state = 'break-exhausted';
  else if (pausedTime > 0 || todaySeconds > 0) state = 'paused';
  else if (doneAt) state = 'day-done';
  else if (todayTotal > 0) state = 'idle';
  else state = 'idle-fresh';

  const primary = {
    'on-break': { action: 'resume-from-break', label: 'Back to work', icon: 'play' },
    working: { action: 'pause', label: 'Pause', icon: 'pause' },
    paused: { action: 'start', label: 'Resume', icon: 'play' },
    'break-exhausted': { action: 'start', label: 'Back to work', icon: 'play' },
    'day-done': { action: 'start', label: 'Keep going', icon: 'play' },
    idle: { action: 'start', label: 'Start', icon: 'play' },
    'idle-fresh': { action: 'start', label: 'Start', icon: 'play' }
  }[state];

  const secondary = [];
  if (state !== 'on-break' && breakRemaining > 0 && (canBreak || state === 'idle-fresh')) {
    secondary.push({ action: 'break', label: 'Break', disabled: !canBreak });
  }
  if (state === 'working' || state === 'paused' || state === 'on-break' || state === 'idle' || state === 'break-exhausted') {
    secondary.push({ action: 'finish', label: 'Finish day', disabled: false });
  }

  return {
    state,
    primary,
    secondary,
    breakRemaining,
    canBreak,
    breakAllUsed: breakRemaining === 0,
    dayGoalMet: todayTotal >= DAILY_GOAL,
    weekMet: !!weekMet,
    offDay: !!offDay
  };
}
