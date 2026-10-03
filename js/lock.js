// Only one window tracks at a time. When the installed app and a browser tab
// are both open, the second one becomes view-only until "Use here" is pressed.
import { S, emit } from './state.js';

const LOCK = 'flowfocus-active-window';
let releaseHeld = null;

function hold(onLost) {
  return new Promise((resolve) => {
    navigator.locks.request(LOCK, { ifAvailable: true }, (lock) => {
      if (!lock) { resolve(false); return undefined; }
      resolve(true);
      return new Promise((release) => { releaseHeld = release; });
    }).catch(() => { onLost(); });
  });
}

// Resolves true when this window is the active one.
export async function claimWindow({ onLost }) {
  if (!('locks' in navigator)) return true;
  try {
    const got = await hold(onLost);
    S.readOnly = !got;
    if (!got) waitForFree({ onLost });
    return got;
  } catch {
    return true;
  }
}

// When the active window closes, this one takes over by itself.
function waitForFree({ onLost }) {
  navigator.locks.request(LOCK, () => {
    S.readOnly = false;
    emit('window', { active: true, reason: 'freed' });
    return new Promise((release) => { releaseHeld = release; });
  }).catch(() => { onLost(); });
}

// "Use here": take the lock from the other window.
export function takeOver({ onLost }) {
  if (!('locks' in navigator)) return;
  navigator.locks.request(LOCK, { steal: true }, () => {
    S.readOnly = false;
    emit('window', { active: true, reason: 'stolen' });
    return new Promise((release) => { releaseHeld = release; });
  }).catch(() => { onLost(); });
}

export function releaseWindow() {
  if (releaseHeld) releaseHeld();
  releaseHeld = null;
}
