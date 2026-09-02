/* MINOR INDEX — the alphabet as a font binary.
 *
 * Everything else here draws with a pen: a skeleton of lines and arcs, stroked
 * with a round cap. A font has no pen — it has filled outlines — so the pen has
 * to become shapes before anyone can type with it.
 *
 * The honest way to outline a stroke is to offset it, and the honest way to get
 * that wrong is a tight curve, where the inner offset folds back through itself
 * and eats a hole in the letter. So nothing here is offset: every segment
 * becomes its own capsule and every joint its own disc, all wound the same way.
 * TrueType fills by non-zero winding, so a pile of overlapping convex shapes is
 * exactly their union — the letter — with no fold to get wrong.
 *
 * Then the TrueType tables, written out by hand, because a repository that
 * decodes its own PNGs should not import a library to write a font.
 */
const T = require("./_letters.js");
const P = require("./_press.js");   /* the copier, so a screened cut is the one on the sheet */

const UPM = 1000, CAP = 700;          /* the em, and the cap height inside it */
const ASC = 950, DESC = -180;
/* LONGDATETIME: seconds since 1904, held still so the binary is reproducible */
const STAMP = 3869510400;             /* 2026-08-31 */

/* the family. Three weights that are not three drawings — the pen was always
   a parameter of the plates, so this is one skeleton at three settings. */
const FAMILY = [
  { style: "Light", weight: 0.075, hand: 0.014, css: 300 },
  { style: "Regular", weight: 0.12, hand: 0.015, css: 400 },
  { style: "Bold", weight: 0.19, hand: 0.016, css: 700 },
];
/* what a font menu sorts by. Three faces all claiming 400 collide in the
   menu and only one of them can be picked. */
const weightClass = (pen) => {
  let best = FAMILY[0];
  for (const f of FAMILY) if (Math.abs(f.weight - pen) < Math.abs(best.weight - pen)) best = f;
  return best.css;
};

/* ---- pen into outlines -------------------------------------------------- */
const ARCPTS = 12;                    /* points round a cap or a joint */
const DOTPTS = 12;                   /* and round a halftone dot, which is set large */
function capsule(x1, y1, x2, y2, r) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  if (L < 1e-6) return disc(x1, y1, r);
  const nx = (-dy / L) * r, ny = (dx / L) * r;
  const a0 = Math.atan2(dy, dx);
  const pts = [[x1 + nx, y1 + ny], [x2 + nx, y2 + ny]];
  for (let i = 1; i < ARCPTS; i++) {                    /* round the far end */
    const a = a0 + Math.PI / 2 - (Math.PI * i) / ARCPTS;
    pts.push([x2 + Math.cos(a) * r, y2 + Math.sin(a) * r]);
  }
  pts.push([x2 - nx, y2 - ny], [x1 - nx, y1 - ny]);
  for (let i = 1; i < ARCPTS; i++) {                    /* and the near one */
    const a = a0 - Math.PI / 2 - (Math.PI * i) / ARCPTS;
    pts.push([x1 + Math.cos(a) * r, y1 + Math.sin(a) * r]);
  }
  return pts;
}
function disc(cx, cy, r, k) {
  const N = k || ARCPTS * 2;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}
/* wound the way TrueType wants a filled contour */
function area(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    s += (b[0] - a[0]) * (b[1] + a[1]);
  }
  return s;
}
function orient(pts) { return area(pts) > 0 ? pts : pts.slice().reverse(); }

/**
 * One character, as contours in font units (y up, baseline at 0).
 *
 * `joints: "all"` stops the letter dropping the disc at a joint that is
 * straight through. A dropped joint is invisible — it sits inside the two
 * capsules either side of it — but whether a joint counts as straight
 * depends on the angle, and the angle moves when the pen or the width move.
 * A variable font needs every instance of a letter to have the same points
 * in the same order, so for that the joints are all kept.
 *
 * `flips` does the same for winding. It is normally measured per ring; pass
 * the default instance's decisions back in and every instance is wound the
 * way the default was, whatever its own arithmetic would have said.
 */
function outlineGlyph(ch, opt) {
  const o = Object.assign({ weight: 0.12, hand: 0.015, seed: 7, width: 1, slant: 0,
                            joints: "corners", flips: null }, opt);
  const g = T.glyph(ch);
  if (!g) return null;
  /* drawn exactly as a plate draws it, then the polylines are read back */
  const tp = T.textPaths(ch, 0, 0, 1, { weight: o.weight, hand: o.hand, seed: o.seed,
                                        width: o.width, slant: o.slant, track: 0 });
  const r = (o.weight / 2) * CAP;
  const rings = [], flips = [];
  const F = (p) => [p[0] * CAP, (1 - p[1]) * CAP];      /* design y-down to font y-up */
  const wind = (pts) => {
    const k = rings.length;
    const flip = o.flips ? o.flips[k] : area(pts) <= 0;
    flips.push(flip);
    rings.push(flip ? pts.slice().reverse() : pts);
  };
  for (const gl of tp.glyphs) {
    for (const run of gl.runs) {
      for (let i = 1; i < run.length; i++) {
        const a = F(run[i - 1]), b = F(run[i]);
        wind(capsule(a[0], a[1], b[0], b[1], r));
      }
      for (let i = 0; i < run.length; i++) {            /* joints, and both ends */
        if (o.joints !== "all" && i > 0 && i < run.length - 1) {
          const p = run[i], q = run[i - 1], s = run[i + 1];
          const a1 = Math.atan2(s[1] - p[1], s[0] - p[0]);
          const a2 = Math.atan2(q[1] - p[1], q[0] - p[0]);
          let d = Math.abs(a1 - a2);
          if (d > Math.PI) d = Math.PI * 2 - d;
          if (Math.abs(d - Math.PI) < 0.25) continue;   /* straight on: no joint */
        }
        const p = F(run[i]);
        wind(disc(p[0], p[1], r));
      }
    }
  }
  const adv = Math.round((g.w + T.TRACK) * CAP * o.width);
  return { contours: rings.map((ring) => ring.map((p) => [Math.round(p[0]), Math.round(p[1])])),
           adv, flips };
}

