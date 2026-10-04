// The cut of each gem as plain geometry: convex solids made of flat faces, in
// em around the gem's centre, on CSS axes (x right, y down, z toward the viewer).
// The renderer in ui/gem.js turns each face into one element; nothing here
// touches the DOM, so the shapes can be tested in node.

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// The light comes from the upper left, in front of the gem.
const LIGHT = unit([-0.7, -0.45, 0.55]);

// ---------------------------------------------------------------- vectors

function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function plus(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function times(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function length(a) { return Math.hypot(a[0], a[1], a[2]); }
function unit(a) { return times(a, 1 / length(a)); }
function mean(points) { return times(points.reduce(plus, [0, 0, 0]), 1 / points.length); }

// CSS rotation matrices (rows), so the JS pose and the CSS transform agree.
function rotation(axis, deg) {
  const c = Math.cos(deg * DEG);
  const s = Math.sin(deg * DEG);
  if (axis === 'rotateX') return [[1, 0, 0], [0, c, -s], [0, s, c]];
  if (axis === 'rotateY') return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
  return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
}
function apply(m, v) { return [dot(m[0], v), dot(m[1], v), dot(m[2], v)]; }
function compose(a, b) { return a.map((row) => [0, 1, 2].map((j) => row[0] * b[0][j] + row[1] * b[1][j] + row[2] * b[2][j])); }
function transpose(m) { return [0, 1, 2].map((i) => [m[0][i], m[1][i], m[2][i]]); }
const IDENTITY = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

// ---------------------------------------------------------------- rings and faces

// n points around the vertical axis at height y; angle 0 points right, 90° at the viewer.
function ring(n, r, y, phase = 0) {
  return Array.from({ length: n }, (_, i) => {
    const a = phase * DEG + (i / n) * TAU;
    return [r * Math.cos(a), y, r * Math.sin(a)];
  });
}

// A rectangle with cut corners (the emerald cut's outline): half-width a, half-depth b, corner c.
function rectRing(a, b, c, y) {
  return [[a - c, y, b], [-(a - c), y, b], [-a, y, b - c], [-a, y, -(b - c)],
    [-(a - c), y, -b], [a - c, y, -b], [a, y, -(b - c)], [a, y, b - c]];
}

// A rounded triangle (tourmaline's section): three pairs of points spread either side of 120° marks.
function lobedRing(r, y, spread) {
  return [0, 120, 240].flatMap((a) => [a - spread, a + spread]).map((a) => [r * Math.cos(a * DEG), y, r * Math.sin(a * DEG)]);
}

const next = (arr, i) => arr[(i + 1) % arr.length];

// Quads between two rings with matching points.
function band(a, b) { return a.map((p, i) => [p, next(a, i), next(b, i), b[i]]); }

// Triangles between two rings where b[i] sits halfway between a[i] and a[i + 1].
function twist(a, b) { return a.flatMap((p, i) => [[p, next(a, i), b[i]], [b[i], next(a, i), next(b, i)]]); }

function fan(a, apex) { return a.map((p, i) => [p, next(a, i), apex]); }

// One closed convex solid: every polygon wound so its normal points outward.
function solid(polys) {
  const centre = mean(polys.flat());
  return polys.map((poly) => {
    const n = normalOf(poly);
    return dot(n, sub(mean(poly), centre)) < 0 ? poly.slice().reverse() : poly;
  });
}

function moved(polys, m, shift = [0, 0, 0]) {
  return polys.map((poly) => poly.map((p) => plus(apply(m, p), shift)));
}

// Newell's method: robust for any planar polygon.
function normalOf(poly) {
  const n = [0, 0, 0];
  poly.forEach((p, i) => {
    const q = next(poly, i);
    n[0] += (p[1] - q[1]) * (p[2] + q[2]);
    n[1] += (p[2] - q[2]) * (p[0] + q[0]);
    n[2] += (p[0] - q[0]) * (p[1] + q[1]);
  });
  return unit(n);
}

// ---------------------------------------------------------------- cuts

// Round brilliant: an octagonal table, star-and-kite crown, deep pavilion.
function brilliant(lod) {
  const table = ring(8, 0.2, -0.16);
  const girdle = ring(8, 0.42, -0.03, lod === 'full' ? 22.5 : 0);
  const crown = lod === 'full' ? twist(table, girdle) : band(table, girdle);
  return [solid([table, ...crown, ...fan(girdle, [0, 0.38, 0])])];
}

// Princess: a square table, four-sided crown, and a deep inverted pyramid, corner to the viewer.
function princess(lod) {
  const table = ring(4, 0.24, -0.17);
  const girdle = ring(4, 0.44, -0.05);
  const culet = [0, 0.36, 0];
  if (lod === 'lite') return [solid([table, ...band(table, girdle), ...fan(girdle, culet)])];
  const chevron = ring(4, 0.29, 0.18, 45);
  return [solid([table, ...band(table, girdle), ...twist(girdle, chevron), ...fan(chevron, culet)])];
}

// Trillion: a triangular brilliant, one corner toward the viewer.
function trillion(lod) {
  const table = ring(3, 0.2, -0.15, 90);
  const girdle = ring(3, 0.48, -0.04, 90);
  const culet = [0, 0.32, 0];
  if (lod === 'lite') return [solid([table, ...band(table, girdle), ...fan(girdle, culet)])];
  // full: a curved crown and pavilion, one ring each, keeping the triangle's corners
  const crown = ring(3, 0.38, -0.11, 90);
  const lower = ring(3, 0.3, 0.12, 90);
  return [solid([table, ...band(table, crown), ...band(crown, girdle), ...band(girdle, lower), ...fan(lower, culet)])];
}

// Emerald step cut: a long octagon with steps down to a keel.
function stepCut(lod) {
  const steps = lod === 'full'
    ? [[0.22, 0.12, 0.04, -0.15], [0.34, 0.21, 0.06, -0.1], [0.43, 0.28, 0.08, -0.05], [0.35, 0.2, 0.06, 0.07], [0.23, 0.1, 0.04, 0.15], [0.12, 0.03, 0.015, 0.2]]
    : [[0.22, 0.12, 0.04, -0.15], [0.43, 0.28, 0.08, -0.05], [0.12, 0.03, 0.015, 0.2]];
  const rings = steps.map(([a, b, c, y]) => rectRing(a, b, c, y));
  const bands = rings.slice(1).flatMap((r, i) => band(rings[i], r));
  return [solid([rings[0], ...bands, rings[rings.length - 1]])];
}

// Sapphire: a natural hexagonal bipyramid, barrel-shaped, standing upright.
function spindle(lod) {
  const top = [0, -0.48, 0];
  const bottom = [0, 0.48, 0];
  if (lod === 'lite') {
    const waist = ring(6, 0.26, 0);
    return [solid([...fan(waist, top), ...fan(waist, bottom)])];
  }
  const upper = ring(6, 0.15, -0.31);
  const shoulder = ring(6, 0.26, -0.06);
  const hip = ring(6, 0.26, 0.06);
  const lower = ring(6, 0.15, 0.31);
  return [solid([...fan(upper, top), ...band(upper, shoulder), ...band(shoulder, hip), ...band(hip, lower), ...fan(lower, bottom)])];
}

// One quartz point: a hexagonal prism capped by a six-sided pyramid.
function quartzPoint(r, base, shoulder, tip) {
  const foot = ring(6, r, base, 30);
  const neck = ring(6, r, shoulder, 30);
  return solid([foot, ...band(foot, neck), ...fan(neck, [0, tip, 0])]);
}

// Amethyst: three quartz points rising from one root; a single point when small.
function cluster(lod) {
  if (lod === 'lite') return [quartzPoint(0.17, 0.36, -0.1, -0.4)];
  return [
    moved(quartzPoint(0.12, 0.3, -0.12, -0.32), compose(rotation('rotateZ', -26), rotation('rotateX', 8)), [-0.16, 0.06, 0.02]),
    moved(quartzPoint(0.11, 0.3, -0.06, -0.22), compose(rotation('rotateZ', 28), rotation('rotateX', -10)), [0.17, 0.1, -0.04]),
    quartzPoint(0.14, 0.4, -0.14, -0.4)
  ];
}

// Tourmaline: a long rounded-triangle prism with a low point at one end.
function pencil() {
  const foot = lobedRing(0.15, 0.42, 22);
  const neck = lobedRing(0.15, -0.36, 22);
  return [solid([foot, ...band(foot, neck), ...fan(neck, [0, -0.5, 0])])];
}

// Clear: a raw octahedron.
function octahedron() {
  const girdle = ring(4, 0.36, 0);
  return [solid([...fan(girdle, [0, -0.4, 0]), ...fan(girdle, [0, 0.4, 0])])];
}

// pose: fixed rotations that present the cut; scale: to fill its box; rest: its resting turn.
const CUTS = {
  diamond: { cut: 'brilliant', build: brilliant, pose: [['rotateX', -34]], scale: 1.12, rest: 11 },
  topaz: { cut: 'princess', build: princess, pose: [['rotateX', -32]], scale: 1.1, rest: 6 },
  ruby: { cut: 'trillion', build: trillion, pose: [['rotateX', -40]], scale: 1.08, rest: 0 },
  emerald: { cut: 'step', build: stepCut, pose: [['rotateX', -46]], scale: 1.12, rest: -16 },
  sapphire: { cut: 'spindle', build: spindle, pose: [['rotateX', -14]], rest: 15 },
  amethyst: { cut: 'cluster', build: cluster, pose: [['rotateX', -16]], scale: 1.08, rest: 20 },
  tourmaline: { cut: 'pencil', build: pencil, pose: [['rotateZ', 48], ['rotateX', -14]], rest: 0 },
  clear: { cut: 'octahedron', build: octahedron, pose: [['rotateX', -16]], rest: 20 }
};

export const CUT_IDS = Object.keys(CUTS);

// The solids of a gem's cut. lod: 'full' (32px and up) or 'lite'.
export function cutFor(id, lod = 'full') {
  const def = CUTS[id] || CUTS.clear;
  const pose = def.pose.reduce((m, [axis, deg]) => compose(m, rotation(axis, deg)), IDENTITY);
  return {
    cut: def.cut,
    rest: def.rest,
    pose: [def.scale ? `scale3d(${def.scale}, ${def.scale}, ${def.scale})` : '', ...def.pose.map(([axis, deg]) => `${axis}(${deg}deg)`)].join(' ').trim(),
    // The light in the body's frame, so CSS can light a face from its own normal.
    light: apply(transpose(pose), LIGHT),
    solids: def.build(lod)
  };
}

// ---------------------------------------------------------------- faces

// How far each face reaches past its edges, so neighbours overlap instead of
// leaving a hairline seam.
const BLEED = 0.006;

// Each polygon as one flat element: its size (em), clip polygon (%), and the
// frame that carries it into place (origin o, axes u and v, normal n).
export function facesOf(cut) {
  return cut.solids.flat().map((poly, i) => {
    const n = normalOf(poly);
    const u = unit(sub(poly[1], poly[0]));
    const v = cross(n, u); // u × v = n, so the face's front points outward
    const c = mean(poly);
    const grown = poly.map((p) => {
      const d = sub(p, c);
      return plus(c, times(d, 1 + BLEED / length(d)));
    });
    const a = grown.map((p) => dot(sub(p, grown[0]), u));
    const b = grown.map((p) => dot(sub(p, grown[0]), v));
    const minA = Math.min(...a);
    const minB = Math.min(...b);
    const w = Math.max(...a) - minA;
    const h = Math.max(...b) - minB;
    return {
      w, h, n,
      // a small fixed nudge per facet, so neighbours facing alike still read apart
      jitter: (((i * 5) % 7) - 3) * 0.025,
      o: plus(grown[0], plus(times(u, minA), times(v, minB))),
      u, v,
      clip: a.map((x, i) => [((x - minA) / w) * 100, ((b[i] - minB) / h) * 100])
    };
  });
}

// How lit a face is (0 to 1) when the body has turned `spin` degrees: the same
// sum the stylesheet works out live.
export function toneAt(n, light, spin) {
  const turned = apply(rotation('rotateY', spin), n);
  return Math.min(1, Math.max(0, 0.3 + 0.7 * dot(light, turned)));
}

// For tests: every vertex sits on or behind every face's plane.
export function isConvex(polys, eps = 1e-9) {
  const points = polys.flat();
  return polys.every((poly) => {
    const n = normalOf(poly);
    return points.every((p) => dot(n, sub(p, poly[0])) <= eps);
  });
}

export function isPlanar(poly, eps = 1e-9) {
  const n = normalOf(poly);
  return poly.every((p) => Math.abs(dot(n, sub(p, poly[0]))) <= eps);
}
