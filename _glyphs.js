/* MINOR INDEX — the symbols that are not the mark.
 *
 * The eight-armed mark is retired here. What is left is the vocabulary it
 * was drawn against: the cell (a soma, spikes, filaments out to satellites,
 * as in plates 23–25) and the sun — the same hand, opened out, a body that
 * spends everything and is owed nothing back.
 *
 * Also `screen`: the halftone of _mark.js, cut loose from the mark, so any
 * shape can be put through the copier and over-inked or knocked out the way
 * plates 08 and 09 were.
 */
const { INK, n, rng, segDist } = require("./_mark.js");
const { halftone, fieldCover } = require("./_press.js");

/* ---- the grown parts (lifted out of mkalt.js so both can use them) ------ */
function blob(cx, cy, r, wob, rand, lobes) {
  const N = 46, pts = [];
  const ph = rand() * 6.28, ph2 = rand() * 6.28;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const rr = r * (1 + wob * Math.sin(a * (lobes || 3) + ph) + wob * 0.55 * Math.sin(a * 5 + ph2));
    pts.push(`${n(cx + Math.cos(a) * rr)},${n(cy + Math.sin(a) * rr)}`);
  }
  return `<polygon points="${pts.join(" ")}"/>`;
}
function spikes(cx, cy, r, count, len, rand, spread) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rand() * 0.5;
    const L = r + len * (0.45 + rand());
    const w = (spread || 0.16) * (0.6 + rand() * 0.8);
    out.push(`<polygon points="${n(cx + Math.cos(a - w) * r * 0.92)},${n(cy + Math.sin(a - w) * r * 0.92)} `
      + `${n(cx + Math.cos(a) * L)},${n(cy + Math.sin(a) * L)} `
      + `${n(cx + Math.cos(a + w) * r * 0.92)},${n(cy + Math.sin(a + w) * r * 0.92)}"/>`);
  }
  return out.join("");
}
function filament(x1, y1, x2, y2, w1, w2, sag, rand) {
  const mx = (x1 + x2) / 2 + (rand() - 0.5) * sag;
  const my = (y1 + y2) / 2 + (rand() - 0.5) * sag;
  const ang = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
  const ox = Math.cos(ang), oy = Math.sin(ang);
  return `<path d="M ${n(x1 + ox * w1)} ${n(y1 + oy * w1)} `
    + `Q ${n(mx + ox * (w1 + w2) / 2)} ${n(my + oy * (w1 + w2) / 2)} ${n(x2 + ox * w2)} ${n(y2 + oy * w2)} `
    + `L ${n(x2 - ox * w2)} ${n(y2 - oy * w2)} `
    + `Q ${n(mx - ox * (w1 + w2) / 2)} ${n(my - oy * (w1 + w2) / 2)} ${n(x1 - ox * w1)} ${n(y1 - oy * w1)} Z"/>`;
}

/* the cell — plates 23–25, now with the current palette */
function cell(o) {
  const opt = Object.assign({ size: 240, seed: 3, sat: 4, color: INK.white, scale: 1 }, o);
  const rand = rng(opt.seed);
  const C = opt.size / 2, k = (opt.size / 240) * opt.scale;
  const out = [], nodes = [];
  for (let i = 0; i < opt.sat; i++) {
    const a = (i / opt.sat) * Math.PI * 2 + 0.5 + rand() * 0.3;
    const R = (72 + rand() * 18) * k;
    nodes.push({ x: C + Math.cos(a) * R, y: C + Math.sin(a) * R, r: (13 + rand() * 7) * k });
  }
  for (const nd of nodes) out.push(filament(C, C, nd.x, nd.y, 7 * k, 2.4 * k, 26 * k, rand));
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i], b = nodes[(i + 1) % nodes.length];
    if (rand() < 0.6) out.push(filament(a.x, a.y, b.x, b.y, 2.6 * k, 2.2 * k, 34 * k, rand));
  }
  out.push(spikes(C, C, 30 * k, 9, 62 * k, rand, 0.13));
  out.push(blob(C, C, 30 * k, 0.13, rand, 3));
  for (const nd of nodes) {
    out.push(spikes(nd.x, nd.y, nd.r, 6, 26 * k, rand, 0.19));
    out.push(blob(nd.x, nd.y, nd.r, 0.18, rand, 4));
  }
  return `<g fill="${opt.color}">${out.join("")}</g>`;
}

