/* MINOR INDEX — SPIRALE. Plates 100–115, and not a word on any of them.
 *
 * The batch after SOLEIL, under the same two rules: the eight-armed mark is
 * retired — the symbols are the cell and the sun, printed the way 08 and 09
 * were printed — and nothing on the sheet has to be read.
 *
 * What is new is only a direction. A sun spends itself outward; here
 * something takes hold of what it spent and turns it back in. The rays bend,
 * the seeds arrive at 137.5°, the cell is wound down its own filament until
 * the last of it is a dot. Nothing on these plates is a shape the earlier
 * batches did not already have — every one of them is that shape, warped, and
 * the warp is the same arithmetic whether the plate is cut solid or screened,
 * so the two are the same body.
 *
 *   node logo/mkspiral.js                  all of them
 *   node logo/mkspiral.js 5150             reroll the seeded ones
 *   node logo/mkspiral.js --only 105,109   just these
 */
const S = require("./_sheet.js");
const Y = require("./_glyphs.js");
const { INK, n, rng, pick, axes, brackets, polar, swipe, G, place, run,
        ticks, reg, band, frame, print, mouths } = S;
const { blob, cell, sunGeom, sunSolid, sunSDF, sunWhirl, screen, spiralPath, phylloPts,
        sDisc, sRing, sPts, sSub, sUnion, sShift, sTwist, sSpiral } = Y;

const P = [];
const plate = (name, w, h, draw) => P.push({ name, w, h, draw });


/* ---- the sun, wound ----------------------------------------------------- */
/* sTwist rotates the field by k·r, so a shape sitting at angle α, radius r,
   comes out at α + k·r. `sunWhirl` cuts the same warp in polygons: same
   geometry, same k, so the solid plate and the screened one are one body —
   100 and 101 are the same sun, cut and printed. It lives in _glyphs.js now,
   where the studio can reach it too. */
const whirlSolid = sunWhirl;
/* the same body as a field */
const whirlSDF = (g, k) => sTwist(sunSDF(g), g.C, g.C, k);

/* 100 — the emblem. The sun of 77 with something holding its rays. */
plate("100-spirale-emblem", 820, 1080, () => {
  const cx = 410, cy = 520, size = 620;
  const g = sunGeom({ size, seed: 100, rays: 30, disc: 0.2, short: 0.34, long: 0.47 });
  return { bg: INK.black, ink: INK.white, body:
    place(cx - size / 2, cy - size / 2, whirlSolid(g, INK.white, 0.0042))
    + G(INK.white, 4, `<circle cx="${cx}" cy="${cy}" r="368" fill="none"/>`)
    + G(INK.white, 1.2, `<circle cx="${cx}" cy="${cy}" r="344" fill="none"/>`)
    + ticks(cx, cy, 356, 24, 7, INK.white) };
});

/* 101 — the same sun, printed hot and full bleed. The rays have grown into
   each other on the turn and the middle is one solid thing. */
plate("101-tourbillon-surexpose", 640, 640, () => {
  const size = 780, tx = -70, ty = -140;
  const g = sunGeom({ size, seed: 101, rays: 28, disc: 0.18, short: 0.3, long: 0.46 });
  return { body: print(whirlSDF(g, 0.0052), tx, ty, 640, 640,
    { cell: 7.2, falloff: 15, spread: 0.68, grain: 0.26, angle: 15, seed: 5, color: INK.black }) };
});

/* 102 — knocked out, under the instrument. The axes do not turn with it. */
plate("102-tourbillon-negatif", 640, 640, (r) => {
  const size = 440, tx = 100, ty = 100;
  const g = sunGeom({ size, seed: 102, rays: 34, disc: 0.2, short: 0.33, long: 0.47 });
  return { bg: INK.black, ink: INK.white, body:
    print(whirlSDF(g, -0.0062), tx, ty, 640, 640,
      { cell: 4.2, falloff: 8, spread: 0.52, angle: 75, seed: 9, color: INK.white })
    + G(INK.white, 1.1, axes(320, 320, 250, 4, 0, r)
      + polar(320, 320, 196, 3, 24, 0, r)
      + brackets(70, 84, 500, 472, 30)) };
});

/* 103 — the seed head: the sun counted out, 137.5° at a time, every ray
   landed and become a body. */
