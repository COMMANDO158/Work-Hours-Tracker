// The frame around the views: the theme, today's gem, the header with its
// links and menu, routing, the sync wording, notices, and the view-only banner.
import { S, on } from '../state.js';
import { h, clear, setText, setAttr, setVar, $ } from './dom.js';
import { gem as gemStone } from './gem.js';
import { syncStatus } from '../sync.js';
import { cloudStorage } from '../gist.js';
import { gemFor } from '../gems.js';
import { today, weekdayLong, weekdayShort, getDateKey } from '../dates.js';
import { formatHM, formatTimeOfDay } from '../format.js';
import { longDate, shortDate, dayLevel } from './words.js';

const PAGES = [['today', 'Today'], ['log', 'Log'], ['insights', 'Insights'], ['settings', 'Settings']];
const TITLES = { today: 'Today', log: 'Log', insights: 'Insights', settings: 'Settings' };
let route = { view: 'today', param: null };
let onRouteChange = () => {};

// ------------------------------------------------------------- theme

export function applyMode(mode) {
  const root = document.documentElement;
  if (mode === 'light' || mode === 'dark') root.dataset.mode = mode;
  else delete root.dataset.mode;
  updateThemeColor();
}

export function updateThemeColor() {
  const ground = getComputedStyle(document.documentElement).getPropertyValue('--ground').trim();
  const mode = document.documentElement.dataset.mode;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    const media = m.getAttribute('media') || '';
    if (!mode || (mode === 'dark' && media.includes('dark')) || (mode === 'light' && media.includes('light'))) {
      if (ground) m.setAttribute('content', ground);
    }
  });
}

// ------------------------------------------------------------- today's gem, name and date

let gemShown = null;

// Keeps the gem, the day's name and the date current. Cheap enough for every tick.
export function applyGem() {
  const ref = today();
  const g = gemFor(ref);
  if (document.documentElement.dataset.gem !== g.id) document.documentElement.dataset.gem = g.id;
  const name = weekdayLong(ref);
  setText($('#brandLong'), `${name} ${longDate(ref)}`);
  setText($('#brandShort'), `${weekdayShort(ref)} ${shortDate(ref)}`);
  setText($('#day-title'), name);
  setText($('#todayDate'), longDate(ref));
  if (gemShown === g.id) return;
  const first = gemShown === null;
  gemShown = g.id;
  const label = `${g.name}, the gem for ${name}`;
  const brand = $('#brandGem');
  if (brand) clear(brand).appendChild(gemStone(g.id, 36, { motion: 'hover', label }));
  // Today's gem turns on its own, and appears once.
  const seat = $('#seat');
  if (seat) turnOver(seat, gemStone(g.id, 42, { motion: 'hero', label }), first);
}

// A new day: the old gem sinks away and the new one rises in. Instant on first
// render, under reduced motion, and when the page is hidden.
let turnTimer = 0;
function turnOver(host, next, first) {
  const old = host.querySelector('.gem');
  clearTimeout(turnTimer);
  const still = first || !old || matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden;
  if (still) {
    clear(host).appendChild(next);
    return;
  }
  old.classList.add('is-leaving');
  turnTimer = setTimeout(() => {
    next.classList.add('is-arriving');
    clear(host).appendChild(next);
    turnTimer = setTimeout(() => next.classList.remove('is-arriving'), 320);
  }, 240);
}

// The gem's loops stop while the window is hidden (gems.css, .is-away) and pick up again on return.
document.addEventListener('visibilitychange', () => {
  document.documentElement.classList.toggle('is-away', document.hidden);
});

// Today's figure wherever the shell shows it: beside the Today link, and the band at the window's edge.
export function renderShellToday(seconds) {
  const text = formatHM(seconds);
  document.querySelectorAll('.nav-fig').forEach((el) => setText(el, text));
  setVar($('#daybandFill'), '--lvl', dayLevel(seconds).toFixed(4));
}

// ------------------------------------------------------------- links and the menu