/* ---- the same letter, through the press ---------------------------------
 *
 * A plate does not stop at the cut. The letters are a distance field like
 * every body the atelier prints, so a word takes the screen, the flood and
 * the knock-out exactly as a sun does — and each of those is a font too, as
 * long as the ink it leaves can be written as filled outlines.
 *
 *   screened     the copier, once, on the letter's own field: every dot its
 *                own contour. Built at the size a plate is printed at and
 *                enlarged to the em, so the screen is the one that is on the
 *                sheet and not a finer one invented for type.
 *   over-inked   the same press run hot: the field grown, the cell coarser,
 *                the dots spread until they touch. Overlaps cost nothing —
 *                non-zero winding is a union.
 *   knocked out  the letter as a hole in the slab. This one cannot be a pile
 *                of capsules: two of them over each other wind to −2 inside
 *                the slab's +1 and the ink comes back. So the field is traced
 *                instead — marching squares along the contour — and what
 *                comes back is the union's own edge, one loop per boundary,
 *                which can be wound against the slab.
 */
const PLATE_CAP = 62;                 /* the cap height Fig. 05 prints at */
const PRESSES = [
  { cut: "screen", name: "Screened", label: "Screened",
    weight: 0.13, hand: 0.02,
    screen: { cell: 3.2, falloff: 5, spread: 0.54, grain: 0.1, angle: 15, seed: 5, grow: 0 } },
  { cut: "hot", name: "Overinked", label: "Over-inked",
    weight: 0.13, hand: 0.02,
    screen: { cell: 4.8, falloff: 7, spread: 0.66, grain: 0.14, angle: 15, seed: 5, grow: 1.5 } },
  { cut: "knock", name: "Knockout", label: "Knocked out",
    weight: 0.155, hand: 0.02, slab: [-150, 840], step: 6, tol: 0.3 },
];
const press = (cut) => PRESSES.filter((p) => p.cut === cut)[0];

const segD = (px, py, s) => {
  const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
  const L2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - s.x1) * dx + (py - s.y1) * dy) / L2));
  return Math.hypot(px - (s.x1 + dx * t), py - (s.y1 + dy * t));
};

/**
 * One character as a distance field, in font units: how far outside am I.
 *
 * The same walk `outlineGlyph` makes — the same skeleton, the same wobble,
 * the same seed — read as distance rather than as capsules. `scale` is the
 * cap height it is measured at: the em for a cut, and the plate for a screen,
 * whose cell and grain are numbers in millimetres and not in em units.
 */
function glyphField(ch, opt) {
  const o = Object.assign({ weight: 0.12, hand: 0.015, seed: 7, width: 1, slant: 0,
                            scale: CAP }, opt);
  const g = T.glyph(ch);
  if (!g) return null;
  const S = o.scale;
  const tp = T.textPaths(ch, 0, 0, 1, { weight: o.weight, hand: o.hand, seed: o.seed,
                                        width: o.width, slant: o.slant, track: 0 });
  const r = (o.weight / 2) * S;
  const F = (p) => [p[0] * S, (1 - p[1]) * S];
  const segs = [];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const gl of tp.glyphs) {
    for (const run of gl.runs) {
      for (let i = 0; i < run.length; i++) {
        const p = F(run[i]), q = F(run[i > 0 ? i - 1 : 0]);
        segs.push({ x1: q[0], y1: q[1], x2: p[0], y2: p[1] });   /* the ends are caps */
        if (p[0] < x0) x0 = p[0];
        if (p[0] > x1) x1 = p[0];
        if (p[1] < y0) y0 = p[1];
        if (p[1] > y1) y1 = p[1];
      }
    }
  }
  const adv = (g.w + T.TRACK) * S * o.width;
  if (!segs.length) return { d: null, r, adv, scale: S, box: null, bound: null };
  const d = (x, y) => {
    let m = 1e9;
    for (let i = 0; i < segs.length; i++) {
      const v = segD(x, y, segs[i]);
      if (v < m) m = v;
    }
    return m - r;
  };
  return { d, r, adv, scale: S,
           box: { x0: x0 - r, y0: y0 - r, x1: x1 + r, y1: y1 + r },
           bound: { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2,
                    r: Math.hypot(x1 - x0, y1 - y0) / 2 + r } };
}

/**
 * The press, on one letter: every dot a contour of its own.
 *
 * The lattice is pinned to the glyph's origin rather than to its bounding
 * box, so the same letter is screened the same way wherever it is set and
 * two letters side by side are two windows onto one screen.
 */
