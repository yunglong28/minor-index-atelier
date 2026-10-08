/* MINOR INDEX — the marks Frank drew, made into bodies.
 *
 * Four drawings came in as pictures: the scrawl, the stroke with the name set
 * either side of it, and the figure, filled and in outline. A picture can
 * only be screened. A body can be grown, bitten, twisted, pulled out of
 * register and cut flat — so each drawing is read once, here, for the one
 * thing a body is: how far every point is from its edge.
 *
 * Nothing is redrawn. The ink in Frank's file is thresholded, its parts are
 * told apart, and an exact distance transform is run over it at the size it
 * was drawn. The result is sampled down to a small grid and written into
 * lib/_marks.data.js, which nobody edits: delete it and this makes it again.
 *
 *   node make/mkmarks.js            → lib/_marks.data.js
 *   node make/mkmarks.js --preview  → also a PNG of each field, in the scratch dir given
 */
const fs = require("fs");
const path = require("path");
const { readPNG } = require("../lib/_raster.js");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "assets", "frank");
/* the long side of a stored field, in cells. Frank's drawings are 300–700px
   of ink; a body at 520px reads a cell every 3px, finer than any screen */
const GRID = 160;
/* how far past the drawing the grid reaches, in cells — the fringe, the
   spread and the second plate all read the field outside the ink */
const PAD = 22;
/* the field is stored as one byte a cell, companded so the cells near the
   edge — where the press actually looks — keep the most precision */
const RANGE = 64;
const K = 127 / Math.sqrt(RANGE);
const enc = (d) => Math.round(Math.sign(d) * Math.min(127, Math.sqrt(Math.min(RANGE, Math.abs(d))) * K));

/* ---- reading the ink ---------------------------------------------------- */
function inkMask(file) {
  const im = readPNG(path.join(SRC, file));
  const m = new Uint8Array(im.w * im.h);
  for (let i = 0; i < m.length; i++) {
    const j = i * 4, a = im.px[j + 3] / 255;
    const lum = (im.px[j] + im.px[j + 1] + im.px[j + 2]) / 3 * a + 255 * (1 - a);
    m[i] = lum < 128 ? 1 : 0;
  }
  return { w: im.w, h: im.h, m };
}
/* the parts of a drawing, by 4-connectivity: each one a list of pixels */
function parts(mk, val) {
  const { w, h, m } = mk, lab = new Int32Array(w * h).fill(-1), out = [];
  for (let i = 0; i < m.length; i++) {
    if (m[i] !== val || lab[i] >= 0) continue;
    const id = out.length, px = [i], stack = [i];
    lab[i] = id;
    while (stack.length) {
      const p = stack.pop(), x = p % w, y = (p / w) | 0;
      const nb = [x > 0 && p - 1, x < w - 1 && p + 1, y > 0 && p - w, y < h - 1 && p + w];
      for (const q of nb) {
        if (q === false || m[q] !== val || lab[q] >= 0) continue;
        lab[q] = id; px.push(q); stack.push(q);
      }
    }
    out.push(px);
  }
  return { lab, list: out };
}
const box = (px, w) => {
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (const p of px) {
    const x = p % w, y = (p / w) | 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return { x0, y0, x1: x1 + 1, y1: y1 + 1 };
};
const only = (mk, pxs) => {
  const m = new Uint8Array(mk.w * mk.h);
  for (const px of pxs) for (const p of px) m[p] = 1;
  return { w: mk.w, h: mk.h, m };
};
/* holes become ink: whatever white the border cannot reach is inside */
function fillHoles(mk) {
  const { w, h } = mk, bg = parts(mk, 0), m = Uint8Array.from(mk.m);
  const outer = new Set();
  for (let x = 0; x < w; x++) { outer.add(bg.lab[x]); outer.add(bg.lab[(h - 1) * w + x]); }
  for (let y = 0; y < h; y++) { outer.add(bg.lab[y * w]); outer.add(bg.lab[y * w + w - 1]); }
  for (let i = 0; i < m.length; i++) if (!m[i] && !outer.has(bg.lab[i])) m[i] = 1;
  return { w, h, m };
}
/* a box blur, then a threshold: speckle read as the cloud it makes */
function cloud(mk, r, t) {
  const { w, h } = mk, a = new Float32Array(w * h), b = new Float32Array(w * h);
  for (let i = 0; i < a.length; i++) a[i] = mk.m[i];
  const pass = (src, dst, horiz) => {
    for (let o = 0; o < (horiz ? h : w); o++) {
      let s = 0;
      const n = horiz ? w : h, at = (k) => (horiz ? o * w + k : k * w + o);
      for (let k = -r; k <= r; k++) s += src[at(Math.max(0, Math.min(n - 1, k)))];
      for (let k = 0; k < n; k++) {
        dst[at(k)] = s / (2 * r + 1);
        s += src[at(Math.min(n - 1, k + r + 1))] - src[at(Math.max(0, k - r))];
      }
    }
  };
  pass(a, b, true); pass(b, a, false); pass(a, b, true); pass(b, a, false);
  const m = new Uint8Array(w * h);
  for (let i = 0; i < m.length; i++) m[i] = a[i] > t ? 1 : 0;
  return { w, h, m };
}

/* ---- the distance, exactly (Felzenszwalb & Huttenlocher) --------------- */
function edt1(f, n) {
  const d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  let k = 0; v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s;
    while (true) {
      const p = v[k];
      s = ((f[q] + q * q) - (f[p] + p * p)) / (2 * q - 2 * p);
      if (s <= z[k] && k > 0) { k--; continue; }
      if (s <= z[k]) { k--; break; }
      break;
    }
    k++; v[k] = q; z[k] = s; z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
  return d;
}
/** squared distance from every pixel to the nearest pixel where `m` is `val` */
function edt(mk, val) {
  const { w, h, m } = mk, BIG = 1e12, g = new Float64Array(w * h);
  for (let i = 0; i < g.length; i++) g[i] = m[i] === val ? 0 : BIG;
  const col = new Float64Array(h), row = new Float64Array(w);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) col[y] = g[y * w + x];
    const d = edt1(col, h);
    for (let y = 0; y < h; y++) g[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) row[x] = g[y * w + x];
    const d = edt1(row, w);
    for (let x = 0; x < w; x++) g[y * w + x] = d[x];
  }
  return g;
}
/** negative inside, positive outside, in source pixels */
function signed(mk) {
  const toInk = edt(mk, 1), toPaper = edt(mk, 0), out = new Float64Array(mk.m.length);
  for (let i = 0; i < out.length; i++) {
    out[i] = mk.m[i] ? -(Math.sqrt(toPaper[i]) - 0.5) : Math.sqrt(toInk[i]) - 0.5;
  }
  return out;
}

