// A gem in CSS 3D. Each flat face of its cut (gem-cuts.js) is one element,
// carried into place by its own transform and lit by the stylesheet from its
// normal, so the light moves across the facets as the gem turns. A large gem
// also gets the inside of each face (.gem-back), seen through the glass.
import { h } from './dom.js';
import { CUT_IDS, cutFor, facesOf, toneAt } from '../gem-cuts.js';

// Turning animates registered custom properties (@property). Without them a
// gem holds its pose.
const CAN_TURN = typeof CSS !== 'undefined' && typeof CSS.registerProperty === 'function';

const built = new Map();
const r4 = (x) => Math.round(x * 1e4) / 1e4;
const pct = (x) => `${r4(x)}%`;
const frac = (x) => x - Math.floor(x);

function faceStyle({ w, h, clip, transform, n, jitter, tone, c, s }) {
  return [
    `width:${r4(w)}em`,
    `height:${r4(h)}em`,
    `clip-path:polygon(${clip.map(([x, y]) => `${pct(x)} ${pct(y)}`).join(',')})`,
    `transform:${transform}`,
    `--nx:${r4(n[0])}`,
    `--ny:${r4(n[1])}`,
    `--nz:${r4(n[2])}`,
    `--jitter:${pct(jitter * 100)}`,
    `--tone:${tone}%`,
    `--cx:${pct(c[0])}`,
    `--cy:${pct(c[1])}`,
    `--s:${r4(s)}`
  ].join(';');
}

// The faces of one cut at one level of detail, built once and cloned after.
function bodyFor(id, lod) {
  const key = `${id}:${lod}`;
  if (!built.has(key)) {
    const cut = cutFor(id, lod);
    const body = h('span', { class: 'gem-body' });
    facesOf(cut).forEach((f, k) => {
      const frame = [...f.u, 0, ...f.v, 0, ...f.n, 0, 0, 0, 0, 1].map(r4).join(',');
      const transform = `translate3d(${f.o.map((x) => `${r4(x)}em`).join(',')}) matrix3d(${frame})`;
      const tone = Math.round(Math.min(1, Math.max(0, toneAt(f.n, cut.light, cut.rest) + f.jitter)) * 1000) / 10;
      // a fixed, evenly spread value per facet that sets where its reflection falls
      const s = frac((k + 1) * 0.618034);
      body.appendChild(h('i', {
        class: 'gem-face',
        style: faceStyle({ ...f, transform, tone, s })
      }));
      if (lod === 'full') {
        // the same plane, mirrored to face inward
        body.appendChild(h('i', {
          class: 'gem-back',
          style: faceStyle({
            ...f,
            clip: f.clip.map(([x, y]) => [100 - x, y]),
            transform: `${transform} translateX(${r4(f.w)}em) scaleX(-1)`,
            n: f.n.map((x) => -x),
            tone,
            c: [100 - f.c[0], f.c[1]],
            s: frac(s + 0.37)
          })
        }));
      }
    });
    built.set(key, { cut, body });
  }
  return built.get(key);
}

// motion: 'hero' (its own loop), 'hover' (one turn when its host is hovered), or 'none'.
export function gem(id, size = 24, { label = null, motion = 'hover' } = {}) {
  const lod = size >= 32 ? 'full' : 'lite';
  const { cut, body } = bodyFor(id, lod);
  const [lx, ly, lz] = cut.light.map(r4);
  return h('span', {
    class: 'gem',
    'data-gem': id,
    'data-cut': cut.cut,
    'data-lod': lod,
    'data-motion': CAN_TURN ? motion : 'none',
    style: `--gem-size:${size}px;--rest:${cut.rest}deg;--lx:${lx};--ly:${ly};--lz:${lz};--i:${Math.max(0, CUT_IDS.indexOf(id))}`,
    role: label ? 'img' : null,
    'aria-label': label,
    'aria-hidden': label ? null : 'true'
  }, [
    h('span', { class: 'gem-pose', style: `transform:${cut.pose}` }, [body.cloneNode(true)]),
    cut.cut === 'brilliant' && motion === 'hero' ? h('i', { class: 'gem-glint' }) : null
  ]);
}
