/* A TrueType reader, for the tests only.
 *
 * The repository writes its own font tables; it should read them back with
 * its own eyes rather than trusting the one rasteriser that happens to be
 * installed. macOS is forgiving about a malformed OS/2 and will render a
 * file that nothing else will open — which is exactly the failure this is
 * here to catch.
 */
function read(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u8 = (o) => dv.getUint8(o);
  const u16 = (o) => dv.getUint16(o);
  const i16 = (o) => dv.getInt16(o);
  const u32 = (o) => dv.getUint32(o);
  const tag = (o) => String.fromCharCode(u8(o), u8(o + 1), u8(o + 2), u8(o + 3));

  const numTables = u16(4);
  const dir = {}, order = [];
  for (let i = 0; i < numTables; i++) {
    const o = 12 + i * 16;
    const name = tag(o);
    dir[name] = { checksum: u32(o + 4), off: u32(o + 8), len: u32(o + 12) };
    order.push(name);
  }
  const T = (name) => {
    const e = dir[name];
    if (!e) throw new Error("no " + name + " table");
    return e;
  };
  /* the sum a table's bytes must add up to, padded to four */
  const checksum = (off, len) => {
    let s = 0;
    for (let i = 0; i < len; i += 4) {
      let v = 0;
      for (let k = 0; k < 4; k++) v = (v * 256 + (i + k < len ? u8(off + i + k) : 0)) >>> 0;
      s = (s + v) >>> 0;
    }
    return s >>> 0;
  };

  const head = T("head");
  const maxp = T("maxp");
  const numGlyphs = u16(maxp.off + 4);
  const indexToLocFormat = i16(head.off + 50);

  /* loca → glyf offsets */
  const loca = T("loca"), locs = [];
  for (let i = 0; i <= numGlyphs; i++) {
    locs.push(indexToLocFormat ? u32(loca.off + i * 4) : u16(loca.off + i * 2) * 2);
  }

  /* cmap format 4, the only one written here */
  function cmap() {
    const c = T("cmap"), n = u16(c.off + 2), subs = [], map = {};
    for (let i = 0; i < n; i++) {
      const r = c.off + 4 + i * 8;
      subs.push({ platformID: u16(r), encodingID: u16(r + 2), off: c.off + u32(r + 4) });
    }
    for (const s of subs) {
      s.format = u16(s.off);
      if (s.format !== 4) continue;
      const segX2 = u16(s.off + 6), seg = segX2 / 2;
      const endO = s.off + 14, startO = endO + segX2 + 2;
      const deltaO = startO + segX2, rangeO = deltaO + segX2;
      for (let i = 0; i < seg; i++) {
        const end = u16(endO + i * 2), start = u16(startO + i * 2);
        const delta = i16(deltaO + i * 2), ro = u16(rangeO + i * 2);
        if (start === 0xffff) continue;
        for (let cp = start; cp <= end && cp !== 0xffff; cp++) {
          let g;
          if (ro === 0) g = (cp + delta) & 0xffff;
          else {
            const at = rangeO + i * 2 + ro + (cp - start) * 2;
            g = u16(at);
            if (g) g = (g + delta) & 0xffff;
          }
          if (g) map[cp] = g;
        }
      }
    }
    return { subtables: subs, map: map };
  }

  /* every name record, decoded from the encoding it claims */
  function names() {
    const t = T("name"), count = u16(t.off + 2), strOff = t.off + u16(t.off + 4), out = [];
    for (let i = 0; i < count; i++) {
      const r = t.off + 6 + i * 12;
      const platformID = u16(r), encodingID = u16(r + 2), languageID = u16(r + 4);
      const nameID = u16(r + 6), len = u16(r + 8), off = u16(r + 10);
      let s = "";
      if (platformID === 3 || (platformID === 0)) {
        for (let k = 0; k + 1 < len; k += 2) s += String.fromCharCode(u16(strOff + off + k));
      } else {
        for (let k = 0; k < len; k++) s += String.fromCharCode(u8(strOff + off + k));
      }
      out.push({ platformID, encodingID, languageID, nameID, text: s, len });
    }
    return out;
  }

  /* a glyph's contours, so a test can say the outline is really there */
  function glyph(gid) {
    const g = T("glyf");
    const from = locs[gid], to = locs[gid + 1];
    if (to <= from) return { contours: 0, points: 0, empty: true };
    const o = g.off + from;
    const nc = i16(o);
    if (nc < 0) return { contours: -1, points: 0, composite: true };
    const ends = [];
    for (let i = 0; i < nc; i++) ends.push(u16(o + 10 + i * 2));
    return { contours: nc, points: nc ? ends[nc - 1] + 1 : 0,
             xMin: i16(o + 2), yMin: i16(o + 4), xMax: i16(o + 6), yMax: i16(o + 8) };
  }

  /* ---- the variable tables ------------------------------------------
   * Read back rather than trusted, and then actually interpolated: a test
   * that only checks the header of a gvar table is a test that a font is
   * shaped like a font. What has to be true is that asking this file for
   * the Light weight gives the Light drawing.
   */
  function fvar() {
    if (!dir.fvar) return null;
    const o = T("fvar").off;
    const axesAt = o + u16(o + 4), axisCount = u16(o + 8), axisSize = u16(o + 10);
    const instCount = u16(o + 12), instSize = u16(o + 14);
    const fx = (at) => dv.getInt32(at) / 65536;
    const axes = [], instances = [];
    for (let i = 0; i < axisCount; i++) {
      const a = axesAt + i * axisSize;
      axes.push({ tag: tag(a), min: fx(a + 4), def: fx(a + 8), max: fx(a + 12),
                  flags: u16(a + 16), nameID: u16(a + 18) });
    }
    const instAt = axesAt + axisCount * axisSize;
    for (let i = 0; i < instCount; i++) {
      const b = instAt + i * instSize;
      const coords = [];
      for (let k = 0; k < axisCount; k++) coords.push(fx(b + 4 + k * 4));
      instances.push({ nameID: u16(b), flags: u16(b + 2), coords });
    }
    return { axes, instances };
  }
  /* user coordinate → the axis's own coordinate, through fvar and then avar */
  function normalize(loc) {
    const fv = fvar();
    return fv.axes.map((a, i) => {
      const v = loc[a.tag] === undefined ? a.def : loc[a.tag];
      let n = v === a.def ? 0
        : v < a.def ? -(a.def - v) / (a.def - a.min || 1)
                    : (v - a.def) / (a.max - a.def || 1);
      n = Math.max(-1, Math.min(1, n));
      if (!dir.avar) return n;
      const o = T("avar").off;
      let at = o + 8;
      for (let k = 0; k < i; k++) at += 2 + u16(at) * 4;
      const count = u16(at);
      const pts = [];
      for (let k = 0; k < count; k++) {
        pts.push([i16(at + 2 + k * 4) / 16384, i16(at + 4 + k * 4) / 16384]);
      }
      for (let k = 1; k < pts.length; k++) {
        if (n <= pts[k][0]) {
          const [x0, y0] = pts[k - 1], [x1, y1] = pts[k];
          return x1 === x0 ? y1 : y0 + ((n - x0) / (x1 - x0)) * (y1 - y0);
        }
      }
      return n;
    });
  }
  /* the packed deltas gvar stores, unpacked */
  function unpack(at, count) {
    const out = [];
    while (out.length < count) {
      const ctl = u8(at++), run = (ctl & 0x3f) + 1;
      if (ctl & 0x80) { for (let i = 0; i < run; i++) out.push(0); }
      else if (ctl & 0x40) { for (let i = 0; i < run; i++) { out.push(i16(at)); at += 2; } }
      else { for (let i = 0; i < run; i++) { let v = u8(at++); out.push(v > 127 ? v - 256 : v); } }
    }
    return { deltas: out.slice(0, count), at };
  }
  /** a glyph's points at a place on the axes — the interpolation itself */
  function varGlyph(gid, loc) {
    const g = glyph(gid);
    const base = [];
    const gl = T("glyf"), o = gl.off + locs[gid];
    if (!g.empty && g.contours > 0) {
      const nc = g.contours, ends = [];
      for (let i = 0; i < nc; i++) ends.push(u16(o + 10 + i * 2));
      const nPts = ends[nc - 1] + 1;
      let at = o + 10 + nc * 2;
      at += 2 + u16(at);                                   /* instructions */
      const flags = [];
      while (flags.length < nPts) {
        const f = u8(at++);
        flags.push(f);
        if (f & 8) { let r = u8(at++); while (r--) flags.push(f); }
      }
      let x = 0;
      const xs = [];
      for (const f of flags) {
        if (f & 2) { const d = u8(at++); x += (f & 16) ? d : -d; }
        else if (!(f & 16)) { x += i16(at); at += 2; }
        xs.push(x);
      }
      let y = 0;
      const ys = [];
      for (const f of flags) {
        if (f & 4) { const d = u8(at++); y += (f & 32) ? d : -d; }
        else if (!(f & 32)) { y += i16(at); at += 2; }
        ys.push(y);
      }
      for (let i = 0; i < nPts; i++) base.push([xs[i], ys[i]]);
    }
    const adv = u16(T("hmtx").off + gid * 4);
    const xMin = base.length ? Math.min.apply(null, base.map((p) => p[0])) : 0;
    const pts = base.concat([[xMin, 0], [xMin + adv, 0], [0, 0], [0, 0]]);
    if (!dir.gvar) return pts;

    const gv = T("gvar").off;
    const axisCount = u16(gv + 4);
    const longOffsets = u16(gv + 14) & 1;
    const dataAt = gv + u32(gv + 16);
    const offAt = gv + 20;
    const off = (i) => (longOffsets ? u32(offAt + i * 4) : u16(offAt + i * 2) * 2);
    if (off(gid + 1) <= off(gid)) return pts;
    const gAt = dataAt + off(gid);
    const header = u16(gAt), tupleCount = header & 0x0fff;
    let hAt = gAt + 4, dAt = gAt + u16(gAt + 2);
    if (header & 0x8000) dAt += unpack(dAt, 0).at - dAt || 1;   /* "all points" is one byte */
    const N = normalize(loc);
    for (let t = 0; t < tupleCount; t++) {
      const size = u16(hAt), idx = u16(hAt + 2);
      hAt += 4;
      const peak = [];
      if (idx & 0x8000) {
        for (let k = 0; k < axisCount; k++) { peak.push(i16(hAt) / 16384); hAt += 2; }
      }
      if (idx & 0x4000) hAt += axisCount * 4;
      let scalar = 1;
      for (let k = 0; k < axisCount; k++) {
        const p = peak[k], n = N[k];
        if (p === 0) continue;
        if (n === 0 || (n < 0) !== (p < 0) || Math.abs(n) > Math.abs(p) * 1e9) { scalar = 0; break; }
        scalar *= Math.min(1, n / p);
      }
      if (scalar !== 0) {
        const dx = unpack(dAt, pts.length);
        const dy = unpack(dx.at, pts.length);
        for (let i = 0; i < pts.length; i++) {
          pts[i] = [pts[i][0] + dx.deltas[i] * scalar, pts[i][1] + dy.deltas[i] * scalar];
        }
      }
      dAt += size;
    }
    return pts;
  }

  return {
    dir, order, numTables, numGlyphs, indexToLocFormat, locs, checksum,
    fvar, normalize, varGlyph,
    u8, u16, i16, u32, tag, T, cmap, names, glyph,
    sfntVersion: u32(0),
    head: {
      unitsPerEm: u16(head.off + 18), macStyle: u16(head.off + 44),
      created: [u32(head.off + 20), u32(head.off + 24)],
      xMin: i16(head.off + 36), yMin: i16(head.off + 38),
      xMax: i16(head.off + 40), yMax: i16(head.off + 42),
      checkSumAdjustment: u32(head.off + 8), magic: u32(head.off + 12),
      off: head.off,
    },
    hhea: { ascent: i16(T("hhea").off + 4), descent: i16(T("hhea").off + 6),
            numberOfHMetrics: u16(T("hhea").off + 34) },
    os2: (() => {
      const o = T("OS/2").off;
      return { version: u16(o), usWeightClass: u16(o + 4), usWidthClass: u16(o + 6),
               fsSelection: u16(o + 62), usFirstCharIndex: u16(o + 64),
               usLastCharIndex: u16(o + 66), sTypoAscender: i16(o + 68),
               sTypoDescender: i16(o + 70), usWinAscent: u16(o + 74),
               usWinDescent: u16(o + 76), sxHeight: i16(o + 86), sCapHeight: i16(o + 88),
               len: T("OS/2").len };
    })(),
  };
}
module.exports = { read };