function screenGlyph(ch, o) {
  const s = o.screen;
  const S = o.plateCap || PLATE_CAP;
  const f = glyphField(ch, Object.assign({}, o, { scale: S }));
  if (!f) return null;
  const k = CAP / S;                                   /* the plate, enlarged to the em */
  if (!f.d) return { contours: [], adv: Math.round(f.adv * k) };
  const grow = s.grow || 0;
  const pad = s.falloff + s.cell;
  /* the lattice is laid out from the middle of the window, so the window is
     centred on the lattice point nearest the letter: tight around the ink —
     a window twice as wide as the letter prints the empty half of it, and
     that grain lands on the next letter along — and still in step with the
     origin, so a letter is screened the same way wherever it is set */
  const a = (s.angle * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const dx = (f.box.x0 + f.box.x1) / 2, dy = (f.box.y0 + f.box.y1) / 2 - S * 0.5;
  const li = Math.round((dx * ca + dy * sa) / s.cell) * s.cell;
  const lj = Math.round((-dx * sa + dy * ca) / s.cell) * s.cell;
  const ax = li * ca - lj * sa, ay = S * 0.5 + li * sa + lj * ca;
  const W = Math.max(Math.abs(f.box.x0 - ax), Math.abs(f.box.x1 - ax)) * 2 + pad * 2;
  const H = Math.max(Math.abs(f.box.y0 - ay), Math.abs(f.box.y1 - ay)) * 2 + pad * 2;
  const contours = [];
  P.halftone({ x: ax - W / 2, y: ay - H / 2, w: W, h: H,
    cell: s.cell, angle: s.angle, grain: s.grain, spread: s.spread, seed: s.seed,
    cover: P.fieldCover((x, y) => f.d(x, y) - grow, s.falloff,
                        { cx: f.bound.cx, cy: f.bound.cy, r: f.bound.r + grow }),
    onDot: (x, y, r) => {
      if (r * k < 3) return;                           /* under a third of a percent of the em */
      contours.push(orient(disc(x * k, y * k, r * k, DOTPTS)));
    } });
  return { contours, adv: Math.round(f.adv * k) };
}

/**
 * The edge of a field, as closed loops — marching squares, interpolated.
 *
 * A crossing is named by the grid edge it sits on rather than by where it
 * landed, so the two cells that share it agree about it exactly and the
 * loops close. Segments are laid down with the inside on the left, which
 * winds an outer loop one way and a counter the other without either of
 * them having to be measured.
 */
function traceField(f, box, step) {
  const nx = Math.ceil((box[2] - box[0]) / step) + 1;
  const ny = Math.ceil((box[3] - box[1]) / step) + 1;
  const X = (i) => box[0] + i * step, Y = (j) => box[1] + j * step;
  const V = new Float64Array(nx * ny);
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) V[i * ny + j] = f(X(i), Y(j));
  const at = (i, j) => V[i * ny + j];
  const cut = (a, b) => (a === b ? 0.5 : a / (a - b));
  /* an edge is (cell, horizontal or vertical); the point on it is found once */
  const pt = (key) => {
    const e = key & 1, c = (key - e) / 2, j = c % ny, i = (c - j) / ny;
    return e ? [X(i), Y(j) + cut(at(i, j), at(i, j + 1)) * step]
             : [X(i) + cut(at(i, j), at(i + 1, j)) * step, Y(j)];
  };
  const next = new Map();
  const link = (a, b) => next.set(a, b);
  for (let i = 0; i < nx - 1; i++) {
    for (let j = 0; j < ny - 1; j++) {
      const va = at(i, j), vb = at(i + 1, j), vc = at(i + 1, j + 1), vd = at(i, j + 1);
      const m = (va < 0 ? 1 : 0) | (vb < 0 ? 2 : 0) | (vc < 0 ? 4 : 0) | (vd < 0 ? 8 : 0);
      if (m === 0 || m === 15) continue;
      const B = (i * ny + j) * 2, L = (i * ny + j) * 2 + 1;
      const R = ((i + 1) * ny + j) * 2 + 1, A = (i * ny + j + 1) * 2;
      const mid = (va + vb + vc + vd) / 4 < 0;
      if (m === 1) link(B, L);
      else if (m === 2) link(R, B);
      else if (m === 4) link(A, R);
      else if (m === 8) link(L, A);
      else if (m === 3) link(R, L);
      else if (m === 6) link(A, B);
      else if (m === 12) link(L, R);
      else if (m === 9) link(B, A);
      else if (m === 7) link(A, L);
      else if (m === 14) link(L, B);
      else if (m === 13) link(B, R);
      else if (m === 11) link(R, A);
      else if (m === 5) { if (mid) { link(B, R); link(A, L); } else { link(B, L); link(A, R); } }
      else if (m === 10) { if (mid) { link(L, B); link(R, A); } else { link(R, B); link(L, A); } }
    }
  }
  const loops = [];
  while (next.size) {
    let key = next.keys().next().value;
    const loop = [];
    while (next.has(key)) {
      const to = next.get(key);
      next.delete(key);
      loop.push(pt(key));
      key = to;
    }
    if (loop.length >= 3) loops.push(loop);
  }
  return loops;
}

/* a traced loop is mostly points in a straight line: what the grid stepped
   over, not what the letter turns through */
function thin(loop, tol) {
  const keep = [];
  for (let i = 0; i < loop.length; i++) {
    const p = loop[i];
    const a = keep.length ? keep[keep.length - 1] : loop[loop.length - 1];
    const b = loop[(i + 1) % loop.length];
    const ux = b[0] - a[0], uy = b[1] - a[1];
    const L = Math.hypot(ux, uy) || 1;
    if (Math.abs((p[0] - a[0]) * uy - (p[1] - a[1]) * ux) / L > tol) keep.push(p);
  }
  return keep.length >= 3 ? keep : loop;
}
/* to the grid the font is written on, without a point twice */
function toGrid(loop) {
  const out = [];
  for (const p of loop) {
    const q = [Math.round(p[0]), Math.round(p[1])];
    const last = out[out.length - 1];
    if (!last || last[0] !== q[0] || last[1] !== q[1]) out.push(q);
  }
  while (out.length > 1 && out[0][0] === out[out.length - 1][0]
                        && out[0][1] === out[out.length - 1][1]) out.pop();
  return out;
}