plate("103-graine", 640, 760, () => {
  const pts = phylloPts(320, 330, 300, { c: 15.5, r0: 3.4, r1: 12.5 });
  return { body:
    print(sPts(pts), 0, 0, 640, 700, { cell: 4.2, falloff: 7, spread: 0.56,
      grain: 0.18, angle: 15, seed: 5, color: INK.black })
    + band(60, 668, 520, 26, INK.fluo)
    + G(INK.black, 1.2, `<line x1="60" y1="648" x2="580" y2="648"/>`) };
});

/* 104 — the same head, cut out of the toner, and the marker over it. */
plate("104-graine-inverse", 640, 760, (r) => {
  const pts = phylloPts(320, 330, 260, { c: 16.5, r0: 4, r1: 13 });
  return { bg: INK.black, ink: INK.white, body:
    swipe(30, 250, 580, 74, -3, r, INK.blu)
    + print(sPts(pts), 0, 0, 640, 700, { cell: 3.6, falloff: 6, spread: 0.5,
      grain: 0.14, angle: 75, seed: 11, color: INK.white })
    + band(60, 668, 520, 26, INK.white)
    + reg(80, 706, 9, INK.fluo) + reg(560, 706, 9, INK.fluo) };
});

/* 105 — the mouth and the tail. The band thickens the further out it gets
   and the dots stop where it has already been eaten. */
plate("105-ouroboros", 760, 760, () => {
  const C = 380;
  const sp = sSpiral(C, C, { a: 9, b: 0.19, turns: 3.6, from: 0.6,
    w: (r) => Math.max(4, Math.min(46, r * 0.2)) });
  const mouth = sDisc(C + 214, C - 96, 118);
  return { bg: INK.black, ink: INK.white, body:
    print(sSub(sp, mouth), 0, 0, 760, 760,
      { cell: 4, falloff: 8, spread: 0.54, grain: 0.16, angle: 15, seed: 7, color: INK.white })
    + G(INK.white, 1.2, `<circle cx="${C + 214}" cy="${C - 96}" r="118" fill="none"/>`)
    + ticks(C, C, 344, 32, 6, INK.white) };
});

/* 106 — the cell wound down its own filament: eight generations on one
   spiral, each the size the one outside it had left, until the last of it
   is a dot. The chain is measured, then centred on what it came to. */
plate("106-enroulement", 900, 640, () => {
  const A = 252, K = 0.72, items = [];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i < 8; i++) {
    const t = -0.5 + i * 0.94, r = A * Math.pow(K, i), s = 300 * Math.pow(K, i) + 12;
    const x = Math.cos(t) * r - s / 2, y = Math.sin(t) * r - s / 2;
    items.push({ x, y, s, i });
    x0 = Math.min(x0, x); y0 = Math.min(y0, y);
    x1 = Math.max(x1, x + s); y1 = Math.max(y1, y + s);
  }
  const dx = (900 - (x1 - x0)) / 2 - x0, dy = (640 - (y1 - y0)) / 2 - y0;
  const body = items.map((it) => place(it.x, it.y,
    cell({ size: it.s, seed: 23 + it.i * 13, sat: 3 + (it.i % 3),
           color: it.i === 2 ? INK.fluo : INK.white }))).join("");
  return { bg: INK.black, ink: INK.white, body: place(dx, dy,
    G(INK.white, 1.2, spiralPath(0, 0, { a: A, b: Math.log(K) / 0.94, turns: 1.2, from: -0.5 }))
    + body) };
});

/* 107 — the drill. One turn left, one turn right, and the press lined up
   neither: blu at 75°, toner at 15°. */
plate("107-vrille", 700, 700, () => {
  const C = 350;
  const a = sSpiral(C, C, { a: 8, b: 0.2, turns: 3.2, w: (r) => Math.max(3, r * 0.14) });
  const b = sSpiral(C, C, { a: 8, b: -0.2, turns: 3.2, from: -Math.PI * 6.4,
    w: (r) => Math.max(3, r * 0.14) });
  return { body:
    print(sShift(b, -8, 6), 0, 0, 700, 700,
      { cell: 4.6, falloff: 9, spread: 0.54, grain: 0.16, angle: 75, seed: 3, color: INK.blu })
    + print(a, 0, 0, 700, 700,
      { cell: 4.6, falloff: 9, spread: 0.52, grain: 0.16, angle: 15, seed: 7, color: INK.black })
    + reg(60, 60, 10, INK.blu) + reg(640, 640, 10, INK.black) };
});

/* 108 — five generations, and the hand on it tightens each time: more turn,
   coarser screen, less of it coming back. */