/* ---- down to a grid ------------------------------------------------------ *
 * `frame` is the box, in source pixels, that the mark's unit square stands
 * for: every part of a mark is stored in the same frame, so they sit where
 * Frank put them relative to one another. */
function grid(mk, frame) {
  const sd = signed(mk), { w, h } = mk;
  const side = Math.max(frame.x1 - frame.x0, frame.y1 - frame.y0);
  const step = side / GRID;                         /* source px per cell */
  const gw = Math.ceil((frame.x1 - frame.x0) / step) + PAD * 2;
  const gh = Math.ceil((frame.y1 - frame.y0) / step) + PAD * 2;
  const at = (x, y) => {
    /* outside the drawing's canvas the paper goes on: distance grows */
    const cx = Math.max(0, Math.min(w - 1, x)), cy = Math.max(0, Math.min(h - 1, y));
    const x0 = Math.floor(cx), y0 = Math.floor(cy), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1);
    const fx = cx - x0, fy = cy - y0;
    const v = (sd[y0 * w + x0] * (1 - fx) + sd[y0 * w + x1] * fx) * (1 - fy)
            + (sd[y1 * w + x0] * (1 - fx) + sd[y1 * w + x1] * fx) * fy;
    return v + Math.hypot(x - cx, y - cy);
  };
  const bytes = new Int8Array(gw * gh);
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const x = frame.x0 + (i - PAD + 0.5) * step, y = frame.y0 + (j - PAD + 0.5) * step;
      bytes[j * gw + i] = enc(at(x, y) / step);
    }
  }
  return { gw, gh, b64: Buffer.from(bytes.buffer).toString("base64") };
}
/* parts that touch by a thread are still two parts: cut the ink back by
   `r`, tell apart what is left, and give every inked pixel back to the
   nearest part that survived */
function split(mk, r) {
  const { w, h, m } = mk, depth = edt(mk, 0), seed = new Uint8Array(w * h);
  for (let i = 0; i < seed.length; i++) seed[i] = m[i] && depth[i] > r * r ? 1 : 0;
  const sp = parts({ w, h, m: seed }, 1), lab = Int32Array.from(sp.lab);
  let front = [];
  for (let i = 0; i < lab.length; i++) if (lab[i] >= 0) front.push(i);
  while (front.length) {
    const next = [];
    for (const p of front) {
      const x = p % w;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w]) {
        if (q < 0 || q >= lab.length || !m[q] || lab[q] >= 0) continue;
        lab[q] = lab[p]; next.push(q);
      }
    }
    front = next;
  }
  const out = sp.list.map(() => []);
  for (let i = 0; i < lab.length; i++) if (m[i] && lab[i] >= 0) out[lab[i]].push(i);
  return out.filter((px) => px.length);
}
const union = (a, b) => ({ x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0),
  x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) });