/* ---- the sun ----------------------------------------------------------- */
/* geometry first, so the solid cut and the screened one are the same sun */
function sunGeom(o) {
  const opt = Object.assign({ size: 240, seed: 5, rays: 28, disc: 0.23,
                              short: 0.36, long: 0.47, wob: 0.045 }, o);
  const rand = rng(opt.seed);
  const C = opt.size / 2, R = opt.size * opt.disc, rays = [];
  for (let i = 0; i < opt.rays; i++) {
    const a = (i / opt.rays) * Math.PI * 2 + (rand() - 0.5) * (1.4 / opt.rays) * Math.PI;
    const reach = opt.size * (i % 2 ? opt.short : opt.long) * (0.9 + rand() * 0.18);
    rays.push({ a, r1: reach, w: opt.size * 0.011 * (0.7 + rand() * 1.1) });
  }
  return { C, R, rays, wob: opt.wob, seed: opt.seed, size: opt.size };
}
function sunSolid(g, color, o) {
  const opt = Object.assign({ disc: true, rays: true }, o);
  const rand = rng(g.seed + 1), out = [];
  if (!opt.rays) return `<g fill="${color}">${blob(g.C, g.C, g.R, g.wob, rand, 3)}</g>`;
  for (const ry of g.rays) {
    const half = Math.atan2(ry.w, g.R);
    out.push(`<polygon points="${n(g.C + Math.cos(ry.a - half) * g.R * 0.94)},${n(g.C + Math.sin(ry.a - half) * g.R * 0.94)} `
      + `${n(g.C + Math.cos(ry.a) * ry.r1)},${n(g.C + Math.sin(ry.a) * ry.r1)} `
      + `${n(g.C + Math.cos(ry.a + half) * g.R * 0.94)},${n(g.C + Math.sin(ry.a + half) * g.R * 0.94)}"/>`);
  }
  if (opt.disc) out.push(blob(g.C, g.C, g.R, g.wob, rand, 3));
  return `<g fill="${color}">${out.join("")}</g>`;
}
function sunSDF(g) {
  const S = g.rays.map((ry) => ({
    x1: g.C + Math.cos(ry.a) * g.R * 0.5, y1: g.C + Math.sin(ry.a) * g.R * 0.5,
    x2: g.C + Math.cos(ry.a) * ry.r1, y2: g.C + Math.sin(ry.a) * ry.r1, w: ry.w * 2,
  }));
  /* about thirty rays. Small enough that looking at every one of them beats
     any index over them — measured, not assumed. */
  return (x, y) => {
    let d = Math.hypot(x - g.C, y - g.C) - g.R;
    for (const s of S) d = Math.min(d, segDist(x, y, s));
    return d;
  };
}

/* ---- shapes as distance, so they can be cut into each other ------------ */
/* screen() only ever asks "how far outside am I", so a plate can be built
   the way a plate is: one form minus another, the dots stopping at the join.
   sSub(sun, disc) is an eclipse. */
const sDisc = (cx, cy, r) => (x, y) => Math.hypot(x - cx, y - cy) - r;
const sRing = (cx, cy, r, w) => (x, y) => Math.abs(Math.hypot(x - cx, y - cy) - r) - w / 2;
const sBox = (x0, y0, w, h) => (x, y) =>
  Math.max(Math.max(x0 - x, x - (x0 + w)), Math.max(y0 - y, y - (y0 + h)));
const sUnion = (...f) => (x, y) => { let d = 1e9; for (const fn of f) d = Math.min(d, fn(x, y)); return d; };
const sSub = (a, b) => (x, y) => Math.max(a(x, y), -b(x, y));
const sShift = (f, dx, dy) => (x, y) => f(x - dx, y - dy);

/* ---- the copier, for any shape ----------------------------------------- */
/* markDots without the mark in it: coverage → dot area, on a rotated screen.
   Big cell + wide spread is plate 08 (over-inked); light on a dark ground is
   plate 09 (knocked out). */
