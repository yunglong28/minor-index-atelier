/* MINOR INDEX — the marks, as bodies.
 *
 * Frank drew four marks and none of them leads: the scrawl, the stroke the
 * name is set around, and the figure, filled and in outline. Here each one
 * is what every other body in this repository is — a distance field — so it
 * goes through the same press, takes the same appetite, and can be cut flat.
 *
 * The fields are read off Frank's drawings by make/mkmarks.js and kept in
 * _marks.data.js. A mark is placed the way a body is: a square box at
 * (x, y), `size` on a side, the drawing centred in it at its own proportion.
 *
 * Two of the things Frank drew are not stored, because they are things a
 * press does: the outline (plate 4 of his) and the inline (plate 3). They
 * are `cut`s, and any mark can take either.
 */
const { n } = require("./_mark.js");
const D = require("./_marks.data.js");

const NAMES = Object.keys(D.MARKS);
/* where the name sits around the stroke, as Frank set it: boxes in the
   stroke's own frame, the long side of the stroke being 1 */
const WORDS = D.MARKS.stroke.words;

/* a stored part, decoded once, read bilinearly in grid cells */
const CACHE = {};
function part(name, which) {
  const key = name + "/" + which;
  if (CACHE[key]) return CACHE[key];
  const g = D.MARKS[name].parts[which];
  const raw = typeof Buffer !== "undefined" ? Buffer.from(g.b64, "base64")
    : Uint8Array.from(atob(g.b64), (c) => c.charCodeAt(0));
  const q = new Int8Array(raw.buffer, raw.byteOffset, raw.length);
  const v = new Float32Array(q.length);
  for (let i = 0; i < q.length; i++) v[i] = Math.sign(q[i]) * (q[i] / D.K) * (q[i] / D.K);
  return (CACHE[key] = { w: g.gw, h: g.gh, v });
}
/** the field of one part, in cells, where (0, 0) is the corner of the frame */
function sample(p, u, v) {
  const x = u + D.PAD - 0.5, y = v + D.PAD - 0.5;
  const cx = Math.max(0, Math.min(p.w - 1.001, x)), cy = Math.max(0, Math.min(p.h - 1.001, y));
  const i = Math.floor(cx), j = Math.floor(cy), fx = cx - i, fy = cy - j, a = j * p.w + i;
  const d = (p.v[a] * (1 - fx) + p.v[a + 1] * fx) * (1 - fy)
          + (p.v[a + p.w] * (1 - fx) + p.v[a + p.w + 1] * fx) * fy;
  /* past the stored grid the paper goes on, and so does the distance */
  return d + Math.hypot(x - cx, y - cy);
}

/** a mark's proportions: width and height of its drawing, the long side 1 */
function markFrame(name) {
  const a = name === "lockup" ? LOCKUP.w / LOCKUP.h : D.MARKS[name].aspect;
  return a >= 1 ? { w: 1, h: 1 / a } : { w: a, h: 1 };
}
/** where a mark of this size lands inside its box */
function markBox(name, x, y, size) {
  const f = markFrame(name);
  const w = f.w * size, h = f.h * size;
  return { x: x + (size - w) / 2, y: y + (size - h) / 2, w, h };
}

/* the two cuts Frank drew, as things done to a field. `line` is the pen. */
const CUTS = {
  solid: (f) => f,
  /* only the rim: the band just inside the edge */
  contour: (f, line) => (x, y) => Math.abs(f(x, y) + line / 2) - line / 2,
  /* the body kept, with a white line drawn round inside it a pen in */
  inline: (f, line) => (x, y) => {
    const d = f(x, y);
    return Math.max(d, -(Math.abs(d + line * 1.45) - line * 0.45));
  },
};

/**
 * A mark as distance, in sheet pixels.
 *   cut   "solid" | "contour" | "inline" — applied to the core; the figure's
 *         two attendants are always solid, as Frank drew them
 *   line  the pen of the cut, in px
 */
function markSDF(name, x, y, size, o) {
  const opt = Object.assign({ cut: "solid", line: 10 }, o);
  const b = markBox(name, x, y, size);
  const k = size / D.GRID;                       /* px per cell */
  const parts = Object.keys(D.MARKS[name].parts).map((w) => part(name, w));
  const one = (p) => (px, py) => sample(p, (px - b.x) / k, (py - b.y) / k) * k;
  const core = (CUTS[opt.cut] || CUTS.solid)(one(parts[0]), opt.line);
  if (parts.length === 1) return core;
  const rest = parts.slice(1).map(one);
  return (px, py) => {
    let d = core(px, py);
    for (const f of rest) { const e = f(px, py); if (e < d) d = e; }
    return d;
  };
}
/** a circle that certainly holds the mark */
function markBound(name, x, y, size) {
  const b = markBox(name, x, y, size);
  return { cx: b.x + b.w / 2, cy: b.y + b.h / 2, r: Math.hypot(b.w, b.h) / 2 };
}

/* ---- the field, cut flat ----------------------------------------------- *
 * A flat pass needs an outline, and a field has one: where it is zero.
 * Marching squares over the box, the crossings found by interpolation, the
 * pieces joined into closed loops, filled even-odd so the holes stay holes.
 */