plate("108-generations-spirale", 1020, 300, () => {
  const out = [];
  for (let i = 0; i < 5; i++) {
    const x = 30 + i * 194, s = 176;
    const g = sunGeom({ size: s, seed: 108 + i * 7, rays: 28 - i * 2, disc: 0.2, short: 0.32, long: 0.46 });
    out.push(place(x, 62, screen({ x: 0, y: 0, w: s, h: s, sdf: whirlSDF(g, 0.004 + i * 0.0075),
      cell: 2.6 + i * 1.4, falloff: 5.5 + i * 1.7, spread: 0.5 + i * 0.04,
      grain: 0.16 + i * 0.1, angle: 15 + i * 9, seed: 3 + i * 5, color: INK.black }))
      + frame(x, 62, s, s, INK.black)
      + band(x, 262, s * (1 - i * 0.18), 6, i === 4 ? INK.blu : INK.black));
  }
  return { body: out.join("") };
});

/* 109 — the maelstrom. Ink at the size ink costs, and the whole sheet
   turning about a point three quarters of the way off it. */
plate("109-maelstrom", 820, 1140, () => {
  const g = sunGeom({ size: 1240, seed: 109, rays: 40, disc: 0.15, short: 0.3, long: 0.47 });
  const gs = sunGeom({ size: 190, seed: 209, rays: 22, disc: 0.22, short: 0.33, long: 0.46 });
  return { bg: INK.fluo, body:
    print(whirlSDF(g, 0.0038), -200, -420, 820, 1140,
      { cell: 5.2, falloff: 13, spread: 0.6, grain: 0.24, angle: 15, seed: 7, color: INK.black })
    + band(0, 940, 820, 200, INK.black)
    + place(60, 946, screen({ x: 0, y: 0, w: 190, h: 190, sdf: whirlSDF(gs, -0.012),
        cell: 3.4, falloff: 7, angle: 75, seed: 5, color: INK.fluo }))
    + ticks(660, 1040, 70, 12, 7, INK.fluo) };
});

/* 110 — the field at night, all of it turning: sixteen bodies, no two of
   them wound by the same amount, and one of them not wound at all. */
plate("110-galaxie", 900, 640, (r) => {
  const out = [], marks = [];
  for (let i = 0; i < 16; i++) {
    const s = 58 + r() * 118;
    const x = (i % 4) * 225 + 112 - s / 2 + (r() - 0.5) * 130;
    const y = Math.floor(i / 4) * 160 + 80 - s / 2 + (r() - 0.5) * 96;
    const col = r() > 0.9 ? INK.fluo : (r() > 0.82 ? INK.blu : INK.white);
    const k = (r() - 0.35) * 0.03;
    const g = sunGeom({ size: s, seed: 110 + i * 13, rays: 14 + Math.floor(r() * 18),
      disc: 0.17 + r() * 0.08, short: 0.3, long: 0.46 });
    out.push(r() > 0.6
      ? place(x, y, i === 7 ? sunSolid(g, col) : whirlSolid(g, col, k))
      : place(x, y, screen({ x: 0, y: 0, w: s, h: s, sdf: whirlSDF(g, k), cell: 2 + r() * 2,
          falloff: 3 + r() * 6, spread: 0.5, angle: r() * 90, seed: 3 + i, color: col })));
  }
  for (let i = 0; i < 60; i++) {
    const x = r() * 900, y = r() * 640, L2 = 4 + r() * 8;
    marks.push(r() > 0.5 ? `<line x1="${n(x)}" y1="${n(y - L2)}" x2="${n(x)}" y2="${n(y + L2)}"/>`
                         : `<line x1="${n(x - L2)}" y1="${n(y)}" x2="${n(x + L2)}" y2="${n(y)}"/>`);
  }
  return { bg: INK.black, ink: INK.white, body: G(INK.white, 0.7, marks.join("")) + out.join("") };
});

/* 111 — the seal, applied crooked, the ring of ticks running out to nothing
   the way the spiral under it does. */
