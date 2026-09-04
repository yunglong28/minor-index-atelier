/* MINOR INDEX — lettering, drawn.
 *
 * The 5×7 field in _type.js is a machine reading a machine: right for a
 * datasheet, wrong for anything the film has to say out loud. These letters
 * are drawn instead — a skeleton of lines and arcs, laid down with a wobble,
 * round-capped, the way a hand pulls a marker. Still no font: the shapes are
 * in this file, in coordinates, and nothing is asked of the machine that
 * opens the SVG.
 *
 * Glyph box: x 0..w, y 0 (cap) .. 1 (baseline). Accents live above 0.
 * Segments: ["l", x1,y1,x2,y2] | ["a", cx,cy,rx,ry, a0,a1] (deg, y-down,
 * increasing = clockwise on screen).
 */
const { INK, n, rng, segDist } = require("./_mark.js");
const l = (a, b, c, d) => ["l", a, b, c, d];
const a = (cx, cy, rx, ry, a0, a1) => ["a", cx, cy, rx, ry, a0, a1];

const G = {
  A: [0.70, [l(0, 1, 0.35, 0), l(0.35, 0, 0.70, 1), l(0.12, 0.68, 0.58, 0.68)]],
  B: [0.64, [l(0, 0, 0, 1), l(0, 0, 0.34, 0), l(0, 0.5, 0.36, 0.5), l(0, 1, 0.34, 1),
             a(0.34, 0.25, 0.25, 0.25, -90, 90), a(0.34, 0.75, 0.25, 0.25, -90, 90)]],
  C: [0.68, [a(0.34, 0.5, 0.34, 0.5, 52, 308)]],
  D: [0.68, [l(0, 0, 0, 1), l(0, 0, 0.2, 0), l(0, 1, 0.2, 1), a(0.2, 0.5, 0.48, 0.5, -90, 90)]],
  E: [0.60, [l(0, 0, 0, 1), l(0, 0, 0.58, 0), l(0, 0.5, 0.48, 0.5), l(0, 1, 0.58, 1)]],
  F: [0.58, [l(0, 0, 0, 1), l(0, 0, 0.56, 0), l(0, 0.5, 0.46, 0.5)]],
  G: [0.70, [a(0.35, 0.5, 0.35, 0.5, 0, 300), l(0.42, 0.5, 0.70, 0.5)]],
  H: [0.68, [l(0, 0, 0, 1), l(0.68, 0, 0.68, 1), l(0, 0.52, 0.68, 0.52)]],
  I: [0.12, [l(0.06, 0, 0.06, 1)]],
  J: [0.52, [l(0.52, 0, 0.52, 0.74), a(0.27, 0.74, 0.25, 0.25, 0, 180)]],
  K: [0.64, [l(0, 0, 0, 1), l(0.62, 0, 0.06, 0.56), l(0.26, 0.40, 0.64, 1)]],
  L: [0.56, [l(0, 0, 0, 1), l(0, 1, 0.54, 1)]],
  M: [0.82, [l(0, 1, 0, 0), l(0, 0, 0.41, 0.66), l(0.41, 0.66, 0.82, 0), l(0.82, 0, 0.82, 1)]],
  N: [0.70, [l(0, 1, 0, 0), l(0, 0, 0.70, 1), l(0.70, 1, 0.70, 0)]],
  O: [0.72, [a(0.36, 0.5, 0.36, 0.5, 0, 360)]],
  P: [0.62, [l(0, 0, 0, 1), l(0, 0, 0.3, 0), l(0, 0.54, 0.3, 0.54), a(0.3, 0.27, 0.27, 0.27, -90, 90)]],
  Q: [0.72, [a(0.36, 0.5, 0.36, 0.5, 0, 360), l(0.46, 0.68, 0.74, 1.02)]],
  R: [0.64, [l(0, 0, 0, 1), l(0, 0, 0.3, 0), l(0, 0.54, 0.3, 0.54),
             a(0.3, 0.27, 0.27, 0.27, -90, 90), l(0.3, 0.54, 0.64, 1)]],
  S: [0.62, [a(0.31, 0.28, 0.28, 0.28, -35, -225), a(0.31, 0.72, 0.28, 0.28, -135, 145)]],
  T: [0.64, [l(0, 0, 0.64, 0), l(0.32, 0, 0.32, 1)]],
  U: [0.68, [l(0, 0, 0, 0.66), l(0.68, 0, 0.68, 0.66), a(0.34, 0.66, 0.34, 0.34, 0, 180)]],
  V: [0.70, [l(0, 0, 0.35, 1), l(0.35, 1, 0.70, 0)]],
  W: [0.96, [l(0, 0, 0.19, 1), l(0.19, 1, 0.48, 0.26), l(0.48, 0.26, 0.77, 1), l(0.77, 1, 0.96, 0)]],
  X: [0.66, [l(0, 0, 0.66, 1), l(0.66, 0, 0, 1)]],
  Y: [0.66, [l(0, 0, 0.33, 0.52), l(0.66, 0, 0.33, 0.52), l(0.33, 0.52, 0.33, 1)]],
  Z: [0.62, [l(0, 0, 0.62, 0), l(0.62, 0, 0, 1), l(0, 1, 0.62, 1)]],
  0: [0.58, [a(0.29, 0.5, 0.29, 0.5, 0, 360)]],
  1: [0.34, [l(0.04, 0.18, 0.24, 0), l(0.24, 0, 0.24, 1)]],
  2: [0.62, [a(0.31, 0.34, 0.31, 0.34, 180, 380), l(0.60, 0.46, 0.02, 1), l(0, 1, 0.62, 1)]],
  3: [0.60, [a(0.28, 0.30, 0.28, 0.30, 200, 420), a(0.28, 0.72, 0.30, 0.28, -60, 160)]],
  4: [0.66, [l(0.48, 0, 0.04, 0.70), l(0.04, 0.70, 0.66, 0.70), l(0.48, 0, 0.48, 1)]],
  5: [0.62, [l(0.09, 0.03, 0.60, 0.03), l(0.10, 0.03, 0.09, 0.454),
             a(0.32, 0.66, 0.30, 0.32, 220, 520)]],
  6: [0.64, [a(0.32, 0.68, 0.32, 0.32, 0, 360), l(0.58, 0.05, 0.02, 0.571)]],
  7: [0.62, [l(0, 0, 0.62, 0), l(0.62, 0, 0.22, 1)]],
  8: [0.60, [a(0.30, 0.28, 0.28, 0.28, 0, 360), a(0.30, 0.73, 0.30, 0.27, 0, 360)]],
  9: [0.62, [a(0.30, 0.32, 0.30, 0.32, 0, 360), l(0.58, 0.36, 0.24, 1)]],
  " ": [0.46, []],
  ".": [0.20, [l(0.10, 0.98, 0.10, 1)]],
  ",": [0.20, [l(0.10, 0.94, 0.03, 1.14)]],
  ":": [0.20, [l(0.10, 0.42, 0.10, 0.44), l(0.10, 0.98, 0.10, 1)]],
  "-": [0.44, [l(0.04, 0.54, 0.40, 0.54)]],
  "·": [0.26, [l(0.13, 0.50, 0.13, 0.52)]],
  "'": [0.18, [l(0.09, 0, 0.04, 0.22)]],
  "/": [0.52, [l(0, 1, 0.52, 0)]],
  "!": [0.20, [l(0.10, 0, 0.10, 0.68), l(0.10, 0.98, 0.10, 1)]],
  "(": [0.30, [a(0.34, 0.5, 0.32, 0.56, 132, 228)]],
  ")": [0.30, [a(-0.04, 0.5, 0.32, 0.56, -48, 48)]],
  "°": [0.34, [a(0.17, 0.16, 0.15, 0.15, 0, 360)]],
  "?": [0.58, [a(0.28, 0.27, 0.26, 0.27, 160, 375), l(0.531, 0.34, 0.29, 0.66),
               l(0.29, 0.66, 0.29, 0.74), l(0.29, 0.98, 0.29, 1)]],
  "&": [0.82, [a(0.30, 0.25, 0.22, 0.25, 120, 430), l(0.19, 0.467, 0.045, 0.671),
               a(0.34, 0.72, 0.30, 0.28, 190, -20), l(0.375, 0.485, 0.80, 1)]],
  "Œ": [1.14, [a(0.36, 0.5, 0.36, 0.5, 45, 315), l(0.62, 0.04, 0.62, 0.96),
               l(0.58, 0.03, 1.12, 0.03), l(0.62, 0.5, 1.02, 0.5), l(0.58, 0.97, 1.12, 0.97)]],
};
/* ---- the letters cut small ----------------------------------------------
 *
 * There is no lowercase drawing and there is not going to be one: the film
 * speaks in capitals. So a lowercase letter is the capital cut small — cut,
 * not photographed. A capital reduced on a copier arrives thin and narrow
 * beside the one it was reduced from; a small cap is redrawn to keep the stem
 * and to open the width, so the two sit on a line together and neither looks
 * further away than the other.
 *
 * Three numbers, and they are the whole design:
 *   h    how tall, against the cap. The letter is hung from the baseline.
 *   w    how much wider than the reduction, to give back what height took.
 *   pen  the stem it keeps, against the cap's. Not 1: the counters close as
 *        the letter comes down, so a small cap on the capital's stem prints
 *        darker than the capital beside it. Set by eye against an A.
 *   side an allowance on the advance, on top of the tracking everything gets.
 *        The stem barely came down and the letter did, so at the tracking the
 *        capitals are set on the ink very nearly touches: small caps are
 *        letterspaced, and this is that, in cap units like everything else.
 */
