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

const UPM = 1000, CAP = 700;          /* the em, and the cap height inside it */
const ASC = 950, DESC = -180;

/* ---- pen into outlines -------------------------------------------------- */
const ARCPTS = 12;                    /* points round a cap or a joint */
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
function disc(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < ARCPTS * 2; i++) {
    const a = (i / (ARCPTS * 2)) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}
/* wound the way TrueType wants a filled contour */
function orient(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    s += (b[0] - a[0]) * (b[1] + a[1]);
  }
  return s > 0 ? pts : pts.slice().reverse();
}

/** one character, as contours in font units (y up, baseline at 0) */
function outlineGlyph(ch, opt) {
  const o = Object.assign({ weight: 0.12, hand: 0.015, seed: 7, width: 1, slant: 0 }, opt);
  const g = T.glyph(ch);
  if (!g) return null;
  /* drawn exactly as a plate draws it, then the polylines are read back */
  const tp = T.textPaths(ch, 0, 0, 1, { weight: o.weight, hand: o.hand, seed: o.seed,
                                        width: o.width, slant: o.slant, track: 0 });
  const r = (o.weight / 2) * CAP;
  const rings = [];
  const F = (p) => [p[0] * CAP, (1 - p[1]) * CAP];      /* design y-down to font y-up */
  for (const gl of tp.glyphs) {
    for (const run of gl.runs) {
      for (let i = 1; i < run.length; i++) {
        const a = F(run[i - 1]), b = F(run[i]);
        rings.push(orient(capsule(a[0], a[1], b[0], b[1], r)));
      }
      for (let i = 0; i < run.length; i++) {            /* joints, and both ends */
        if (i > 0 && i < run.length - 1) {
          const p = run[i], q = run[i - 1], s = run[i + 1];
          const a1 = Math.atan2(s[1] - p[1], s[0] - p[0]);
          const a2 = Math.atan2(q[1] - p[1], q[0] - p[0]);
          let d = Math.abs(a1 - a2);
          if (d > Math.PI) d = Math.PI * 2 - d;
          if (Math.abs(d - Math.PI) < 0.25) continue;   /* straight on: no joint */
        }
        const p = F(run[i]);
        rings.push(orient(disc(p[0], p[1], r)));
      }
    }
  }
  const adv = Math.round((g.w + T.TRACK) * CAP * o.width);
  return { contours: rings.map((ring) => ring.map((p) => [Math.round(p[0]), Math.round(p[1])])), adv };
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
    win: tag(str.split("").map((c) => " " + c).join("")),   /* utf-16be, the crude way */
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
 */
function buildTTF(opt) {
  const o = Object.assign({ family: "Minor Index", style: "Regular", weight: 0.12,
                            hand: 0.015, seed: 7, width: 1, slant: 0, version: "1.000" }, opt);
  const extra = ["É", "È", "Ê", "Ë", "À", "Â", "Ç",
                 "Î", "Ï", "Ô", "Û", "Ù"];
  const chars = Object.keys(T.G).concat(extra)
    .filter((c, i, a) => a.indexOf(c) === i && c !== " ");
  const glyphs = [{ contours: [], adv: Math.round(0.32 * CAP) }];       /* 0 = .notdef */
  const map = {};
  const space = T.glyph(" ");
  glyphs.push({ contours: [], adv: Math.round((space.w + T.TRACK) * CAP * o.width) });
  map[32] = 1;
  for (const ch of chars) {
    const g = outlineGlyph(ch, o);
    if (!g) continue;
    map[ch.codePointAt(0)] = glyphs.length;
    /* lowercase types the caps — accented lowercase too, which French needs */
    const low = ch.toLowerCase();
    if (low !== ch) map[low.codePointAt(0)] = glyphs.length;
    glyphs.push(g);
  }
  const allX = [0], allY = [0];
  let maxPts = 0, maxCts = 0;
  for (const g of glyphs) {
    maxCts = Math.max(maxCts, g.contours.length);
    let np = 0;
    for (const c of g.contours) {
      np += c.length;
      for (const p of c) { allX.push(p[0]); allY.push(p[1]); }
    }
    maxPts = Math.max(maxPts, np);
  }
  const xMin = Math.min.apply(null, allX), xMax = Math.max.apply(null, allX);
  const yMin = Math.min.apply(null, allY), yMax = Math.max.apply(null, allY);

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

  const head = cat(u32(0x00010000), u32(0x00010000), u32(0), u32(0x5f0f3cf5),
    u16(0x000b), u16(UPM), buf(8), buf(8),
    i16(xMin), i16(yMin), i16(xMax), i16(yMax),
    u16(0), u16(8), i16(2), i16(1), i16(0));
  const hhea = cat(u32(0x00010000), i16(ASC), i16(DESC), i16(0), u16(maxAdv),
    i16(xMin), i16(0), i16(xMax), i16(1), i16(0), i16(0), buf(8), i16(0), u16(glyphs.length));
  const maxp = cat(u32(0x00010000), u16(glyphs.length), u16(maxPts), u16(maxCts),
    u16(0), u16(0), u16(1), u16(0), u16(0), u16(0), u16(0), u16(0), u16(0), u16(0), u16(0));
  const hmtx = cat.apply(null, glyphs.map((g) => cat(u16(g.adv), i16(0))));
  const os2 = cat(u16(4), i16(Math.round(0.55 * CAP)), u16(o.weight > 0.18 ? 700 : 400), u16(5),
    u16(0), i16(0), i16(0), i16(0), i16(0), i16(0), i16(0), i16(0), i16(0), i16(0),
    Uint8Array.from([2, 11, 5, 2, 2, 2, 2, 2, 2, 4]),
    u32(1), u32(0), u32(0), u32(0), tag("MINR"), u16(0x0040), u16(32), u16(0xfffd),
    i16(ASC), i16(DESC), i16(200), u16(ASC), u16(-DESC), u32(1), u32(0),
    i16(Math.round(0.52 * CAP)), i16(CAP), u16(2), u16(2), u16(2));
  const post = cat(u32(0x00030000), u32(0), i16(0), i16(0), u32(0), u32(0), u32(0), u32(0), u32(0));
  const nameT = nameTable([
    [0, "Generated from the MINOR INDEX drawing. Not drawn in a font editor."],
    [1, o.family], [2, o.style],
    [3, "MinorIndex-" + o.style + "-" + o.version],
    [4, o.family + " " + o.style], [5, "Version " + o.version],
    [6, o.family.replace(/\s+/g, "") + "-" + o.style],
  ]);

  const tables = [["OS/2", os2], ["cmap", cmap4(map)], ["glyf", glyf], ["head", head],
    ["hhea", hhea], ["hmtx", hmtx], ["loca", locaT], ["maxp", maxp], ["name", nameT],
    ["post", post]].sort((a, b) => (a[0] < b[0] ? -1 : 1));

  const n = tables.length;
  let sr = 16;
  while (sr * 2 <= n * 16) sr *= 2;
  let offset = 12 + n * 16;
  const dir = [u32(0x00010000), u16(n), u16(sr), u16(Math.round(Math.log2(sr / 16))), u16(n * 16 - sr)];
  const bodies = [];
  let headOffset = 0;
  for (const entry of tables) {
    const name = entry[0], data = entry[1];
    if (name === "head") headOffset = offset;
    dir.push(cat(tag(name), u32(checksum(data)), u32(offset), u32(data.length)));
    bodies.push(pad4(data));
    offset += pad4(data).length;
  }
  const font = cat(cat.apply(null, dir), cat.apply(null, bodies));
  /* the whole-file checksum goes back into head once the file exists */
  new DataView(font.buffer).setUint32(headOffset + 8, (0xb1b0afba - checksum(font)) >>> 0);
  return { font: font, glyphs: glyphs.length, map: map, metrics: { UPM, CAP, ASC, DESC } };
}

module.exports = { buildTTF, outlineGlyph, UPM, CAP, ASC, DESC };