/**
 * The letter, knocked out of the slab.
 *
 * The slab is exactly one advance wide, so a word sets as one unbroken band —
 * which is what a knock-out is, and why no two slabs may overlap: two of them
 * over each other wind to ±2 and the hole between them closes.
 *
 * Which means the letter has to fit. A pen is half a stroke wider than the
 * drawing on each side, and the tracking the cut letters are spaced on does
 * not cover it, so a slab is let out to the ink where the ink is wider and
 * the letter is centred in it. Anything still overhanging — an accent, a
 * wobble — is trimmed by the trace itself: the field asked for is the letter
 * *inside* the box, so no loop is ever left outside the ink for the winding
 * to fill back in.
 */
function knockGlyph(ch, o) {
  const f = glyphField(ch, o);
  if (!f) return null;
  const y0 = o.slab[0], y1 = o.slab[1];
  const side = Math.round((o.side || 0.035) * CAP);
  const inkW = f.box ? f.box.x1 - f.box.x0 : 0;
  const adv = Math.max(Math.round(f.adv), Math.round(inkW + side * 2));
  /* the slab runs a hair past its advance at both ends. Two slabs that only
     touch leave a hairline where the rasteriser rounds them to pixels, and a
     band with white threads through it is not a band. The overlap is a
     fraction of the side bearing, so no letter is ever inside it. */
  const b = o.bleed || 6;
  const slab = orient([[-b, y0], [adv + b, y0], [adv + b, y1], [-b, y1]]);
  if (!f.d || adv < 4) return { contours: [slab], adv };
  const dx = (adv - inkW) / 2 - f.box.x0;              /* centred in its own slab */
  const in0 = 0.5;                    /* a hair inside, so the two edges never coincide */
  const boxD = (x, y) => Math.max(Math.max(in0 - b - x, x - (adv + b - in0)),
                                  Math.max(y0 + in0 - y, y - (y1 - in0)));
  const field = (x, y) => Math.max(f.d(x - dx, y), boxD(x, y));
  const contours = [slab];
  for (const loop of traceField(field, [-b - 2, y0 - 2, adv + b + 2, y1 + 2], o.step)) {
    const ring = toGrid(thin(loop, o.tol));
    if (ring.length >= 3) contours.push(ring);
  }
  return { contours, adv };
}

/** one letter, whichever press it went through */
function pressGlyph(ch, o) {
  return o.cut === "knock" ? knockGlyph(ch, o) : screenGlyph(ch, o);
}

/* ---- the binary ---------------------------------------------------------
   Plain byte arrays, not node Buffers, so the atelier can write a font in the
   browser with the same code the command line uses. */
const buf = (k) => new Uint8Array(k);
function cat() {
  const parts = arguments.length === 1 && Array.isArray(arguments[0])
    ? arguments[0] : Array.prototype.slice.call(arguments);
  let len = 0;
  for (const p of parts) len += p.length;
  const out = new Uint8Array(len);
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}
const pad4 = (b) => (b.length % 4 ? cat(b, buf(4 - (b.length % 4))) : b);
const u16 = (v) => { const b = buf(2); new DataView(b.buffer).setUint16(0, v & 0xffff); return b; };
const i16 = (v) => { const b = buf(2);
  new DataView(b.buffer).setInt16(0, Math.max(-32768, Math.min(32767, Math.round(v)))); return b; };
const u32 = (v) => { const b = buf(4); new DataView(b.buffer).setUint32(0, v >>> 0); return b; };
const tag = (s) => Uint8Array.from(s.split("").map((c) => c.charCodeAt(0) & 0xff));
const utf16be = (s) => {
  const b = buf(s.length * 2), dv = new DataView(b.buffer);
  for (let i = 0; i < s.length; i++) dv.setUint16(i * 2, s.charCodeAt(i));
  return b;
};
function checksum(b) {
  const p = pad4(b);
  const dv = new DataView(p.buffer, p.byteOffset, p.byteLength);
  let s = 0;
  for (let i = 0; i < p.length; i += 4) s = (s + dv.getUint32(i)) >>> 0;
  return s >>> 0;
}

function glyfEntry(contours) {
  if (!contours.length) return buf(0);
  const pts = [], ends = [];
  for (const c of contours) { for (const p of c) pts.push(p); ends.push(pts.length - 1); }
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const parts = [i16(contours.length), i16(Math.min.apply(null, xs)), i16(Math.min.apply(null, ys)),
                 i16(Math.max.apply(null, xs)), i16(Math.max.apply(null, ys))];
  for (const e of ends) parts.push(u16(e));
  parts.push(u16(0));                                   /* no instructions */
  for (let i = 0; i < pts.length; i++) parts.push(Uint8Array.from([1]));   /* every point on curve */
  let px = 0, py = 0;
  for (const p of pts) { parts.push(i16(p[0] - px)); px = p[0]; }
  for (const p of pts) { parts.push(i16(p[1] - py)); py = p[1]; }
  return pad4(cat.apply(null, parts));
}

