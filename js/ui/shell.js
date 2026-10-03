// The frame around the views: top bar, navigation, routing, notices, and the
// view-only banner for a second window.
import { S, on } from '../state.js';
import { h, icon, clear, setText, $ } from './dom.js';
import { stone } from './dial.js';
import { syncStatus } from '../sync.js';
import { gemFor } from '../gems.js';
import { today, weekdayLong } from '../dates.js';

const WIDE = '(min-width: 1024px)';
let route = { view: 'today', param: null };
let onRouteChange = () => {};

export function applyMode(mode) {
  const root = document.documentElement;
  if (mode === 'light' || mode === 'dark') root.dataset.mode = mode;
  else delete root.dataset.mode;
  updateThemeColor();
}

export function updateThemeColor() {
  const ground = getComputedStyle(document.documentElement).getPropertyValue('--ground').trim();
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    const media = m.getAttribute('media') || '';
    const mode = document.documentElement.dataset.mode;
    if (!mode || (mode === 'dark' && media.includes('dark')) || (mode === 'light' && media.includes('light'))) {
      if (ground) m.setAttribute('content', ground);
    }
  });
}

export function applyGem() {
  const ref = today();
  const gem = gemFor(ref);
  document.documentElement.dataset.gem = gem.id;
  const dateEl = $('#dateLine');
  if (dateEl) {
    setText(dateEl, weekdayLong(ref));
    dateEl.parentElement.title = ref.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  const gemEl = $('#gemName');
  if (gemEl) setText(gemEl, gem.name);
  const stoneEl = $('#dayStone');
  if (stoneEl && stoneEl.dataset.gem !== gem.id) {
    stoneEl.dataset.gem = gem.id;
    clear(stoneEl).appendChild(stone(gem.id, 24));
  }
}

export function isWide() {
  return matchMedia(WIDE).matches;
}

export function parseRoute() {
  const raw = (location.hash || '').replace(/^#\/?/, '');
  const [view, param] = raw.split('/');
  const map = { '': 'today', today: 'today', log: 'log', week: 'log', history: 'log', insights: 'insights', settings: 'settings' };
  return { view: map[view] || 'today', param: param || null };
}

export function currentRoute() {
  return route;
}

export function startRouter(cb) {
  onRouteChange = cb;
  window.addEventListener('hashchange', applyRoute);
  matchMedia(WIDE).addEventListener('change', applyRoute);
  applyRoute();
}

function applyRoute() {
  route = parseRoute();
  const wide = isWide();
  // On wide screens Today lives in the rail, so the main area shows Log by default.
  const mainView = wide && route.view === 'today' ? 'log' : route.view;
  document.querySelectorAll('[data-view]').forEach((el) => {
    const v = el.dataset.view;
    const visible = v === 'today' ? (wide || mainView === 'today') : v === mainView;
    el.hidden = !visible;
  });
  document.querySelectorAll('[data-nav]').forEach((a) => {
    const v = a.dataset.nav;
    const current = v === mainView || (!wide && v === 'today' && mainView === 'today');
    if (current) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  document.body.dataset.route = mainView;
  onRouteChange({ ...route, mainView, wide });
}

export function renderSyncPill() {
  const pill = $('#syncPill');
  if (!pill) return;
  const st = syncStatus();
  pill.dataset.state = st.state;
  clear(pill).append(h('span', { class: 'sync-dot', 'aria-hidden': 'true' }), h('span', { class: 'sync-label' }, st.label));
  pill.setAttribute('aria-label', `Sync: ${st.label}. Open settings`);
}

// ------------------------------------------------------------- notices

const notices = [];

export function mountNotices() {
  on((type, detail) => { if (type === 'notice') showNotice(detail); });
}

function showNotice({ title, text, kind, action, timeout }) {
  const region = $('#notices');
  if (!region) return;
  const close = h('button', { class: 'notice-close', type: 'button', 'aria-label': 'Dismiss' }, [icon('close')]);
  const children = [h('div', { class: 'notice-body' }, [h('p', { class: 'notice-title' }, title), text ? h('p', { class: 'notice-text' }, text) : null])];
  let actBtn = null;
  if (action) {
    actBtn = h('button', { class: 'notice-action', type: 'button' }, action.label);
    children.push(actBtn);
  }
  children.push(close);
  const el = h('div', { class: `notice notice-${kind || 'info'}` }, children);
  const remove = () => {
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 160);
    const i = notices.indexOf(el);
    if (i >= 0) notices.splice(i, 1);
  };
  close.addEventListener('click', remove);
  if (actBtn) actBtn.addEventListener('click', () => { try { action.run(); } finally { remove(); } });
  region.appendChild(el);
  notices.push(el);
  while (notices.length > 2) {
    const old = notices.shift();
    old.remove();
  }
  let ms = timeout || (action ? 9000 : 6000);
  let timer = setTimeout(remove, ms);
  el.addEventListener('mouseenter', () => clearTimeout(timer));
  el.addEventListener('focusin', () => clearTimeout(timer));
  el.addEventListener('mouseleave', () => { timer = setTimeout(remove, 3000); });
}

// ------------------------------------------------------------- view-only window

export function renderWindowBanner(onUseHere) {
  const slot = $('#windowBanner');
  if (!slot) return;
  clear(slot);
  slot.hidden = !S.readOnly;
  if (!S.readOnly) return;
  const btn = h('button', { class: 'btn btn-ink', type: 'button' }, 'Use here');
  btn.addEventListener('click', onUseHere);
  slot.append(h('p', { class: 'banner-text' }, 'FlowFocus is open in another window, so this one is view-only. Its hours update as you work over there.'), btn);
}