function screen(o) {
  const opt = Object.assign({ x: 0, y: 0, w: 240, h: 240, cell: 4.4, angle: 15,
    falloff: 9, grain: 0.2, spread: 0.5, stray: 0.35, color: INK.black, seed: 3, sdf: () => 1e9,
    bound: null, onBand: null }, o);
  return halftone({ x: opt.x, y: opt.y, w: opt.w, h: opt.h, cell: opt.cell,
    angle: opt.angle, grain: opt.grain, spread: opt.spread, stray: opt.stray, color: opt.color,
    seed: opt.seed, onBand: opt.onBand,
    cover: fieldCover(opt.sdf, opt.falloff, opt.bound) });
}

/* ---- the spiral: the same bodies, pulled in ----------------------------- */
/* Nothing new is introduced here. A spiral is what the sun's rays do once
   something takes hold of them, and what the cell does when it starts on
   itself: the vocabulary is warped, not replaced.
 *
 * `sTwist` turns the field under any shape, so a sun screened through it is
 * still that sun, wound. `sSpiral` is the bare curve — and it is never
 * sampled as a polyline, because in polar a logarithmic spiral is one line,
 * r = a·e^(bθ), and the distance to it is arithmetic on the radius. That is
 * what makes it cheap enough to put a whole sheet of it through the copier.
 */
function sTwist(f, cx, cy, k) {
  return (x, y) => {
    const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy);
    const a = -k * r, ca = Math.cos(a), sa = Math.sin(a);
    /* the warp stretches distance; slacken it or the fringe closes up */
    return f(cx + dx * ca - dy * sa, cy + dx * sa + dy * ca) / (1 + Math.abs(k) * r * 0.55);
  };
}
function sSpiral(cx, cy, o) {
  const opt = Object.assign({ a: 7, b: 0.17, turns: 3.4, from: 0, w: 9 }, o);
  const R = (t) => opt.a * Math.exp(opt.b * t);
  const t0 = opt.from, t1 = opt.from + opt.turns * Math.PI * 2;
  const slant = 1 / Math.sqrt(1 + opt.b * opt.b);   /* radial error → normal */
  const W = typeof opt.w === "function" ? opt.w : () => opt.w;
  const end = (t) => [cx + Math.cos(t) * R(t), cy + Math.sin(t) * R(t)];
  const [e0x, e0y] = end(t0), [e1x, e1y] = end(t1);
  return (x, y) => {
    const dx = x - cx, dy = y - cy, rp = Math.hypot(dx, dy);
    if (rp < 1e-6) return R(t0) * slant - W(rp) / 2;
    const th = Math.atan2(dy, dx);
    const turn = Math.round((Math.log(rp / opt.a) / opt.b - th) / (Math.PI * 2));
    let best = 1e9;
    for (let j = turn - 1; j <= turn + 1; j++) {
      const t = th + j * Math.PI * 2;
      const d = t < t0 ? Math.hypot(x - e0x, y - e0y)
        : t > t1 ? Math.hypot(x - e1x, y - e1y)
        : Math.abs(rp - R(t)) * slant;
      if (d < best) best = d;
    }
    return best - W(rp) / 2;
  };
}
/* the same curve, drawn, for the passes that are a line and not a screen */
function spiralPath(cx, cy, o) {
  const opt = Object.assign({ a: 7, b: 0.17, turns: 3.4, from: 0, step: 9, hand: 0, rand: null }, o);
  const t1 = opt.from + opt.turns * Math.PI * 2;
  const N = Math.max(24, Math.ceil(((t1 - opt.from) * 180) / Math.PI / opt.step));
  const P = [];
  for (let i = 0; i <= N; i++) {
    const t = opt.from + ((t1 - opt.from) * i) / N, r = opt.a * Math.exp(opt.b * t);
    const w = opt.hand && opt.rand ? (opt.rand() - 0.5) * opt.hand : 0;
    P.push(`${i ? "L" : "M"} ${n(cx + Math.cos(t) * r + w)} ${n(cy + Math.sin(t) * r + w)}`);
  }
  return `<path d="${P.join(" ")}"/>`;
}

/* the walls a shell leaves behind each time it comes round (plate 113) */
function spiralWalls(cx, cy, o) {
  const opt = Object.assign({ a: 7, b: 0.205, turns: 2.75, step: 0.44, from: 0.3 }, o);
  const T = opt.turns * Math.PI * 2, R = (t) => opt.a * Math.exp(opt.b * t), out = [];
  for (let t = opt.from; t < T - Math.PI * 2; t += opt.step) {
    const r0 = R(t), r1 = R(t + Math.PI * 2), m = (r0 + r1) * 0.52;
    out.push(`<path d="M ${n(cx + Math.cos(t) * r0)} ${n(cy + Math.sin(t) * r0)} `
      + `Q ${n(cx + Math.cos(t + 0.2) * m)} ${n(cy + Math.sin(t + 0.2) * m)} `
      + `${n(cx + Math.cos(t) * r1)} ${n(cy + Math.sin(t) * r1)}"/>`);
  }
  return out.join("");
}