function cmap4(map) {
  const codes = Object.keys(map).map(Number).sort((a, b) => a - b);
  const segs = [];
  let i = 0;
  while (i < codes.length) {
    let j = i;
    while (j + 1 < codes.length && codes[j + 1] === codes[j] + 1
           && map[codes[j + 1]] === map[codes[j]] + 1) j++;
    segs.push({ start: codes[i], end: codes[j], delta: (map[codes[i]] - codes[i]) & 0xffff });
    i = j + 1;
  }
  segs.push({ start: 0xffff, end: 0xffff, delta: 1 });
  const n = segs.length;
  let sr = 2;
  while (sr * 2 <= n * 2) sr *= 2;
  const parts = [u16(4), u16(16 + n * 8), u16(0), u16(n * 2), u16(sr),
                 u16(Math.round(Math.log2(sr / 2))), u16(n * 2 - sr)];
  for (const s of segs) parts.push(u16(s.end));
  parts.push(u16(0));
  for (const s of segs) parts.push(u16(s.start));
  for (const s of segs) parts.push(u16(s.delta));
  for (const s of segs) parts.push(u16(0));
  const sub = cat.apply(null, parts);
  return cat(u16(0), u16(1), u16(3), u16(1), u32(12), sub);
}

function nameTable(records) {
  const items = records.map(([id, str]) => ({
    id,
    mac: tag(str),
    /* UTF-16BE: the high byte is a zero, not a space. It was a space, which
       is why the family name read as "\u2050\u2069\u206e\u206f\u2072" on Windows and was fine on a Mac,
       where the platform-1 record above is the one that gets read. */
    win: utf16be(str),
  }));
  const heads = [], datas = [];
  let off = 0;
  for (const it of items) {
    heads.push(cat(u16(1), u16(0), u16(0), u16(it.id), u16(it.mac.length), u16(off)));
    datas.push(it.mac); off += it.mac.length;
  }
  for (const it of items) {
    heads.push(cat(u16(3), u16(1), u16(0x0409), u16(it.id), u16(it.win.length), u16(off)));
    datas.push(it.win); off += it.win.length;
  }
  return cat(u16(0), u16(heads.length), u16(6 + heads.length * 12),
             cat.apply(null, heads), cat.apply(null, datas));
}

/**
 * A TrueType file from the drawn alphabet.
 *   weight  the pen, as a fraction of cap — the same number the plates use
 *   hand    how much shake is baked in (a font repeats it, so keep it small)
 *   cut     which press it went through: nothing for the cut letter, or one
 *           of "screen", "hot", "knock" — the rest of the file is the same
 *           work either way, because a glyph is only ever contours and an
 *           advance however the ink got there
 */
function buildTTF(opt) {
  const o = Object.assign({ family: "Minor Index", style: "Regular", weight: 0.12,
                            hand: 0.015, seed: 7, width: 1, slant: 0, version: "1.000" }, opt);
  if (o.cut) Object.assign(o, press(o.cut), opt);
  const bold = o.weight > 0.18;
  const wclass = o.usWeightClass || weightClass(o.weight);
  const extra = ["É", "È", "Ê", "Ë", "À", "Â", "Ç",
                 "Î", "Ï", "Ô", "Û", "Ù"];
  const chars = Object.keys(T.G).concat(extra)
    .filter((c, i, a) => a.indexOf(c) === i && c !== " ");
  const glyphs = [{ contours: [], adv: Math.round(0.32 * CAP) }];       /* 0 = .notdef */
  const map = {};
  const space = T.glyph(" ");
  const spaceAdv = Math.round((space.w + T.TRACK) * CAP * o.width);
  /* a knocked-out space is a slab with nothing punched out of it, or the band
     breaks between the words and the knock-out stops being one */
  const sb = o.bleed || 6;
  glyphs.push({ adv: spaceAdv, contours: o.cut === "knock"
    ? [orient([[-sb, o.slab[0]], [spaceAdv + sb, o.slab[0]],
               [spaceAdv + sb, o.slab[1]], [-sb, o.slab[1]]])] : [] });
  map[32] = 1;
  for (const ch of chars) {
    const g = o.cut ? pressGlyph(ch, o) : outlineGlyph(ch, o);
    if (!g) continue;
    map[ch.codePointAt(0)] = glyphs.length;
    /* lowercase types the caps — accented lowercase too, which French needs */
    const low = ch.toLowerCase();
    if (low !== ch) map[low.codePointAt(0)] = glyphs.length;
    glyphs.push(g);
  }
  return tables(o, glyphs, map, { style: o.style, usWeightClass: wclass, weight: o.weight });
}

/* ---- the tables, for a file with one instance in it or with all of them --
 * Everything below the glyphs is the same work either way: the directory,
 * the checksums, the metrics, the names. `extra` is what a variable font
 * brings that a static one does not.
 */