function fieldPath(f, x0, y0, w, h, step) {
  const nx = Math.ceil(w / step) + 2, ny = Math.ceil(h / step) + 2;
  const ox = x0 - step, oy = y0 - step;
  const V = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) V[j * nx + i] = f(ox + i * step, oy + j * step);
  /* the border of the grid is paper, whatever the field says, so every loop closes */
  for (let i = 0; i < nx; i++) { V[i] = Math.max(V[i], 1e-3); V[(ny - 1) * nx + i] = Math.max(V[(ny - 1) * nx + i], 1e-3); }
  for (let j = 0; j < ny; j++) { V[j * nx] = Math.max(V[j * nx], 1e-3); V[j * nx + nx - 1] = Math.max(V[j * nx + nx - 1], 1e-3); }
  const at = (i, j) => V[j * nx + i];
  const pt = {};
  /* a crossing on an edge: horizontal edges are "h i j", vertical "v i j" */
  const cross = (key, i, j, hor) => {
    if (pt[key]) return key;
    const a = at(i, j), b = hor ? at(i + 1, j) : at(i, j + 1), t = a / (a - b);
    pt[key] = hor ? [ox + (i + t) * step, oy + j * step] : [ox + i * step, oy + (j + t) * step];
    return key;
  };
  const link = {};
  const join = (a, b) => { (link[a] = link[a] || []).push(b); (link[b] = link[b] || []).push(a); };
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = at(i, j) < 0, b = at(i + 1, j) < 0, c = at(i + 1, j + 1) < 0, d = at(i, j + 1) < 0;
      const code = (a ? 8 : 0) | (b ? 4 : 0) | (c ? 2 : 0) | (d ? 1 : 0);
      if (code === 0 || code === 15) continue;
      const T = () => cross(`h${i},${j}`, i, j, true), B = () => cross(`h${i},${j + 1}`, i, j + 1, true);
      const L = () => cross(`v${i},${j}`, i, j, false), R = () => cross(`v${i + 1},${j}`, i + 1, j, false);
      const mid = (at(i, j) + at(i + 1, j) + at(i + 1, j + 1) + at(i, j + 1)) < 0;
      switch (code) {
        case 1: case 14: join(L(), B()); break;
        case 2: case 13: join(B(), R()); break;
        case 3: case 12: join(L(), R()); break;
        case 4: case 11: join(T(), R()); break;
        case 6: case 9: join(T(), B()); break;
        case 7: case 8: join(L(), T()); break;
        case 5: if (mid) { join(L(), T()); join(B(), R()); } else { join(L(), B()); join(T(), R()); } break;
        case 10: if (mid) { join(L(), B()); join(T(), R()); } else { join(L(), T()); join(B(), R()); } break;
      }
    }
  }
  const seen = new Set(), loops = [];
  for (const start in link) {
    if (seen.has(start)) continue;
    const loop = [start];
    seen.add(start);
    let prev = null, cur = start;
    while (true) {
      const nxt = link[cur].find((k) => k !== prev && !seen.has(k));
      if (!nxt) break;
      loop.push(nxt); seen.add(nxt); prev = cur; cur = nxt;
    }
    if (loop.length > 2) loops.push(loop);
  }
  return loops.map((lp) => "M" + lp.map((k) => n(pt[k][0]) + " " + n(pt[k][1])).join("L") + "Z").join("");
}

/** a mark cut flat: the same outline the field has, one path */
function markSolid(name, x, y, size, color, o) {
  const b = markBox(name, x, y, size), pad = size * 0.02;
  const d = fieldPath(markSDF(name, x, y, size, o), b.x - pad, b.y - pad,
    b.w + pad * 2, b.h + pad * 2, Math.max(1, size / 260));
  return `<path fill="${color}" fill-rule="evenodd" d="${d}"/>`;
}

/**
 * The name, set around the stroke where Frank set it. Geometry only — the
 * letters are drawn by whoever asks — so the lockup can be cut, screened or
 * fused into the stroke's field like any other word.
 *   → [{ text, x, y, cap, right }] : `right` means x is where the word ends
 */
function lockupWords(x, y, size) {
  const b = markBox("lockup", x, y, size);
  const s = b.w / LOCKUP.w;                       /* px per unit of the stroke */
  const ox = b.x - LOCKUP.x0 * s, oy = b.y - LOCKUP.y0 * s;
  return ["MINOR", "INDEX"].map((t) => {
    const w = WORDS[t];
    return { text: t, cap: w.h * s, y: oy + w.y * s,
             x: t === "MINOR" ? ox + (w.x + w.w) * s : ox + w.x * s + w.h * s * 0.2,
             right: t === "MINOR" };
  });
}
/* the lockup's frame: the stroke and both words, in stroke units */
const LOCKUP = (() => {
  const sf = markFrame("stroke");
  const xs = [0, sf.w, WORDS.MINOR.x, WORDS.MINOR.x + WORDS.MINOR.w, WORDS.INDEX.x, WORDS.INDEX.x + WORDS.INDEX.w];
  const ys = [0, sf.h, WORDS.MINOR.y, WORDS.MINOR.y + WORDS.MINOR.h, WORDS.INDEX.y, WORDS.INDEX.y + WORDS.INDEX.h];
  const x0 = Math.min(...xs), y0 = Math.min(...ys);
  return { x0, y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0 };
})();
/* the stroke inside a lockup's box is smaller than the box: where it goes, as
   the square box markSDF("stroke", …) wants */
function lockupStroke(x, y, size) {
  const b = markBox("lockup", x, y, size), s = b.w / LOCKUP.w;
  const sx = b.x - LOCKUP.x0 * s, sy = b.y - LOCKUP.y0 * s;
  const sf = markFrame("stroke"), long = s;            /* the stroke's long side is 1 unit */
  /* a square box whose drawing lands exactly at (sx, sy) */
  return { x: sx - (long - sf.w * long) / 2, y: sy - (long - sf.h * long) / 2, size: long };
}

module.exports = { NAMES: NAMES.concat("lockup"), LOCKUP, markSDF, markSolid, markBound, markBox,
  markFrame, fieldPath, lockupWords, lockupStroke, CUTS };