/* ---- the four ------------------------------------------------------------ */
function build() {
  const out = {};

  /* the scrawl: lichen, not a line. Its specks are read as the cloud they
     make; the press puts the speck back, as dots, at whatever pitch it is
     asked for */
  {
    const mk = inkMask("minor-frank-logo1.png");
    const c = cloud(mk, 3, 0.3);
    const big = parts(c, 1).list.filter((p) => p.length > 400);
    const solid = only(c, big);
    const fr = big.map((p) => box(p, c.w)).reduce(union);
    out.scrawl = { from: "minor-frank-logo1.png", parts: { core: grid(solid, fr) },
      aspect: (fr.x1 - fr.x0) / (fr.y1 - fr.y0) };
  }

  /* the stroke, and where Frank set the name around it */
  {
    const mk = inkMask("minor-frank-logo2.png");
    const all = parts(mk, 1).list.filter((p) => p.length > 20);
    all.sort((a, b) => b.length - a.length);
    const stroke = all[0], fr = box(stroke, mk.w);
    /* a letter is small and keeps off the edge of the file — the frame round
       Frank's export is neither */
    const letters = all.slice(1).map((p) => box(p, mk.w)).filter((b) =>
      b.y1 - b.y0 < (fr.y1 - fr.y0) * 0.4 && b.x0 > 2 && b.y0 > 2 && b.x1 < mk.w - 2 && b.y1 < mk.h - 2);
    const midY = (fr.y0 + fr.y1) / 2;
    /* the letters are what is left: MINOR on the upper line, INDEX on the lower */
    const word = (up) => letters.filter((b) => ((b.y0 + b.y1) / 2 < midY) === up).reduce(union);
    const side = Math.max(fr.x1 - fr.x0, fr.y1 - fr.y0);
    const rel = (b) => ({ x: +((b.x0 - fr.x0) / side).toFixed(4), y: +((b.y0 - fr.y0) / side).toFixed(4),
      w: +((b.x1 - b.x0) / side).toFixed(4), h: +((b.y1 - b.y0) / side).toFixed(4) });
    out.stroke = { from: "minor-frank-logo2.png", parts: { core: grid(only(mk, [stroke]), fr) },
      aspect: (fr.x1 - fr.x0) / (fr.y1 - fr.y0),
      words: { MINOR: rel(word(true)), INDEX: rel(word(false)) } };
  }

  /* the figure: the X, and the two that stand either side of it. Taken from
     the filled drawing, holes and all filled in, so the outline and the
     inline Frank drew are things the press does to it rather than things it
     is stored as */
  {
    const mk = fillHoles(inkMask("minor-frank-logo3.png"));
    const all = split(mk, 6).filter((p) => p.length > 300);
    all.sort((a, b) => b.length - a.length);
    const core = all[0], sats = all.slice(1);
    const fr = all.map((p) => box(p, mk.w)).reduce(union);
    out.figure = { from: "minor-frank-logo3.png, minor-frank-logo4.png",
      parts: { core: grid(only(mk, [core]), fr), sats: grid(only(mk, sats), fr) },
      aspect: (fr.x1 - fr.x0) / (fr.y1 - fr.y0) };
  }
  return out;
}

function write(data) {
  const body = Object.keys(data).map((k) => `  ${k}: ${JSON.stringify(data[k])},`).join("\n");
  return `/* MINOR INDEX — Frank's marks as distance fields. Generated by make/mkmarks.js
   from assets/frank/. Do not edit: edit the drawings, or the script.
   Each part is a ${"grid"} of signed distances, one byte a cell, companded
   (d = sign·(|q|/${K.toFixed(4)})²), padded ${PAD} cells past the ink. */
module.exports = { GRID: ${GRID}, PAD: ${PAD}, K: ${K}, MARKS: {
${body}
} };
`;
}

module.exports = { build, write, GRID, PAD };

if (require.main === module) {
  const data = build();
  const file = path.join(ROOT, "lib", "_marks.data.js");
  fs.writeFileSync(file, write(data));
  for (const k in data) {
    const p = data[k].parts;
    console.log(k.padEnd(8) + Object.keys(p).map((q) => `${q} ${p[q].gw}×${p[q].gh}`).join(", "));
  }
  console.log(`lib/_marks.data.js ${(fs.statSync(file).size / 1024).toFixed(0)}kb`);
}