// The four links, for a nav bar (nav-a) or the menu (menu-a).
export function navLinks(cls) {
  return PAGES.map(([id, name]) => h('a', { class: cls, href: `#/${id}`, 'data-nav': id },
    id === 'today' ? [name, ' ', h('span', { class: 'nav-fig' })] : [name]));
}

// Fills every nav host and menu in a subtree, once.
export function mountNav(root) {
  root.querySelectorAll('[data-nav-host]').forEach((host) => {
    if (host.firstChild) return;
    host.append(...navLinks(host.dataset.navHost));
  });
  root.querySelectorAll('[data-menu]').forEach((menu) => {
    if (menu.firstChild) return;
    menu.append(...navLinks('menu-a'), h('p', { class: 'menu-sync' }, [h('strong', { 'data-sync-label': '' }), ' ', h('span', { 'data-sync-detail': '' })]));
  });
  markCurrent();
  renderSync();
}

function closeMenus(except, focusButton) {
  document.querySelectorAll('[data-menu]').forEach((menu) => {
    if (menu === except || menu.hidden) return;
    menu.hidden = true;
    const btn = menu.parentElement.querySelector('.menu-btn');
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      if (focusButton) btn.focus();
    }
  });
}

// One set of listeners serves every menu: open under its button, close on
// Escape, on a click outside, or when a link in it is followed.
document.addEventListener('click', (e) => {
  const btn = e.target.closest && e.target.closest('.menu-btn');
  if (btn) {
    const menu = btn.parentElement.querySelector('[data-menu]');
    const open = menu.hidden;
    closeMenus(menu);
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) { const a = menu.querySelector('a'); if (a) a.focus(); }
    return;
  }
  if (e.target.closest && e.target.closest('[data-menu] a')) { closeMenus(null, false); return; }
  if (!(e.target.closest && e.target.closest('.menu-wrap'))) closeMenus(null, false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.querySelector('[data-menu]:not([hidden])')) closeMenus(null, true);
});

// ------------------------------------------------------------- routing

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
  applyRoute();
}

function markCurrent() {
  document.querySelectorAll('[data-nav]').forEach((a) => setAttr(a, 'aria-current', a.dataset.nav === route.view ? 'page' : null));
}

function applyRoute() {
  route = parseRoute();
  document.querySelectorAll('[data-view]').forEach((el) => { el.hidden = el.dataset.view !== route.view; });
  // The screen shown leads <main>, so its h1 is the document's first, as the
  // outline and simple heading tools expect. Hidden screens follow.
  const shown = document.querySelector(`[data-view="${route.view}"]`);
  if (shown && shown.parentElement && shown.parentElement.firstElementChild !== shown) shown.parentElement.prepend(shown);
  document.body.dataset.route = route.view;
  document.title = `${TITLES[route.view]} · FlowFocus`;
  markCurrent();
  closeMenus(null, false);
  onRouteChange({ ...route, mainView: route.view });
}

// ------------------------------------------------------------- sync, in words

function lastSyncWhen() {
  if (!cloudStorage.lastSync) return null;
  const d = new Date(cloudStorage.lastSync);
  if (Number.isNaN(d.getTime())) return null;
  const time = formatTimeOfDay(d.getTime());
  const sameDay = getDateKey(d) === getDateKey(today());
  return { short: sameDay ? time : `${weekdayShort(d)} ${time}`, long: sameDay ? `today at ${time}` : `${weekdayLong(d)} ${longDate(d)} at ${time}` };
}