function tables(o, glyphs, map, k) {
  const bold = k.weight > 0.18;
  const wclass = k.usWeightClass;
  const extra = k.extra || [];
  /* the extremes are walked rather than spread: a screened glyph is a few
     hundred dots, and a whole alphabet of them is more arguments than a call
     is allowed to have */
  let maxPts = 0, maxCts = 0;
  let xMin = 0, xMax = 0, yMin = 0, yMax = 0;
  for (const g of glyphs) {
    maxCts = Math.max(maxCts, g.contours.length);
    let np = 0;
    for (const c of g.contours) {
      np += c.length;
      for (const p of c) {
        if (p[0] < xMin) xMin = p[0];
        if (p[0] > xMax) xMax = p[0];
        if (p[1] < yMin) yMin = p[1];
        if (p[1] > yMax) yMax = p[1];
      }
    }
    maxPts = Math.max(maxPts, np);
  }

  const glyfParts = [], loca = [];
  let off = 0;
  for (const g of glyphs) {
    loca.push(off);
    const e = glyfEntry(g.contours);
    glyfParts.push(e); off += e.length;
  }
  loca.push(off);
  const glyf = cat.apply(null, glyfParts);
  const locaT = cat.apply(null, loca.map(u32));
  const maxAdv = Math.max.apply(null, glyphs.map((g) => g.adv));

  /* a fixed stamp, not the clock: two builds of the same drawing are the
     same file, which is the whole habit of this repository */
  const when = cat(u32(0), u32(STAMP));
  const head = cat(u32(0x00010000), u32(0x00010000), u32(0), u32(0x5f0f3cf5),
    u16(0x000b), u16(UPM), when, when,
    i16(xMin), i16(yMin), i16(xMax), i16(yMax),
    u16(bold ? 1 : 0),                            /* macStyle: the bold bit */
    u16(8), i16(2), i16(1), i16(0));
  const hhea = cat(u32(0x00010000), i16(ASC), i16(DESC), i16(0), u16(maxAdv),
    i16(xMin), i16(0), i16(xMax), i16(1), i16(0), i16(0), buf(8), i16(0), u16(glyphs.length));
  const maxp = cat(u32(0x00010000), u16(glyphs.length), u16(maxPts), u16(maxCts),
    u16(0), u16(0), u16(1), u16(0), u16(0), u16(0), u16(0), u16(0), u16(0), u16(0), u16(0));
  const hmtx = cat.apply(null, glyphs.map((g) => cat(u16(g.adv), i16(0))));
  /* OS/2 version 4 is exactly 96 bytes. Between fsType and panose the format
     wants ten sub/superscript-and-strikeout metrics AND sFamilyClass — eleven
     int16. Nine of them was four bytes short, which shifted every field after
     it: fsSelection read back as 0xfffd, asserting italic, underline, outline,
     strikeout and bold at once. macOS renders that file. Nothing else opens it. */
  const os2 = cat(u16(4), i16(Math.round(0.55 * CAP)), u16(wclass), u16(5),
    u16(0),
    i16(650), i16(600), i16(0), i16(75),          /* ySubscript  X/Y size, X/Y offset */
    i16(650), i16(600), i16(0), i16(-350),        /* ySuperscript  the same four */
    i16(Math.round(o.weight * CAP * 0.6)), i16(Math.round(CAP * 0.32)),  /* strikeout */
    i16(0),                                       /* sFamilyClass — no classification */
    Uint8Array.from([2, 11, bold ? 8 : 5, 2, 2, 2, 2, 2, 2, 4]),
    u32(1), u32(0), u32(0), u32(0), tag("MINR"),
    u16(bold ? 0x0020 : 0x0040),                  /* fsSelection: BOLD or REGULAR */
    u16(32), u16(0xfffd),
    i16(ASC), i16(DESC), i16(200), u16(ASC), u16(-DESC), u32(1), u32(0),
    i16(Math.round(0.52 * CAP)), i16(CAP), u16(2), u16(2), u16(2));
  const post = cat(u32(0x00030000), u32(0), i16(0), i16(0), u32(0), u32(0), u32(0), u32(0), u32(0));
  const nameT = nameTable([
    [0, "Generated from the MINOR INDEX drawing. Not drawn in a font editor."],
    [1, o.family], [2, k.style],
    [3, "MinorIndex-" + k.style + "-" + o.version],
    [4, o.family + " " + k.style], [5, "Version " + o.version],
    [6, o.family.replace(/\s+/g, "") + "-" + k.style],
  ].concat(k.extraNames || []));

  const T2 = [["OS/2", os2], ["cmap", cmap4(map)], ["glyf", glyf], ["head", head],
    ["hhea", hhea], ["hmtx", hmtx], ["loca", locaT], ["maxp", maxp], ["name", nameT],
    ["post", post]].concat(extra).sort((a, b) => (a[0] < b[0] ? -1 : 1));

  const n = T2.length;
  let sr = 16;
  while (sr * 2 <= n * 16) sr *= 2;
  let offset = 12 + n * 16;
  const dir = [u32(0x00010000), u16(n), u16(sr), u16(Math.round(Math.log2(sr / 16))), u16(n * 16 - sr)];
  const bodies = [];
  let headOffset = 0;
  for (const entry of T2) {
    const name = entry[0], data = entry[1];
    if (name === "head") headOffset = offset;
    dir.push(cat(tag(name), u32(checksum(data)), u32(offset), u32(data.length)));
    bodies.push(pad4(data));
    offset += pad4(data).length;
  }
  const font = cat(cat.apply(null, dir), cat.apply(null, bodies));
  /* the whole-file checksum goes back into head once the file exists */
  new DataView(font.buffer).setUint32(headOffset + 8, (0xb1b0afba - checksum(font)) >>> 0);
  return { font: font, glyphs: glyphs.length, map: map,
           tables: T2.map((t) => t[0]), metrics: { UPM, CAP, ASC, DESC } };
}


/* ---- one drawing, three dials ------------------------------------------
 *
 * The pen, the width and the slant were always parameters of the plates. Cut
 * three static files out of that and two of the three are thrown away: what
 * the drawing knows is a continuum, and a variable font is the honest export
 * of it.
 *
 * A variable font is the default instance plus, for every glyph, how far each
 * of its points moves when a dial goes to one end. So every instance of a
 * letter has to have the same points in the same order — which is what
 * `joints: "all"` and the shared `flips` above are for — and then the whole
 * thing is arithmetic.
 *
 * The pen is not linear in `wght`: the three weights that were drawn sit at
 * 0.075, 0.12 and 0.19, and 300 → 400 → 700 is not that shape. `gvar` only
 * interpolates straight lines, so the bend goes in `avar`, which is exactly
 * what avar is for — the axis is stretched so that asking for 300 and asking
 * for 700 land on the two weights that were drawn.
 */
