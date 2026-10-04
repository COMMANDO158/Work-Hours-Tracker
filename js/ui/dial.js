// SVG drawing for the clean visual timer. Every dial is a white face whose
// ticks and numerals sit on a band at the rim; the coloured sector grows inside
// that band, so it never covers a mark. The work face fills in the day's gem;
// its back face is the 30-minute break, filling in teal. Stones (the gems in
// their own cuts, see gem.js) name the days.
import { DAILY_GOAL, WEEKLY_GOAL, BREAK_LIMIT } from '../config.js';
import { gem } from './gem.js';

const NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;
const TOP = -Math.PI / 2;

export function svg(tag, attrs = {}, children = []) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    el.setAttribute(k, String(v));
  }
  for (const c of children) if (c) el.appendChild(c);
  return el;
}

const f = (n) => Math.round(n * 100) / 100;

function point(cx, cy, r, angle) {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

// A wedge from angle a0 sweeping by `sweep` radians (positive = clockwise).
export function wedgePath(cx, cy, r, a0, sweep) {
  const s = Math.max(-TAU, Math.min(TAU, sweep));
  if (Math.abs(s) < 0.0005) return '';
  if (Math.abs(s) >= TAU - 0.0005) {
    return `M ${f(cx - r)} ${f(cy)} A ${r} ${r} 0 1 1 ${f(cx + r)} ${f(cy)} A ${r} ${r} 0 1 1 ${f(cx - r)} ${f(cy)} Z`;
  }
  const [x0, y0] = point(cx, cy, r, a0);
  const [x1, y1] = point(cx, cy, r, a0 + s);
  const large = Math.abs(s) > Math.PI ? 1 : 0;
  return `M ${f(cx)} ${f(cy)} L ${f(x0)} ${f(y0)} A ${r} ${r} 0 ${large} ${s > 0 ? 1 : 0} ${f(x1)} ${f(y1)} Z`;
}

function line(cx, cy, r0, r1, a, cls) {
  const [x0, y0] = point(cx, cy, r0, a);
  const [x1, y1] = point(cx, cy, r1, a);
  return svg('line', { x1: f(x0), y1: f(y0), x2: f(x1), y2: f(y1), class: cls });
}

// The large face geometry, shared by the work face and the break face.
const BIG = { C: 150, face: 147, sector: 103, tickIn: 108, tickMajorIn: 106, tickOut: 120, numeralsSide: 126, numeralsPole: 134 };

function bigFace(cls) {
  const { C } = BIG;
  const root = svg('svg', { viewBox: '0 0 300 300', class: `dial ${cls}`, 'aria-hidden': 'true', focusable: 'false' });
  root.appendChild(svg('circle', { cx: C, cy: C, r: BIG.face, class: 'dial-face' }));
  return root;
}

function bigMarks(root, ticks, majorEvery, labels) {
  const { C } = BIG;
  for (let i = 0; i < ticks; i++) {
    const major = i % majorEvery === 0;
    root.appendChild(line(C, C, major ? BIG.tickMajorIn : BIG.tickIn, BIG.tickOut, TOP + (i / ticks) * TAU, major ? 'tick tick-major' : 'tick'));
  }
  // Each numeral is anchored by its side of the dial, so its inner edge always
  // clears the ticks whatever its width: start on the right, end on the left,
  // centred at the top and bottom.
  labels.forEach((text, i) => {
    const a = TOP + (i / labels.length) * TAU;
    const side = Math.cos(a);
    const anchor = side > 0.2 ? 'start' : side < -0.2 ? 'end' : 'middle';
    const [x, y] = point(C, C, anchor === 'middle' ? BIG.numeralsPole : BIG.numeralsSide, a);
    const el = svg('text', { x: f(x), y: f(y), class: 'numeral', 'text-anchor': anchor });
    el.textContent = text;
    root.appendChild(el);
  });
}

// ---------------------------------------------------------------- work face

// Today against 6 hours. Built once; update() is cheap enough for every second.
export function createWorkDial() {
  const { C } = BIG;
  const root = bigFace('dial-work');
  const gem = svg('g', { class: 'dial-gem' });
  const sector = svg('path', { class: 'sector' });
  const lap = svg('path', { class: 'sector-lap' });
  gem.append(sector, lap);
  root.appendChild(gem);
  bigMarks(root, 24, 4, ['0', '1', '2', '3', '4', '5']);
  root.appendChild(svg('circle', { cx: C, cy: C, r: 12, class: 'dial-hub' }));

  function update(seconds, gemId) {
    gem.setAttribute('data-gem', gemId);
    const frac = Math.max(0, seconds / DAILY_GOAL);
    sector.setAttribute('d', wedgePath(C, C, BIG.sector, TOP, Math.min(1, frac) * TAU));
    const over = Math.min(1, Math.max(0, frac - 1));
    lap.setAttribute('d', over > 0 ? wedgePath(C, C, BIG.sector, TOP, over * TAU) : '');
  }
  return { el: root, update };
}

// ---------------------------------------------------------------- break face

// The back of the same dial: 30 minutes, filling clockwise in teal as break is used.
export function createBreakDial() {
  const { C } = BIG;
  const root = bigFace('dial-break');
  const sector = svg('path', { class: 'break-sector' });
  root.appendChild(sector);
  bigMarks(root, 30, 5, ['0', '5', '10', '15', '20', '25']);
  root.appendChild(svg('circle', { cx: C, cy: C, r: 12, class: 'dial-hub' }));

  function update(usedSeconds) {
    const frac = Math.max(0, Math.min(1, usedSeconds / BREAK_LIMIT));
    sector.setAttribute('d', wedgePath(C, C, BIG.sector, TOP, frac * TAU));
  }
  return { el: root, update };
}

// ---------------------------------------------------------------- small dials

function smallFace(cls, size, label) {
  return svg('svg', {
    viewBox: '0 0 40 40', width: size, height: size, class: cls,
    'aria-hidden': label ? null : 'true', role: label ? 'img' : null, 'aria-label': label, focusable: 'false'
  });
}

function smallMarks(root, count) {
  for (let q = 0; q < count; q++) root.appendChild(line(20, 20, 16.2, 18.6, TOP + (q / count) * TAU, 'mini-tick'));
  root.appendChild(svg('circle', { cx: 20, cy: 20, r: 3.2, class: 'mini-hub' }));
}

export function miniDial({ seconds, gem, off = false, isToday = false, isFuture = false, size = 40, label = null }) {
  const root = smallFace(`mini${off && !seconds ? ' mini-off' : ''}${isToday ? ' mini-today' : ''}${isFuture ? ' mini-future' : ''}`, size, label);
  root.appendChild(svg('circle', { cx: 20, cy: 20, r: 19.4, class: 'mini-face' }));
  const frac = Math.max(0, (seconds || 0) / DAILY_GOAL);
  if (frac > 0) {
    const g = svg('g', { class: 'dial-gem', 'data-gem': gem });
    g.appendChild(svg('path', { d: wedgePath(20, 20, 14.6, TOP, Math.min(1, frac) * TAU), class: 'sector' }));
    if (frac > 1) g.appendChild(svg('path', { d: wedgePath(20, 20, 14.6, TOP, Math.min(1, frac - 1) * TAU), class: 'sector-lap' }));
    root.appendChild(g);
  }
  smallMarks(root, 4);
  return root;
}

// A past week, quietly: one neutral sector against 30 hours.
export function weekDial({ seconds, size = 56, label = null }) {
  const root = smallFace('mini mini-week', size, label);
  root.appendChild(svg('circle', { cx: 20, cy: 20, r: 19.4, class: 'mini-face' }));
  const frac = Math.max(0, Math.min(1, (seconds || 0) / WEEKLY_GOAL));
  if (frac > 0) {
    const g = svg('g', { class: 'dial-gem', 'data-gem': 'clear' });
    g.appendChild(svg('path', { d: wedgePath(20, 20, 14.6, TOP, frac * TAU), class: 'sector' }));
    root.appendChild(g);
  }
  smallMarks(root, 5);
  return root;
}

// ---------------------------------------------------------------- week rosette

// The week as one dial: each day's hours laid end to end in its own gem,
// against 30 hours, with a tick at every 6-hour share.
export function rosette({ days, size = 120, label = null, isCurrent = false }) {
  const C = 60;
  const root = svg('svg', {
    viewBox: '0 0 120 120', width: size, height: size,
    class: `rosette${isCurrent ? ' rosette-current' : ''}`,
    role: label ? 'img' : null, 'aria-label': label, 'aria-hidden': label ? null : 'true', focusable: 'false'
  });
  root.appendChild(svg('circle', { cx: C, cy: C, r: 58, class: 'dial-face' }));
  let start = TOP;
  let used = 0;
  for (const d of days) {
    if (!d.seconds) continue;
    const share = Math.min(d.seconds / WEEKLY_GOAL, Math.max(0, 1 - used));
    if (share <= 0) break;
    const g = svg('g', { class: 'dial-gem', 'data-gem': d.gem });
    g.appendChild(svg('path', { d: wedgePath(C, C, 45, start, share * TAU), class: 'sector rosette-seg' }));
    root.appendChild(g);
    start += share * TAU;
    used += share;
  }
  for (let i = 0; i < 5; i++) root.appendChild(line(C, C, 49, 56, TOP + (i / 5) * TAU, 'tick tick-major rosette-tick'));
  root.appendChild(svg('circle', { cx: C, cy: C, r: 5, class: 'dial-hub' }));
  return root;
}

// ---------------------------------------------------------------- stone

// The day's gem in its own cut, in CSS 3D (see gem.js). Still until its tile or
// legend cell is hovered.
export function stone(id, size = 24, label = null) {
  return gem(id, size, { label });
}