/* ---- the seed head ----------------------------------------------------- */
/* The sun counted out: 137.5°, the angle everything that grows outward from
   a point arrives at, each seed a small body of its own. */
function phylloPts(cx, cy, count, o) {
  const opt = Object.assign({ c: 9, r0: 2.6, r1: 8, from: 0, rand: null, jitter: 0 }, o);
  const A = Math.PI * (3 - Math.sqrt(5)), out = [];
  for (let i = opt.from; i < opt.from + count; i++) {
    const k = i - opt.from, u = k / Math.max(1, count - 1);
    const r = opt.c * Math.sqrt(i), a = i * A;
    const j = opt.jitter && opt.rand ? opt.jitter : 0;
    out.push({ x: cx + Math.cos(a) * r + (j ? (opt.rand() - 0.5) * j : 0),
               y: cy + Math.sin(a) * r + (j ? (opt.rand() - 0.5) * j : 0),
               r: opt.r0 + (opt.r1 - opt.r0) * u, a, u, i });
  }
  return out;
}
/* any scatter of bodies, as one field.
 *
 * The screen asks this hundreds of thousands of times, so it is not a loop
 * over every grain: the grains go into a uniform grid and the query walks
 * outward a ring at a time, stopping as soon as the next ring cannot hold
 * anything nearer. The answer is the same minimum the loop gave — this is an
 * index, not an approximation — which is why plates cut before it exist still
 * come out byte for byte. */
/* A pile of small parts, asked "which of you is nearest" hundreds of thousands
 * of times. Not a loop over all of them: each part goes into a uniform grid by
 * the circle that certainly contains it, and a query walks outward a ring at a
 * time, stopping as soon as the next ring cannot hold anything nearer. The
 * answer is the same minimum the loop gave — this is an index, not an
 * approximation — which is why plates cut before it existed still come out byte
 * for byte. `measure` says what a part is; the walk does not care.
 */
function nearest(items, measure) {
  if (!items.length) return () => 1e9;
  /* a handful is not worth binning */
  if (items.length < 12) {
    return (x, y) => {
      let best = 1e9;
      for (let i = 0; i < items.length; i++) {
        const v = measure(x, y, items[i]);
        if (v < best) best = v;
      }
      return best;
    };
  }
  let rMax = 0, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of items) {
    if (p.R > rMax) rMax = p.R;
    if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x;
    if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
  }
  const cell = Math.max(2 * rMax, 10);
  const cols = Math.max(1, Math.ceil((x1 - x0) / cell) + 1);
  const rows = Math.max(1, Math.ceil((y1 - y0) / cell) + 1);
  const bins = new Array(cols * rows);
  for (const p of items) {
    const i = Math.min(cols - 1, Math.max(0, Math.floor((p.x - x0) / cell)));
    const j = Math.min(rows - 1, Math.max(0, Math.floor((p.y - y0) / cell)));
    (bins[j * cols + i] || (bins[j * cols + i] = [])).push(p);
  }
  return (x, y) => {
    const ci = Math.floor((x - x0) / cell), cj = Math.floor((y - y0) / cell);
    const first = Math.max(ci < 0 ? -ci : (ci > cols - 1 ? ci - (cols - 1) : 0),
                           cj < 0 ? -cj : (cj > rows - 1 ? cj - (rows - 1) : 0));
    const need = Math.max(Math.abs(ci), Math.abs(ci - (cols - 1)),
                          Math.abs(cj), Math.abs(cj - (rows - 1)));
    let best = 1e9;
    const scan = (i, j) => {
      const b = bins[j * cols + i];
      if (!b) return;
      for (let k = 0; k < b.length; k++) {
        const v = measure(x, y, b[k]);
        if (v < best) best = v;
      }
    };
    for (let ring = first; ring <= need; ring++) {
      if ((ring - 1) * cell - rMax > best) break;
      const i0 = ci - ring, i1 = ci + ring, j0 = cj - ring, j1 = cj + ring;
      const iA = Math.max(i0, 0), iB = Math.min(i1, cols - 1);
      for (let j = Math.max(j0, 0), jB = Math.min(j1, rows - 1); j <= jB; j++) {
        if (j === j0 || j === j1) { for (let i = iA; i <= iB; i++) scan(i, j); }
        else {
          if (i0 >= 0 && i0 < cols) scan(i0, j);
          if (i1 !== i0 && i1 >= 0 && i1 < cols) scan(i1, j);
        }
      }
    }
    return best;
  };
}