const AXES = [
  { tag: "wght", min: 100, def: 400, max: 900, name: "Weight",
    /* the pen at each end of the axis, in fractions of the cap height */
    lo: 0.045, hi: 0.24, of: (v) => ({ weight: v }) },
  { tag: "wdth", min: 75, def: 100, max: 125, name: "Width",
    lo: 0.75, hi: 1.25, of: (v) => ({ width: v }) },
  /* slnt is counter-clockwise degrees from upright, so an italic is negative.
     The drawing's own `slant` leans the other way, hence the sign. */
  { tag: "slnt", min: -15, def: 0, max: 0, name: "Slant",
    lo: 15, hi: 0, of: (v) => ({ slant: v }) },
];
const INSTANCES = [
  { name: "Thin", wght: 100 }, { name: "Light", wght: 300 },
  { name: "Regular", wght: 400 }, { name: "Bold", wght: 700 },
  { name: "Black", wght: 900 },
  { name: "Italic", wght: 400, slnt: -12 },
  { name: "Bold Italic", wght: 700, slnt: -12 },
];
/* the bend: user coordinate → design coordinate, so that a request for the
   three weights that were drawn lands exactly on them */
function avarMap() {
  const w = AXES[0];
  const pen = (nd) => (nd >= 0 ? 0.12 + nd * (w.hi - 0.12) : 0.12 + nd * (0.12 - w.lo));
  const design = (want) => (want >= 0.12 ? (want - 0.12) / (w.hi - 0.12)
                                         : (want - 0.12) / (0.12 - w.lo));
  const user = (v) => (v >= w.def ? (v - w.def) / (w.max - w.def) : (v - w.def) / (w.def - w.min));
  const pts = [[-1, -1]];
  for (const f of FAMILY) {
    const u = user(f.css), d = design(f.weight);
    if (Math.abs(u) > 0.001 && Math.abs(u) < 0.999) pts.push([u, d]);
  }
  pts.push([0, 0]);
  pts.sort((a, b) => a[0] - b[0]);
  pts.push([1, 1]);
  /* no duplicates, and strictly rising, which avar requires */
  const out = [];
  for (const p of pts) if (!out.length || p[0] > out[out.length - 1][0] + 1e-6) out.push(p);
  return { map: out, pen: pen };
}

const F2 = (v) => i16(Math.round(Math.max(-2, Math.min(1.99994, v)) * 16384));
const fixed = (v) => u32(Math.round(v * 65536) >>> 0);

/* deltas, run-length packed the way gvar wants them */
function packDeltas(vals) {
  const out = [];
  let i = 0;
  while (i < vals.length) {
    if (vals[i] === 0) {
      let j = i; while (j < vals.length && vals[j] === 0 && j - i < 64) j++;
      out.push(Uint8Array.from([0x80 | (j - i - 1)]));
      i = j; continue;
    }
    const wide = (v) => v < -128 || v > 127;
    if (wide(vals[i])) {
      let j = i; while (j < vals.length && vals[j] !== 0 && wide(vals[j]) && j - i < 64) j++;
      const parts = [Uint8Array.from([0x40 | (j - i - 1)])];
      for (let k = i; k < j; k++) parts.push(i16(vals[k]));
      out.push(cat(parts)); i = j; continue;
    }
    let j = i;
    while (j < vals.length && vals[j] !== 0 && !wide(vals[j]) && j - i < 64) j++;
    const b = buf(1 + (j - i));
    b[0] = j - i - 1;
    for (let k = i; k < j; k++) b[1 + k - i] = vals[k] & 0xff;
    out.push(b); i = j;
  }
  return cat(out);
}

