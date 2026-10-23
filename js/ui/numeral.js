// The filled numeral: the empty vessel (a faint inside, a drawn edge) and the
// gem-coloured copy, cut off flat at the level. The level is the plain custom
// property --lvl inside clip-path; only clip-path is transitioned, and --lvl is
// never registered with @property, so nothing grows Blink's custom-property cache.
//
// A numeral starts empty and rises to its level the first time it comes into
// view, one after another along a row. data-lvl holds the level it is waiting
// for. Views hand each numeral they create to rise(), and call release() on a
// subtree before they remove it, so the observer never holds a detached node.
import { h } from './dom.js';

const STAGGER = 80;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const fmt = (lvl) => Math.max(0, Math.min(1, Number(lvl) || 0)).toFixed(4);

export function nf(text, lvl, cls = '') {
  const el = h('span', { class: `nf${cls ? ` ${cls}` : ''}`, 'aria-hidden': 'true' }, [text, h('span', { class: 'nf-fill' }, text)]);
  el.style.setProperty('--lvl', '0');
  el.dataset.lvl = fmt(lvl);
  el.classList.toggle('is-empty', !(lvl > 0));
  return el;
}

// Update a numeral in place: its figures, and its level (or the level it will rise to).
export function setNf(el, text, lvl) {
  if (text != null && el.firstChild.nodeValue !== text) {
    el.firstChild.nodeValue = text;
    el.lastChild.textContent = text;
  }
  const v = fmt(lvl);
  if (el.dataset.lvl !== undefined) {
    if (el.dataset.lvl !== v) el.dataset.lvl = v;
  } else if (el.style.getPropertyValue('--lvl') !== v) {
    el.style.setProperty('--lvl', v);
  }
  const empty = !(lvl > 0);
  if (el.classList.contains('is-empty') !== empty) el.classList.toggle('is-empty', empty);
}

function settle(el) {
  if (el.dataset.lvl === undefined) return;
  el.style.setProperty('--lvl', el.dataset.lvl);
  delete el.dataset.lvl;
}

const seen = typeof IntersectionObserver === 'function' ? new IntersectionObserver((entries) => {
  let i = 0;
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    seen.unobserve(e.target);
    const el = e.target;
    setTimeout(() => settle(el), (i++) * STAGGER);
  }
}, { threshold: 0.4 }) : null;

// Watch these numerals (or every waiting numeral under a root) and fill each as it comes into view.
export function rise(target) {
  const els = target.matches && target.matches('.nf[data-lvl]') ? [target]
    : target.querySelectorAll ? [...target.querySelectorAll('.nf[data-lvl]')] : [];
  if (!els.length) return;
  if (!seen || reduce.matches) { els.forEach(settle); return; }
  // Two frames, so the empty state paints before the level is set.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    for (const el of els) {
      if (!el.isConnected) continue;
      if (el.dataset.lvl === undefined) continue;
      seen.observe(el);
    }
  }));
}

// Let go of every numeral under root that has not risen yet, before root is removed.
export function release(root) {
  if (!seen || !root || !root.querySelectorAll) return;
  if (root.matches && root.matches('.nf')) seen.unobserve(root);
  root.querySelectorAll('.nf').forEach((el) => seen.unobserve(el));
}