plate("111-sceau-spirale", 560, 560, (r) => {
  const C = 280, size = 250;
  const g = sunGeom({ size, seed: 111, rays: 26, disc: 0.22, short: 0.33, long: 0.46 });
  const sp = sSpiral(C, C, { a: 4, b: 0.2, turns: 1.9, w: 4.5 });
  return { body: swipe(28, 400, 504, 58, -5, r, INK.fluo)
    + place(0, 0, G(INK.blu, 6, `<circle cx="${C}" cy="${C}" r="212" fill="none"/>`)
      + G(INK.blu, 1.6, `<circle cx="${C}" cy="${C}" r="188" fill="none"/>`)
      + G(INK.blu, 1, spiralPath(C, C, { a: 5, b: 0.215, turns: 2.15, hand: 2.2, rand: r }))
      + ticks(C, C, 154, 36, 6, INK.blu)
      + screen({ x: C - size / 2, y: C - size / 2, w: size, h: size,
          sdf: sShift(whirlSDF(g, 0.009), C - size / 2, C - size / 2),
          cell: 3.2, falloff: 6, grain: 0.14, angle: 15, seed: 3, color: INK.blu })
      + place(0, 0, screen({ x: C - 30, y: C - 30, w: 60, h: 60, sdf: sp,
          cell: 2.2, falloff: 4, angle: 15, seed: 9, color: INK.blu })),
      `rotate(-7 ${C} ${C})`) };
});

/* 112 — twelve exposures, and the hand tightening at random between them. */
plate("112-planche-vortex", 900, 700, (r) => {
  const out = [];
  /* the sheet is toner; the two spot passes are drawn for, not stumbled on */
  const spot = [Math.floor(r() * 12), Math.floor(r() * 12)];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {
    const x = 30 + i * 212, y = 30 + j * 214, s = 190;
    const g = sunGeom({ size: s, seed: 112 + i * 7 + j * 23, rays: 18 + Math.floor(r() * 20),
      disc: 0.17 + r() * 0.08, short: 0.3, long: 0.45 });
    const t = j * 4 + i;
    const col = t === spot[0] ? INK.blu : (t === spot[1] ? INK.fluo : INK.black);
    out.push(place(x, y, screen({ x: 0, y: 0, w: s, h: s,
      sdf: whirlSDF(g, (r() - 0.4) * 0.028),
      cell: 2.4 + r() * 3.4, falloff: 4 + r() * 10, spread: 0.44 + r() * 0.2,
      grain: 0.12 + r() * 0.2, angle: r() * 90, seed: 3 + Math.floor(r() * 50), color: col }))
      + frame(x, y, s, s, INK.black, 0.7));
  }
  return { body: out.join("") };
});

/* 113 — the shell. Not screened: one line with a hand on it, and the walls
   it left behind each time it came round. */
plate("113-coquille", 640, 640, (r) => {
  const C = 320, B = 0.205, TURNS = 2.75;
  const T = TURNS * Math.PI * 2, A = 248 / Math.exp(B * T);   /* fits the sheet */
  const R = (t) => A * Math.exp(B * t), walls = [];
  for (let t = 0.3; t < T - Math.PI * 2; t += 0.44) {
    const r0 = R(t), r1 = R(t + Math.PI * 2), m = (r0 + r1) * 0.52;
    walls.push(`<path d="M ${n(C + Math.cos(t) * r0)} ${n(C + Math.sin(t) * r0)} `
      + `Q ${n(C + Math.cos(t + 0.2) * m)} ${n(C + Math.sin(t + 0.2) * m)} `
      + `${n(C + Math.cos(t) * r1)} ${n(C + Math.sin(t) * r1)}"/>`);
  }
  return { body:
    G(INK.black, 0.9, walls.join(""))
    + G(INK.black, 3.4, spiralPath(C, C, { a: A, b: B, turns: TURNS, step: 7, hand: 2.6, rand: r }))
    + G(INK.black, 1.1, spiralPath(C, C, { a: A * 1.3, b: B, turns: TURNS - 0.42, step: 7, hand: 2.2, rand: r }))
    + swipe(96, 486, 300, 40, -4, r, INK.fluo)
    + G(INK.black, 1.1, brackets(64, 64, 512, 512, 30) + axes(C, C, 244, 4, 0, r)) };
});

/* 114 — phases. One turn more each time, until what started as a ray is a
   closed thing with nothing getting out. */
plate("114-phases-spirale", 1020, 260, () => {
  const out = [];
  for (let i = 0; i < 5; i++) {
    const x = 30 + i * 194, s = 176, C = s / 2;
    const b = 0.30 - i * 0.042, T = (1.6 + i * 0.75) * Math.PI * 2;
    const sp = sSpiral(C, C, { a: 72 / Math.exp(b * T), b, turns: 1.6 + i * 0.75,
      w: (rr) => Math.max(2.6, rr * (0.2 - i * 0.02)) });   /* same reach, more turn */
    out.push(place(x, 42, screen({ x: 0, y: 0, w: s, h: s, sdf: sp,
      cell: 3, falloff: 6.5, spread: 0.5, angle: 15, seed: 3 + i, color: INK.black }))
      + frame(x, 42, s, s, INK.black, 0.7));
  }
  return { body: out.join("") + G(INK.black, 1.1, `<line x1="30" y1="238" x2="990" y2="238"/>`) };
});