const SC = { h: 0.72, w: 1.07, pen: 0.86, side: 0.04 };
const scPen = SC.pen / SC.h;      /* the pen is a fraction of cap: undo the reduction */
const scSeg = (sg) => {
  const kx = SC.h * SC.w, ky = SC.h, dy = 1 - SC.h;   /* y is 0 at the cap, 1 at the base */
  return sg[0] === "l"
    ? l(sg[1] * kx, dy + sg[2] * ky, sg[3] * kx, dy + sg[4] * ky)
    /* an axis-aligned ellipse scaled on its axes is still swept by the same
       angles, so the arcs come through untouched apart from their radii */
    : a(sg[1] * kx, dy + sg[2] * ky, sg[3] * kx, sg[4] * ky, sg[5], sg[6]);
};

/* the accents french needs, hung off the base letter */
const ACC = {
  "É": ["E", "acute"], "È": ["E", "grave"], "Ê": ["E", "circ"], "Ë": ["E", "trema"],
  "À": ["A", "grave"], "Â": ["A", "circ"], "Ç": ["C", "ced"], "Î": ["I", "circ"],
  "Ï": ["I", "trema"], "Ô": ["O", "circ"], "Û": ["U", "circ"], "Ù": ["U", "grave"],
};
const accent = (kind, w) => {
  const c = w / 2;
  if (kind === "acute") return [l(c - 0.13, -0.15, c + 0.13, -0.32)];
  if (kind === "grave") return [l(c - 0.13, -0.32, c + 0.13, -0.15)];
  if (kind === "circ") return [l(c - 0.15, -0.16, c, -0.34), l(c, -0.34, c + 0.15, -0.16)];
  if (kind === "trema") return [l(c - 0.12, -0.26, c - 0.12, -0.24), l(c + 0.12, -0.26, c + 0.12, -0.24)];
  if (kind === "ced") return [a(c, 1.10, 0.10, 0.10, 20, 210)];
  return [];
};