function sPts(pts, grow) {
  const g = grow || 0;
  return nearest(pts.map((p) => ({ x: p.x, y: p.y, R: p.r + g, r: p.r + g })),
    (x, y, p) => Math.hypot(x - p.x, y - p.y) - p.r);
}

/* how far a body actually reaches from the centre of its box — the circle
   sScatter needs, measured from the geometry instead of guessed from the box */
const sunBound = (g) => {
  let r = g.R;
  for (const ry of g.rays) r = Math.max(r, ry.r1 + ry.w);
  return r;
};
const cellBound = (cg) => {
  let r = cg.soma;
  for (const nd of cg.nodes) r = Math.max(r, Math.hypot(nd.x - cg.C, nd.y - cg.C) + nd.r);
  for (const sg of cg.segs) {
    r = Math.max(r, Math.hypot(sg.x1 - cg.C, sg.y1 - cg.C) + sg.w / 2,
                    Math.hypot(sg.x2 - cg.C, sg.y2 - cg.C) + sg.w / 2);
  }
  return r;
};

/* a union of whole bodies, each with a circle that certainly contains it:
   a body further away than the best answer so far cannot improve it, so it
   is never asked. Same minimum as sUnion, a fraction of the work. */
const sScatter = (items) => (x, y) => {
  let d = 1e9;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (Math.hypot(x - it.cx, y - it.cy) - it.r >= d) continue;
    const v = it.f(x, y);
    if (v < d) d = v;
  }
  return d;
};

/* ---- appetite ----------------------------------------------------------- */
/* What the press already does to a form, named: weight gained and lost
   (`sGrow` — a printer's spread and choke), two bodies over-inked until they
   have one contour (`sSmooth`), one body arriving at another (`sMorph`), and
   the wobble a wet plate has (`sWobble`). Nothing here draws anything. They
   are all ways of asking a shape how much of it is left.
 */
const sGrow = (f, d) => (x, y) => f(x, y) - d;
const sSmooth = (a, b, k) => (x, y) => {
  const da = a(x, y), db = b(x, y);
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (db - da)) / k));
  return db * (1 - h) + da * h - k * h * (1 - h);
};
const sMorph = (a, b, t) => (x, y) => a(x, y) * (1 - t) + b(x, y) * t;

/* value noise, hashed rather than tabled, so nothing has to be stored */
function noise2(seed) {
  const h = (i, j) => {
    let s = (Math.imul(i, 374761393) + Math.imul(j, 668265263)) ^ seed;
    s = Math.imul(s ^ (s >>> 13), 1274126177);
    return ((s ^ (s >>> 16)) >>> 0) / 4294967295;
  };
  const sm = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const i = Math.floor(x), j = Math.floor(y), fx = sm(x - i), fy = sm(y - j);
    const a = h(i, j), b = h(i + 1, j), c = h(i, j + 1), d = h(i + 1, j + 1);
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
  };
}
const sWobble = (f, amp, scale, seed) => {
  const nx = noise2(seed | 0), ny = noise2((seed | 0) + 977);
  return (x, y) => f(x + (nx(x / scale, y / scale) - 0.5) * 2 * amp,
                     y + (ny(x / scale, y / scale) - 0.5) * 2 * amp);
};

/* where a body ends: the outermost crossing along each ray out of a centre.
   A bite has to be taken out of an edge, so the edge has to be found. */
function contour(f, cx, cy, count, rMax, steps) {
  const N = steps || 200, out = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    let prev = f(cx, cy), hit = -1;
    for (let k = 1; k <= N; k++) {
      const r = (k / N) * rMax, v = f(cx + ca * r, cy + sa * r);
      if (prev < 0 && v >= 0) hit = r;
      prev = v;
    }
    if (hit > 0) out.push({ x: cx + ca * hit, y: cy + sa * hit, a, r: hit });
  }
  return out;
}
/* mouths, taken out of a body at its own edge */
const sBite = (f, pts) => (x, y) => {
  let d = f(x, y);
  for (const p of pts) d = Math.max(d, p.r0 - Math.hypot(x - p.x, y - p.y));
  return d;
};