// What every sync line says. kind is local, synced or error, and sets the mark's shape.
export function syncWords() {
  const st = syncStatus();
  const when = lastSyncWhen();
  switch (st.state) {
    case 'local': return { state: st.state, kind: 'local', label: 'This device', detail: 'Your hours are saved in this browser only.' };
    case 'syncing': return { state: st.state, kind: 'synced', label: 'Syncing', detail: 'Syncing with your GitHub gist now.' };
    case 'ok': return { state: st.state, kind: 'synced', label: when ? `Synced ${when.short}` : 'Synced', detail: when ? `In step with your other devices. Last synced ${when.long}.` : 'In step with your other devices.' };
    case 'offline': return { state: st.state, kind: 'local', label: 'Offline', detail: 'You’re offline. Your hours are safe here and will sync when you’re back online.' };
    case 'auth': return { state: st.state, kind: 'error', label: 'Reconnect sync', detail: 'GitHub didn’t accept the saved token. Your hours are safe here. Disconnect, then connect again with a new token.' };
    case 'missing': return { state: st.state, kind: 'error', label: 'Gist missing', detail: 'The sync gist couldn’t be found on GitHub. Your hours are safe here. Disconnect, then connect again to make a new one.' };
    case 'data': return { state: st.state, kind: 'error', label: 'Sync paused', detail: 'The sync file on GitHub couldn’t be read, so nothing was overwritten. Your hours are safe here.' };
    case 'retry': return { state: st.state, kind: 'error', label: 'Sync failed', detail: 'Couldn’t reach GitHub just now. Your hours are safe here; it will try again shortly.' };
    default: return { state: st.state, kind: 'synced', label: 'Sync on', detail: when ? `Last synced ${when.long}.` : 'Sync is on and will run shortly.' };
  }
}

// Every place that names the sync state: the header, Today's mark, the menus.
export function renderSync() {
  const w = syncWords();
  document.querySelectorAll('[data-sync-label]').forEach((el) => {
    setText(el, el.tagName === 'STRONG' ? `${w.label}.` : w.label);
    if (el.classList.contains('sync')) {
      setAttr(el, 'title', w.detail);
      el.classList.toggle('is-error', w.kind === 'error');
    }
  });
  document.querySelectorAll('[data-sync-detail]').forEach((el) => setText(el, w.detail));
}

// ------------------------------------------------------------- notices

const notices = [];
const SVG = 'http://www.w3.org/2000/svg';

function closeGlyph() {
  const s = document.createElementNS(SVG, 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('focusable', 'false');
  const p = document.createElementNS(SVG, 'path');
  p.setAttribute('d', 'M6.5 6.5l11 11M17.5 6.5l-11 11');
  s.appendChild(p);
  return s;
}

export function mountNotices() {
  on((type, detail) => { if (type === 'notice') showNotice(detail); });
}

function showNotice({ title, text, kind, action, timeout }) {
  const region = $('#notices');
  if (!region) return;
  const close = h('button', { class: 'notice-close', type: 'button', 'aria-label': 'Dismiss' }, [closeGlyph()]);
  const children = [h('div', { class: 'notice-body' }, [h('p', { class: 'notice-title' }, title), text ? h('p', { class: 'notice-text' }, text) : null])];
  let actBtn = null;
  if (action) {
    actBtn = h('button', { class: 'notice-action', type: 'button' }, action.label);
    children.push(actBtn);
  } else {
    children.push(h('span'));
  }
  children.push(close);
  const el = h('div', { class: `notice notice-${kind || 'info'}` }, children);
  let timer = 0;
  const remove = () => {
    clearTimeout(timer);
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 160);
    const i = notices.indexOf(el);
    if (i >= 0) notices.splice(i, 1);
  };
  close.addEventListener('click', remove);
  if (actBtn) actBtn.addEventListener('click', () => { try { action.run(); } finally { remove(); } });
  region.appendChild(el);
  notices.push(el);
  while (notices.length > 2) notices.shift().remove();
  timer = setTimeout(remove, timeout || (action ? 9000 : 6000));
  el.addEventListener('mouseenter', () => clearTimeout(timer));
  el.addEventListener('focusin', () => clearTimeout(timer));
  el.addEventListener('mouseleave', () => { clearTimeout(timer); timer = setTimeout(remove, 3000); });
}

// ------------------------------------------------------------- view-only window

export function renderWindowBanner(onUseHere) {
  const slot = $('#windowBanner');
  if (!slot) return;
  clear(slot);
  slot.hidden = !S.readOnly;
  if (!S.readOnly) return;
  const btn = h('button', { class: 'b', type: 'button' }, 'Use here');
  btn.addEventListener('click', onUseHere);
  slot.append(h('p', {}, 'FlowFocus is open in another window, so this one is view-only. Its hours update as you work over there.'), btn);
}