/** a TrueType variable font: the default instance, and how far it travels */
function buildVF(opt) {
  const o = Object.assign({ family: "Minor Index", hand: 0.015, seed: 7,
                            version: "1.000" }, opt);
  const av = avarMap();
  const base = { weight: 0.12, width: 1, slant: 0, hand: o.hand, seed: o.seed,
                 joints: "all" };
  /* the six ends of the three dials, as instances of the same drawing */
  const corners = [];
  for (let a = 0; a < AXES.length; a++) {
    const ax = AXES[a];
    for (const side of [-1, 1]) {
      const at = side < 0 ? ax.lo : ax.hi;
      const peak = AXES.map(() => 0); peak[a] = side;
      /* the axis that only goes one way has nothing at the other end */
      const same = (side < 0 ? ax.min === ax.def : ax.max === ax.def);
      if (!same) corners.push({ peak: peak, opts: ax.of(at) });
    }
  }

  const extra = ["É", "È", "Ê", "Ë", "À", "Â", "Ç", "Î", "Ï", "Ô", "Û", "Ù"];
  const chars = Object.keys(T.G).concat(extra)
    .filter((c, i, a) => a.indexOf(c) === i && c !== " ");

  const glyphs = [{ contours: [], adv: Math.round(0.32 * CAP), vary: null }];
  const map = {};
  const space = T.glyph(" ");
  glyphs.push({ contours: [], adv: Math.round((space.w + T.TRACK) * CAP), vary: null });
  map[32] = 1;
  for (const ch of chars) {
    const g = outlineGlyph(ch, base);
    if (!g) continue;
    map[ch.codePointAt(0)] = glyphs.length;
    const low = ch.toLowerCase();
    if (low !== ch) map[low.codePointAt(0)] = glyphs.length;
    /* every corner drawn with the default's joints and winding, so the points
       line up one for one and a delta means something */
    const vary = corners.map((c) => {
      const alt = outlineGlyph(ch, Object.assign({}, base, c.opts, { flips: g.flips }));
      return { peak: c.peak, contours: alt.contours, adv: alt.adv };
    });
    glyphs.push(Object.assign({ vary: vary }, g));
  }

  const flat = (contours) => { const p = []; for (const c of contours) for (const q of c) p.push(q); return p; };
  /* the four points a font keeps past the end of a glyph: where it starts,
     where the next one starts, and the two nobody here uses */
  const phantom = (g, adv, xMin) => [[xMin, 0], [xMin + adv, 0], [0, 0], [0, 0]];

  /* ---- gvar --------------------------------------------------------- */
  const gvarGlyphs = glyphs.map((g) => {
    if (!g.vary || !g.contours.length) return buf(0);
    const pts = flat(g.contours);
    const xMin = Math.min.apply(null, pts.map((p) => p[0]));
    const dflt = pts.concat(phantom(g, g.adv, xMin));
    const heads = [], datas = [];
    for (const v of g.vary) {
      const vp = flat(v.contours);
      const vXMin = vp.length ? Math.min.apply(null, vp.map((p) => p[0])) : xMin;
      const alt = vp.concat(phantom(v, v.adv, vXMin));
      const dx = [], dy = [];
      for (let i = 0; i < dflt.length; i++) {
        dx.push((alt[i] ? alt[i][0] : 0) - dflt[i][0]);
        dy.push((alt[i] ? alt[i][1] : 0) - dflt[i][1]);
      }
      const data = cat(packDeltas(dx), packDeltas(dy));
      heads.push(cat(u16(data.length), u16(0x8000), cat(v.peak.map(F2))));
      datas.push(data);
    }
    /* one set of point numbers for the whole glyph, and it is "all of them" */
    const shared = Uint8Array.from([0]);
    const headLen = 4 + heads.reduce((t, h) => t + h.length, 0);
    return pad2(cat(u16(0x8000 | heads.length), u16(headLen),
                    cat(heads), shared, cat(datas)));
  });
  const gvarOffsets = [];
  let at = 0;
  for (const g of gvarGlyphs) { gvarOffsets.push(at); at += g.length; }
  gvarOffsets.push(at);
  const gvar = cat(u16(1), u16(0), u16(AXES.length), u16(0),
    u32(20 + (glyphs.length + 1) * 4),          /* shared tuples: none, past the offsets */
    u16(glyphs.length), u16(1),                 /* long offsets */
    u32(20 + (glyphs.length + 1) * 4),
    cat(gvarOffsets.map(u32)), cat(gvarGlyphs));

  /* ---- fvar, avar, STAT ---------------------------------------------- */
  let nameId = 256;
  const names = [];
  const axisNameIds = AXES.map((a) => { names.push([nameId, a.name]); return nameId++; });
  const instNameIds = INSTANCES.map((i) => { names.push([nameId, i.name]); return nameId++; });

  const fvar = cat(u16(1), u16(0), u16(16), u16(2), u16(AXES.length), u16(20),
    u16(INSTANCES.length), u16(4 + AXES.length * 4),
    cat(AXES.map((a, i) => cat(tag(a.tag), fixed(a.min), fixed(a.def), fixed(a.max),
      u16(0), u16(axisNameIds[i])))),
    cat(INSTANCES.map((inst, i) => cat(u16(instNameIds[i]), u16(0),
      cat(AXES.map((a) => fixed(inst[a.tag] === undefined ? a.def : inst[a.tag])))))));

  const avar = cat(u16(1), u16(0), u16(0), u16(AXES.length),
    cat(AXES.map((a) => (a.tag === "wght"
      ? cat(u16(av.map.length), cat(av.map.map((p) => cat(F2(p[0]), F2(p[1])))))
      : cat(u16(3), F2(-1), F2(-1), F2(0), F2(0), F2(1), F2(1))))));

  /* STAT: what a font menu writes on the tin */
  const stat = (() => {
    const vals = [];
    for (const f of FAMILY) vals.push({ axis: 0, name: f.style, value: f.css,
                                        flags: f.style === "Regular" ? 2 : 0 });
    vals.push({ axis: 1, name: "Normal", value: 100, flags: 2 });
    vals.push({ axis: 2, name: "Roman", value: 0, flags: 2 });
    const ids = vals.map((v) => { names.push([nameId, v.name]); return nameId++; });
    const axesT = cat(AXES.map((a, i) => cat(tag(a.tag), u16(axisNameIds[i]), u16(i))));
    const bodies = vals.map((v, i) => cat(u16(1), u16(v.axis), u16(v.flags), u16(ids[i]),
      fixed(v.value)));
    const offBase = 2 * vals.length;
    const offs = [];
    let p = offBase;
    for (const b of bodies) { offs.push(p); p += b.length; }
    return cat(u16(1), u16(1), u16(8), u16(AXES.length), u32(20),
      u16(vals.length), u32(20 + axesT.length), u16(2),
      axesT, cat(offs.map(u16)), cat(bodies));
  })();

  return tables(o, glyphs, map, {
    extraNames: names,
    extra: [["fvar", fvar], ["gvar", gvar], ["avar", avar], ["STAT", stat]],
    style: "Regular", usWeightClass: 400, weight: 0.12,
  });
}
const pad2 = (b) => (b.length % 2 ? cat(b, buf(1)) : b);

module.exports = { buildTTF, buildVF, outlineGlyph, glyphField, pressGlyph, traceField,
  FAMILY, PRESSES, press, AXES, INSTANCES, weightClass,
  UPM, CAP, ASC, DESC, STAMP, PLATE_CAP };