const capGlyph = (up) => {
  if (G[up]) return { w: G[up][0], segs: G[up][1], pen: 1, side: 0 };
  if (ACC[up]) {
    const b = G[ACC[up][0]];
    return { w: b[0], segs: b[1].concat(accent(ACC[up][1], b[0])), pen: 1, side: 0 };
  }
  return null;
};
/* cut once and kept: a page sets the same letter a few thousand times */
const SMALL = {};
const smallGlyph = (up) => {
  if (SMALL[up] !== undefined) return SMALL[up];
  const c = capGlyph(up);
  SMALL[up] = c && { w: c.w * SC.h * SC.w, segs: c.segs.map(scSeg), pen: scPen,
                     side: SC.side, sc: true };
  return SMALL[up];
};

const glyph = (ch) => {
  const up = ch.toUpperCase();
  if (up !== ch) return smallGlyph(up);      /* lowercase is the letter cut small */
  return capGlyph(up);
};

const TRACK = 0.10;   /* tightened: words have to read as words */
const advance = (ch, track) => {
  const g = glyph(ch);
  return (g ? g.w + (g.side || 0) : 0.46) + (track === undefined ? TRACK : track);
};
/** width of a drawn string at a given cap height */
const textW = (s, cap, track) => {
  const S = [...s];
  let w = 0;
  for (const ch of S) w += advance(ch, track) * cap;
  return w - (track === undefined ? TRACK : track) * cap;
};
/** the cap height that makes a string exactly this wide */
const fitCap = (s, maxW, track) => maxW / (textW(s, 1, track) || 1);
const centerX = (s, cap, W, track) => (W - textW(s, cap, track)) / 2;
const rightX = (s, cap, x, track) => x - textW(s, cap, track);

/* One segment, walked out into the points that stand for it — a line at four
 * samples per unit, an arc at eleven degrees a step. Both ways of reading a
 * glyph go through here, so a letter that is drawn and a letter that is
 * printed are sampled at the same places and can only differ by what the
 * hand does to them afterwards.
 */