/* 115 — the roll. Sun, seed head or spiral, and how hard it is turned, all
   left to the seed. */
plate("115-rouleau-spirale", 820, 1140, (r) => {
  const bg = pick(r, [INK.white, INK.fluo, INK.black]);
  const fg = bg === INK.black ? INK.white : INK.black;
  const acc = bg === INK.black ? INK.fluo : (bg === INK.fluo ? INK.blu : INK.fluo);
  const size = 460 + r() * 460;
  const tx = -size * 0.15 + (820 - size * 0.7) * r();   /* bleeds sideways only */
  const ty = 40 + Math.max(0, 1080 - size) * r();
  const k = (r() - 0.32) * 0.026;
  let sym;
  const roll = r();
  if (roll > 0.62) {                                    /* the sun, wound */
    const g = sunGeom({ size, seed: 215 + Math.floor(r() * 60), rays: 20 + Math.floor(r() * 20),
      disc: 0.16 + r() * 0.08, short: 0.28 + r() * 0.08, long: 0.42 + r() * 0.07 });
    sym = r() > 0.5 ? place(tx, ty, whirlSolid(g, fg, k))
      : print(whirlSDF(g, k), tx, ty, 820, 1140, { cell: 3.4 + r() * 4.4, falloff: 7 + r() * 10,
          spread: 0.48 + r() * 0.2, grain: 0.18 + r() * 0.14, angle: r() * 90,
          seed: 3 + Math.floor(r() * 40), color: fg });
  } else if (roll > 0.3) {                              /* the seed head */
    const pts = phylloPts(tx + size / 2, ty + size / 2, 160 + Math.floor(r() * 220),
      { c: size * 0.036, r0: size * 0.008, r1: size * 0.026 });
    sym = print(sPts(pts), 0, 0, 820, 1140, { cell: 3.2 + r() * 3.2, falloff: 5 + r() * 6,
      spread: 0.5 + r() * 0.16, grain: 0.14 + r() * 0.14, angle: r() * 90,
      seed: 3 + Math.floor(r() * 40), color: fg });
  } else {                                              /* the bare curve */
    const b = (r() > 0.5 ? 1 : -1) * (0.15 + r() * 0.12);
    sym = print(sSpiral(tx + size / 2, ty + size / 2,
      { a: 6 + r() * 6, b, turns: 2.4 + r() * 2, w: (rr) => Math.max(3, rr * (0.1 + r() * 0.12)) }),
      0, 0, 820, 1140, { cell: 3.6 + r() * 3.6, falloff: 6 + r() * 8, spread: 0.5 + r() * 0.16,
        grain: 0.16, angle: r() * 90, seed: 3 + Math.floor(r() * 40), color: fg });
  }
  const body = [];
  for (let i = 0; i < 1 + Math.floor(r() * 2.2); i++) {
    const bw = 260 + r() * 400, bh = 220 + r() * 400;
    body.push(brackets((820 - bw) * r(), 70 + (1140 - bh - 160) * r(), bw, bh, 18 + r() * 20));
  }
  if (r() > 0.5) body.push(axes(130 + r() * 560, 220 + r() * 700, 150 + r() * 200, 3 + Math.floor(r() * 4), 0, r));
  if (r() > 0.55) body.push(polar(150 + r() * 520, 250 + r() * 640, 90 + r() * 110,
    2 + Math.floor(r() * 3), 12 + Math.floor(r() * 16), 0, r));
  if (r() > 0.5) body.push(spiralPath(120 + r() * 580, 240 + r() * 660,
    { a: 4 + r() * 5, b: 0.2 + r() * 0.1, turns: 1.6 + r() * 2, hand: 2.4, rand: r }));
  const sw = [];
  for (let i = 0; i < Math.floor(r() * 3); i++) {
    sw.push(swipe(10 + r() * 120, 140 + r() * 820, 420 + r() * 380, 38 + r() * 46, (r() - 0.5) * 9, r, acc));
  }
  return { bg, ink: fg, body: sw.join("") + sym + G(fg, n(1 + r() * 1.3), body.join("")) };
});

run(__dirname, P);
