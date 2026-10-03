// The only module that touches localStorage. Every access is guarded: storage
// can be full, blocked, or unavailable in a private window.

export function read(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function readJSON(key, fallback = null) {
  const raw = read(key);
  if (raw === null) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

export function write(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}

export function writeJSON(key, value) {
  return write(key, JSON.stringify(value));
}

export function remove(key) {
  try { localStorage.removeItem(key); } catch { /* nothing to do */ }
}

export function allFlowFocusKeys() {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('flowFocus')) out[k] = localStorage.getItem(k);
    }
  } catch { /* unavailable */ }
  return out;
}