function walkSeg(sg, at) {
  if (sg[0] === "l") {
    const N = Math.max(2, Math.round(Math.hypot(sg[3] - sg[1], sg[4] - sg[2]) * 4) + 1);
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      at(sg[1] + (sg[3] - sg[1]) * t, sg[2] + (sg[4] - sg[2]) * t);
    }
  } else {
    const [, cx, cy, rx, ry, a0, a1] = sg;
    const N = Math.max(5, Math.ceil(Math.abs(a1 - a0) / 11));
    for (let i = 0; i <= N; i++) {
      const ang = ((a0 + (a1 - a0) * (i / N)) * Math.PI) / 180;
      at(cx + Math.cos(ang) * rx, cy + Math.sin(ang) * ry);
    }
  }
}

/* one segment → a wobbling polyline, because a ruled line is a machine's */
function seg2path(sg, x, y, cap, hand, rnd) {
  const P = [];
  walkSeg(sg, (ux, uy) => P.push([x + ux * cap + (rnd() - 0.5) * hand * cap,
                                  y + uy * cap + (rnd() - 0.5) * hand * cap]));
  return P.map((p, i) => `${i ? "L" : "M"} ${n(p[0])} ${n(p[1])}`).join(" ");
}

/* A stroke-width belongs to a group, not to a path, and a line with small
 * caps in it has two of them. So the marks are gathered by the pen that made
 * them: one pen, one group — which is what a line of capitals was before
 * there were small caps, byte for byte. */
