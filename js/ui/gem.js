// A gem in CSS 3D. Each flat face of its cut (gem-cuts.js) is one element,
// carried into place by its own transform and lit by the stylesheet from its
// normal, so the light moves across the facets as the gem turns.
import { h } from './dom.js';
import { cutFor, facesOf, toneAt } from '../gem-cuts.js';

// Turning animates registered custom properties (@property). Without them a
// gem holds its pose.
const CAN_TURN = typeof CSS !== 'undefined' && typeof CSS.registerProperty === 'function';

const built = new Map();
const r4 = (x) => Math.round(x * 1e4) / 1e4;

// The faces of one cut at one level of detail, built once and cloned after.
function bodyFor(id, lod) {
  const key = `${id}:${lod}`;
  if (!built.has(key)) {
    const cut = cutFor(id, lod);
    const body = h('span', { class: 'gem-body' });
    for (const f of facesOf(cut)) {
      const frame = [...f.u, 0, ...f.v, 0, ...f.n, 0, 0, 0, 0, 1].map(r4).join(',');
      body.appendChild(h('i', {
        class: 'gem-face',
        style: [
          `width:${r4(f.w)}em`,
          `height:${r4(f.h)}em`,
          `clip-path:polygon(${f.clip.map(([x, y]) => `${r4(x)}% ${r4(y)}%`).join(',')})`,
          `transform:translate3d(${f.o.map((x) => `${r4(x)}em`).join(',')}) matrix3d(${frame})`,
          `--nx:${r4(f.n[0])}`,
          `--ny:${r4(f.n[1])}`,
          `--nz:${r4(f.n[2])}`,
          `--jitter:${r4(f.jitter * 100)}%`,
          `--tone:${Math.round(Math.min(1, Math.max(0, toneAt(f.n, cut.light, cut.rest) + f.jitter)) * 1000) / 10}%`
        ].join(';')
      }));
    }
    built.set(key, { cut, body });
  }
  return built.get(key);
}

// motion: 'hero' (its own loop), 'hover' (one turn when its host is hovered), or 'none'.
export function gem(id, size = 24, { label = null, motion = 'hover' } = {}) {
  const { cut, body } = bodyFor(id, size >= 32 ? 'full' : 'lite');
  const [lx, ly, lz] = cut.light.map(r4);
  return h('span', {
    class: 'gem',
    'data-gem': id,
    'data-cut': cut.cut,
    'data-motion': CAN_TURN ? motion : 'none',
    style: `--gem-size:${size}px;--rest:${cut.rest}deg;--lx:${lx};--ly:${ly};--lz:${lz}`,
    role: label ? 'img' : null,
    'aria-label': label,
    'aria-hidden': label ? null : 'true'
  }, [
    h('span', { class: 'gem-pose', style: `transform:${cut.pose}` }, [body.cloneNode(true)]),
    cut.cut === 'brilliant' && motion === 'hero' ? h('i', { class: 'gem-glint' }) : null
  ]);
}