/* ---- the cell, as a field ----------------------------------------------- */
/* `cell` above cuts polygons and is left exactly as it was, so every plate
   printed from it stays reproducible. This is the same organism grown a
   second time from its own seed, in distance — which is what the copier
   needs, and the only way the cell can be over-inked the way 08 was. */
function cellGeom(o) {
  const opt = Object.assign({ size: 240, seed: 3, sat: 4, scale: 1 }, o);
  const rand = rng(opt.seed + 7);
  const C = opt.size / 2, k = (opt.size / 240) * opt.scale;
  const nodes = [], segs = [], barbs = [];
  for (let i = 0; i < opt.sat; i++) {
    const a = (i / opt.sat) * Math.PI * 2 + 0.5 + rand() * 0.3;
    const R = (72 + rand() * 18) * k;
    nodes.push({ x: C + Math.cos(a) * R, y: C + Math.sin(a) * R, r: (13 + rand() * 7) * k });
  }
  for (const nd of nodes) segs.push({ x1: C, y1: C, x2: nd.x, y2: nd.y, w: 6 * k });
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i], b = nodes[(i + 1) % nodes.length];
    if (rand() < 0.6) segs.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, w: 2.4 * k });
  }
  for (const [cx, cy, r0, count, len, w] of
       [[C, C, 30 * k, 9, 62 * k, 5 * k]].concat(nodes.map((nd) => [nd.x, nd.y, nd.r, 6, 26 * k, 2.6 * k]))) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rand() * 0.5, L = r0 + len * (0.45 + rand());
      barbs.push({ x1: cx + Math.cos(a) * r0 * 0.6, y1: cy + Math.sin(a) * r0 * 0.6,
                   x2: cx + Math.cos(a) * L, y2: cy + Math.sin(a) * L, w });
    }
  }
  return { C, k, nodes, segs: segs.concat(barbs), soma: 30 * k, size: opt.size, seed: opt.seed };
}
function cellSDF(g) {
  return (x, y) => {
    let d = Math.hypot(x - g.C, y - g.C) - g.soma;
    for (const s of g.segs) d = Math.min(d, segDist(x, y, s));
    for (const nd of g.nodes) d = Math.min(d, Math.hypot(x - nd.x, y - nd.y) - nd.r);
    return d;
  };
}

/* the sun cut solid with the same warp sTwist puts under a field, so the
   solid plate and the screened one are one body (plates 100, 101) */
function sunWhirl(g, color, k, o) {
  const opt = Object.assign({ disc: true, steps: 8, weight: 1.5 }, o);
  const rand = rng(g.seed + 1), out = [];
  for (const ry of g.rays) {
    const r0 = g.R * 0.94, A = [], B = [];
    for (let i = 0; i <= opt.steps; i++) {
      const u = i / opt.steps, r = r0 + (ry.r1 - r0) * u;
      const a = ry.a + k * r, w = ry.w * opt.weight * (1 - u) + 0.35;
      const px = g.C + Math.cos(a) * r, py = g.C + Math.sin(a) * r;
      const nx = -Math.sin(a), ny = Math.cos(a);
      A.push(`${n(px + nx * w)},${n(py + ny * w)}`);
      B.push(`${n(px - nx * w)},${n(py - ny * w)}`);
    }
    out.push(`<polygon points="${A.concat(B.reverse()).join(" ")}"/>`);
  }
  if (opt.disc) out.push(blob(g.C, g.C, g.R, g.wob, rand, 3));
  return `<g fill="${color}">${out.join("")}</g>`;
}

module.exports = { blob, spikes, filament, cell, sunGeom, sunSolid, sunSDF, screen,
  sDisc, sRing, sBox, sUnion, sSub, sShift, sTwist, sSpiral, spiralPath, spiralWalls, phylloPts, sPts, sScatter, nearest, sunBound, cellBound,
  sGrow, sSmooth, sMorph, noise2, sWobble, contour, sBite, cellGeom, cellSDF, sunWhirl };