function Pens() { this.order = []; this.byPen = new Map(); }
Pens.prototype.at = function (pen) {
  if (!this.byPen.has(pen)) { this.byPen.set(pen, []); this.order.push(pen); }
  return this.byPen.get(pen);
};
Pens.prototype.wrap = function (color, fallback) {
  const one = (pen, body) => `<g fill="none" stroke="${color}" stroke-width="${n(pen)}" `
    + `stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
  if (!this.order.length) return one(fallback, "");     /* nothing set: still a group */
  return this.order.map((pen) => one(pen, this.byPen.get(pen).join(""))).join("");
};

/**
 * Drawn lettering. y is the cap line; the baseline lands at y + cap.
 *   weight  stroke as a fraction of cap (0.1 ≈ a marker, 0.2 ≈ a brush)
 *   hand    wobble, in fractions of cap
 */
function strokeText(s, x, y, cap, opts) {
  const o = Object.assign({ color: INK.black, weight: 0.11, hand: 0.02, track: TRACK, seed: 7 }, opts);
  const rnd = rng(o.seed);
  const pens = new Pens();
  let cx = x;
  for (const ch of [...s]) {
    const g = glyph(ch);
    if (g) for (const sg of g.segs) {
      pens.at(cap * o.weight * g.pen).push(`<path d="${seg2path(sg, cx, y, cap, o.hand, rnd)}"/>`);
    }
    cx += advance(ch, o.track) * cap;
  }
  return pens.wrap(o.color, cap * o.weight);
}

/** The same letters bent round a ring. `radius` is always the cap line:
 *  on the top arc the letters hang inward from it, on a flipped (bottom)
 *  arc they hang outward, tops toward the centre, the way a seal is cut. */
function arcStrokeText(s, cx, cy, radius, midDeg, cap, opts) {
  const o = Object.assign({ color: INK.black, weight: 0.11, hand: 0.02, track: TRACK,
                            seed: 7, flip: false }, opts);
  const rnd = rng(o.seed);
  const S = [...s];
  const deg = (u) => ((u * cap) / (radius - cap / 2)) * (180 / Math.PI);
  const total = S.reduce((t, ch) => t + advance(ch, o.track), 0) - o.track;
  const sgn = o.flip ? -1 : 1;
  let cur = -total / 2;
  const pens = new Pens();
  for (const ch of S) {
    const g = glyph(ch);
    const w = g ? g.w : 0.46;
    if (g) {
      const at = midDeg + sgn * deg(cur + w / 2);
      const paths = g.segs.map((sg) =>
        `<path d="${seg2path(sg, 0, 0, cap, o.hand, rnd)}"/>`).join("");
      const T = o.flip
        ? `translate(0 ${n(-radius)}) rotate(180) translate(${n(-w / 2 * cap)} 0)`
        : `translate(${n(-w / 2 * cap)} ${n(-radius)})`;
      pens.at(cap * o.weight * g.pen)
        .push(`<g transform="translate(${n(cx)} ${n(cy)}) rotate(${n(at)}) ${T}">${paths}</g>`);
    }
    cur += advance(ch, o.track);
  }
  return pens.wrap(o.color, cap * o.weight);
}

/* ---- letters as material, not as type ----------------------------------
 *
 * The plates are distance fields, so the lettering is one too. Every glyph is
 * walked out into wobbling polylines ONCE and then read two ways: stroked, for
 * a plate that is cut; and as capsules, for a plate that is printed. The two
 * are the same letters — the same hand, the same wobble — so a word can be
 * over-inked until it closes up, choked, twisted or bitten exactly the way a
 * body can, and its cut version still lines up with it.
 *
 * `slant` shears, `width` stretches, `weight` is the pen, `hand` is the shake.
 */
function textPaths(str, x, y, cap, opts) {
  const o = Object.assign({ weight: 0.11, hand: 0.02, track: TRACK, seed: 7,
                            slant: 0, width: 1 }, opts);
  const rnd = rng((o.seed | 0) || 7);
  const sh = Math.tan((o.slant * Math.PI) / 180);
  const out = [];
  let cx = x;
  for (const ch of [...str]) {
    const g = glyph(ch);
    if (g) {
      const runs = [];
      for (const sg of g.segs) {
        const P = [];
        const push = (ux, uy) => {
          const wob = (rnd() - 0.5) * o.hand * cap;
          const px = cx + ux * cap * o.width + (rnd() - 0.5) * o.hand * cap;
          const py = y + uy * cap + wob;
          P.push([px - (py - y - cap) * sh, py]);      /* shear about the baseline */
        };
        walkSeg(sg, push);
        runs.push(P);
      }
      out.push({ ch, runs, x: cx, w: g.w * cap * o.width, pen: o.weight * cap * g.pen });
    }
    cx += advance(ch, o.track) * cap * o.width;
  }
  return { glyphs: out, width: cx - x, cap, weight: o.weight * cap };
}

/** the same letters, cut: one stroked path per run */
function pathsSolid(tp, color) {
  const pens = new Pens();
  for (const g of tp.glyphs) {
    pens.at(g.pen === undefined ? tp.weight : g.pen).push(g.runs.map((P) =>
      P.map((pt, i) => `${i ? "L" : "M"} ${n(pt[0])} ${n(pt[1])}`).join(" ")).join(" "));
  }
  const one = (pen, d) => `<g fill="none" stroke="${color}" stroke-width="${n(pen)}" `
    + `stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></g>`;
  if (!pens.order.length) return one(tp.weight, "");
  return pens.order.map((pen) => one(pen, pens.byPen.get(pen).join(" "))).join("");
}

/** the same letters, as distance: capsules, one bounding circle per glyph */
function pathsField(tp, grow) {
  const items = tp.glyphs.map((g) => {
    const pen = g.pen === undefined ? tp.weight : g.pen;
    const segs = [];
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const P of g.runs) {
      for (let i = 0; i < P.length; i++) {
        const [px, py] = P[i];
        if (px < x0) x0 = px; if (px > x1) x1 = px;
        if (py < y0) y0 = py; if (py > y1) y1 = py;
        if (i) segs.push({ x1: P[i - 1][0], y1: P[i - 1][1], x2: px, y2: py, w: pen });
      }
    }
    return { segs, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2,
             r: Math.hypot(x1 - x0, y1 - y0) / 2 + pen };
  });
  const G2 = (grow || 0);
  return (x, y) => {
    let d = 1e9;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (Math.hypot(x - it.cx, y - it.cy) - it.r >= d) continue;   /* not this letter */
      for (let k = 0; k < it.segs.length; k++) {
        const v = segDist(x, y, it.segs[k]) - G2;
        if (v < d) d = v;
      }
    }
    return d;
  };
}

/* one call for each way of using it */
const textSolid = (str, x, y, cap, o) =>
  pathsSolid(textPaths(str, x, y, cap, o), (o && o.color) || INK.black);
const textField = (str, x, y, cap, o) =>
  pathsField(textPaths(str, x, y, cap, o), o && o.grow);
/** where a line of type actually sits: x, y, width, height at this cap */
const textBox = (str, x, y, cap, o) => {
  const tp = textPaths(str, x, y, cap, o);
  return { x, y, w: tp.width, h: cap * (1 + (o && o.slant ? 0.1 : 0)), cap };
};

module.exports = { strokeText, arcStrokeText, textW, fitCap, centerX, rightX, glyph, G, SC,
  walkSeg,
  textPaths, pathsSolid, pathsField, textSolid, textField, textBox, advance, TRACK };
