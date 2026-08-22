/* MINOR INDEX — AUTOPHAGIE. Plates 116–131, and not a word on any of them.
 *
 * SOLEIL was a body that spends everything. SPIRALE was that spending turned
 * back on itself. This is what the turn costs: the body starts on its own
 * edge. Nothing new is drawn — the cell and the sun again, under the four
 * things a press already does to a form and this batch finally names:
 *
 *   sGrow    weight gained and lost — a printer's spread and choke
 *   sSmooth  two bodies over-inked until they have one contour
 *   sBite    a mouth taken out of a body at its own edge, found by `contour`
 *   sMorph   one body arriving at another
 *
 * And the cell goes through the copier for the first time. It has been cut
 * solid on every plate since 23; the rules always said print it the way 08
 * was printed, and `cellSDF` is what that took.
 *
 *   node logo/mkautophagie.js                  all of them
 *   node logo/mkautophagie.js 5150             reroll the seeded ones
 *   node logo/mkautophagie.js --only 122,129   just these
 */
const S = require("./_sheet.js");
const Y = require("./_glyphs.js");
const { INK, n, rng, pick, axes, brackets, polar, swipe, G, place, run,
        ticks, reg, band, frame, print, mouths } = S;
const { cell, sunGeom, sunSolid, sunSDF, screen, cellGeom, cellSDF, phylloPts, sPts,
        sDisc, sRing, sUnion, sSub, sShift, sTwist, sGrow, sSmooth, sMorph,
        sWobble, contour, sBite } = Y;

const P = [];
const plate = (name, w, h, draw) => P.push({ name, w, h, draw });

const circ = (cx, cy, r, color, sw) =>
  G(color, sw || 1.2, `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none"/>`);

/* 116 — the mouth. Another body came in at the edge, was taken in, and what
   is left of the meeting is the hole it kept. */
plate("116-bouche", 640, 640, () => {
  const g = sunGeom({ size: 560, seed: 116, rays: 30, disc: 0.22, short: 0.32, long: 0.46 });
  const sun = sShift(sunSDF(g), 40, 40);
  const other = sDisc(430, 250, 132);
  return { body:
    print(sSub(sSmooth(sun, other, 46), sGrow(other, -9)), 0, 0, 640, 640,
      { cell: 4.4, falloff: 9, spread: 0.56, grain: 0.18, angle: 15, seed: 5, color: INK.black })
    + circ(430, 250, 132, INK.black, 1) };
});

/* 117 — the seed head, eaten at the rim. Bitten where it ended, so the bites
   are the shape of its ending. */
plate("117-morsures", 760, 760, (r) => {
  const pts = phylloPts(380, 380, 300, { c: 17, r0: 4, r1: 13 });
  const head = sPts(pts);
  return { bg: INK.black, ink: INK.white, body:
    print(sBite(head, mouths(head, 380, 380, 360, 9, 62, r)), 0, 0, 760, 760,
      { cell: 4, falloff: 6.5, spread: 0.54, grain: 0.16, angle: 75, seed: 9, color: INK.white })
    + ticks(380, 380, 348, 28, 6, INK.white) };
});

/* 118 — the fonte. The same body, less of it each time: the rays go, then
   the rim, then everything but the kernel. */
plate("118-fonte", 1020, 300, () => {
  const out = [];
  for (let i = 0; i < 5; i++) {
    const x = 30 + i * 194, s = 176;
    const g = sunGeom({ size: s, seed: 118, rays: 28, disc: 0.23, short: 0.33, long: 0.46 });
    out.push(place(x, 62, screen({ x: 0, y: 0, w: s, h: s, sdf: sGrow(sunSDF(g), -i * i * 1.75),   /* the loss accelerates */
      cell: 3, falloff: 6.5, spread: 0.5, grain: 0.16, angle: 15, seed: 3 + i, color: INK.black }))
      + frame(x, 62, s, s, INK.black, 0.7)
      + band(x, 262, s * (1 - i * 0.2), 6, i === 4 ? INK.blu : INK.black));
  }
  return { body: out.join("") };
});

/* 119 — the choke and the spread. One body, two plates: the blu let out a
   little, the toner pulled in a little, and the rim between them is the
   whole of the difference. */
plate("119-etranglement", 700, 700, () => {
  const g = sunGeom({ size: 540, seed: 119, rays: 26, disc: 0.24, short: 0.33, long: 0.46 });
  const f = sShift(sunSDF(g), 80, 80);
  return { body:
    print(sGrow(f, 9), 0, 0, 700, 700,
      { cell: 4.4, falloff: 9, spread: 0.54, grain: 0.12, angle: 75, seed: 3, color: INK.blu })
    + print(sGrow(f, -5), 0, 0, 700, 700,
      { cell: 4.4, falloff: 9, spread: 0.5, grain: 0.12, angle: 15, seed: 7, color: INK.black })
    + reg(60, 60, 10, INK.blu) + reg(640, 640, 10, INK.black) };
});

/* 120 — two bodies, one contour. Held together long enough at the copier
   and there is no longer a question of which is eating which. */
plate("120-deux-corps", 760, 760, () => {
  const g = sunGeom({ size: 460, seed: 120, rays: 26, disc: 0.22, short: 0.32, long: 0.45 });
  const cg = cellGeom({ size: 420, seed: 23, sat: 4 });
  const a = sShift(sunSDF(g), 90, 130);
  const b = sShift(cellSDF(cg), 300, 250);
  return { body:
    print(sSmooth(a, b, 54), 0, 0, 760, 760,
      { cell: 6.4, falloff: 14, spread: 0.66, grain: 0.24, angle: 15, seed: 5, color: INK.black }) };
});

/* 121 — the rest. Only what was taken prints; the body it was taken out of
   is a line, and not a dark one. */
plate("121-le-reste", 640, 760, (r) => {
  const g = sunGeom({ size: 480, seed: 121, rays: 30, disc: 0.23, short: 0.32, long: 0.46 });
  const f = sShift(sunSDF(g), 80, 120);
  const m = mouths(sGrow(f, 14), 320, 360, 280, 15, 40, r);   /* the edge, closed */
  const bites = sUnion(...m.map((p) => sDisc(p.x, p.y, p.r0)));
  return { body:
    print(sSub(bites, sGrow(f, -2)), 0, 0, 640, 700,
      { cell: 3.8, falloff: 7, spread: 0.56, grain: 0.16, angle: 15, seed: 11, color: INK.black })
    + G(INK.black, 0.7, m.map((p) =>
        `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(p.r0)}" fill="none"/>`).join(""))
    + band(60, 700, 520, 22, INK.fluo) };
});

/* 122 — the cell, printed. Cut solid on every plate since 23; here it is
   through the copier at last, run hot, the filaments closed up. */
plate("122-cellule-imprimee", 820, 820, () => {
  const cg = cellGeom({ size: 900, seed: 23, sat: 5 });
  const f = sWobble(sShift(cellSDF(cg), -40, -40), 7, 46, 122);
  return { body: print(f, 0, 0, 820, 820,
    { cell: 7, falloff: 15, spread: 0.68, grain: 0.26, angle: 15, seed: 5, color: INK.black }) };
});

/* 123 — one body arriving at the other. Five steps, and the middle three
   are neither. */
plate("123-metamorphose", 1020, 300, () => {
  const out = [];
  for (let i = 0; i < 5; i++) {
    const x = 30 + i * 194, s = 176;
    const g = sunGeom({ size: s, seed: 123, rays: 26, disc: 0.22, short: 0.32, long: 0.46 });
    const cg = cellGeom({ size: s, seed: 23, sat: 4 });
    out.push(place(x, 62, screen({ x: 0, y: 0, w: s, h: s,
      sdf: sMorph(sunSDF(g), cellSDF(cg), i / 4),
      cell: 3, falloff: 6.5, spread: 0.52, grain: 0.16, angle: 15, seed: 3 + i, color: INK.black }))
      + frame(x, 62, s, s, INK.black, 0.7));
  }
  return { body: out.join("") + G(INK.black, 1.1, `<line x1="30" y1="278" x2="990" y2="278"/>`) };
});

/* 124 — the poster. A body at the size ink costs, with its mouth on itself. */
plate("124-affiche-autophagie", 820, 1140, (r) => {
  const g = sunGeom({ size: 1020, seed: 124, rays: 34, disc: 0.2, short: 0.3, long: 0.46 });
  const f = sShift(sunSDF(g), -100, -220);
  const cg = cellGeom({ size: 190, seed: 41, sat: 4 });
  return { bg: INK.fluo, body:
    print(sBite(f, mouths(f, 410, 290, 480, 7, 96, r)), 0, 0, 820, 1140,
      { cell: 5.4, falloff: 13, spread: 0.6, grain: 0.24, angle: 15, seed: 7, color: INK.black })
    + band(0, 940, 820, 200, INK.black)
    + place(60, 946, screen({ x: 0, y: 0, w: 190, h: 190, sdf: cellSDF(cg),
        cell: 3.4, falloff: 7, angle: 75, seed: 5, color: INK.fluo }))
    + ticks(660, 1040, 70, 12, 7, INK.fluo) };
});

/* 125 — the field, and every one of them has started. */
plate("125-champ-de-morsures", 900, 640, (r) => {
  const out = [], marks = [];
  for (let i = 0; i < 14; i++) {
    const s = 66 + r() * 116;
    const x = (i % 4) * 225 + 112 - s / 2 + (r() - 0.5) * 120;
    const y = Math.floor(i / 4) * 168 + 90 - s / 2 + (r() - 0.5) * 90;
    const col = r() > 0.9 ? INK.fluo : (r() > 0.83 ? INK.blu : INK.white);
    const g = sunGeom({ size: s, seed: 125 + i * 13, rays: 14 + Math.floor(r() * 16),
      disc: 0.2 + r() * 0.06, short: 0.3, long: 0.45 });
    const f = sunSDF(g);
    out.push(place(x, y, screen({ x: 0, y: 0, w: s, h: s,
      sdf: sBite(f, mouths(f, s / 2, s / 2, s * 0.5, 2 + Math.floor(r() * 3), s * 0.13, r)),
      cell: 2 + r() * 1.8, falloff: 3 + r() * 5, spread: 0.5, angle: r() * 90,
      seed: 3 + i, color: col })));
  }
  for (let i = 0; i < 54; i++) {
    const x = r() * 900, y = r() * 640, L2 = 4 + r() * 8;
    marks.push(r() > 0.5 ? `<line x1="${n(x)}" y1="${n(y - L2)}" x2="${n(x)}" y2="${n(y + L2)}"/>`
                         : `<line x1="${n(x - L2)}" y1="${n(y)}" x2="${n(x + L2)}" y2="${n(y)}"/>`);
  }
  return { bg: INK.black, ink: INK.white, body: G(INK.white, 0.7, marks.join("")) + out.join("") };
});

/* 126 — the seal, with a piece out of it. Applied anyway. */
plate("126-sceau-mordu", 560, 560, (r) => {
  const C = 280, size = 250;
  const g = sunGeom({ size, seed: 126, rays: 24, disc: 0.24, short: 0.33, long: 0.46 });
  const f = sShift(sunSDF(g), C - size / 2, C - size / 2);
  const bite = sDisc(C + 150, C + 96, 104);
  return { body: swipe(28, 398, 504, 58, -5, r, INK.fluo)
    + place(0, 0,
      G(INK.blu, 6, `<path d="M ${n(C + 212)} ${n(C)} A 212 212 0 1 1 ${n(C - 84)} ${n(C - 194)}" fill="none"/>`)
      + G(INK.blu, 1.6, `<circle cx="${C}" cy="${C}" r="188" fill="none"/>`)
      + ticks(C, C, 154, 30, 6, INK.blu)
      + screen({ x: 30, y: 30, w: 500, h: 500, sdf: sSub(f, bite),
          cell: 3.2, falloff: 6, grain: 0.14, angle: 15, seed: 3, color: INK.blu }),
      `rotate(-7 ${C} ${C})`) };
});

/* 127 — twelve exposures of one appetite: choked, spread, wobbled, bitten,
   and two of them printed on the wrong plate. */
plate("127-planche-digestion", 900, 700, (r) => {
  const out = [];
  const spot = [Math.floor(r() * 12), Math.floor(r() * 12)];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {
    const x = 30 + i * 212, y = 30 + j * 214, s = 190, t = j * 4 + i;
    const g = sunGeom({ size: s, seed: 127 + t * 9, rays: 20 + Math.floor(r() * 14),
      disc: 0.21 + r() * 0.05, short: 0.31, long: 0.45 });
    let f = sGrow(sunSDF(g), -6 + t * 1.6);              /* choke → spread */
    if (r() > 0.55) f = sWobble(f, 3 + r() * 6, 20 + r() * 30, 3 + t);
    if (r() > 0.5) f = sBite(f, mouths(f, s / 2, s / 2, s * 0.5, 2, s * 0.12, r));
    const col = t === spot[0] ? INK.blu : (t === spot[1] ? INK.fluo : INK.black);
    out.push(place(x, y, screen({ x: 0, y: 0, w: s, h: s, sdf: f,
      cell: 2.6 + r() * 2.6, falloff: 5 + r() * 7, spread: 0.46 + r() * 0.18,
      grain: 0.12 + r() * 0.16, angle: r() * 90, seed: 3 + t * 5, color: col }))
      + frame(x, y, s, s, INK.black, 0.7));
  }
  return { body: out.join("") };
});

/* 128 — the kernel. Everything that could be spent has been; what is left
   is small, solid, and still throwing light it cannot afford. */
plate("128-noyau", 700, 700, () => {
  const k = sDisc(350, 350, 26);
  return { bg: INK.black, ink: INK.white, body:
    print(k, 0, 0, 700, 700,
      { cell: 5, falloff: 250, spread: 0.5, grain: 0.22, angle: 15, seed: 5, color: INK.white })
    + `<circle cx="350" cy="350" r="26" fill="${INK.white}"/>`
    + ticks(350, 350, 300, 4, 9, INK.fluo) };
});

/* 129 — the lace. Bitten so many times over that the body is what the bites
   left between them. */
plate("129-dentelle", 760, 760, () => {
  const g = sunGeom({ size: 700, seed: 129, rays: 30, disc: 0.24, short: 0.34, long: 0.47 });
  const f = sShift(sunSDF(g), 30, 30);
  const holes = phylloPts(380, 380, 430, { c: 15.5, r0: 6, r1: 13.5 });
  return { bg: INK.black, ink: INK.white, body:
    print(sSub(sGrow(f, 20), sPts(holes, 1.5)), 0, 0, 760, 760,
      { cell: 3.4, falloff: 6, spread: 0.52, grain: 0.14, angle: 75, seed: 7, color: INK.white }) };
});

/* 130 — swallowed. A body inside a body, showing through as the hole it is. */
plate("130-avalee", 640, 760, (r) => {
  const cg = cellGeom({ size: 520, seed: 55, sat: 5 });
  const host = sWobble(sShift(sGrow(cellSDF(cg), 26), 60, 110), 9, 60, 130);
  const g = sunGeom({ size: 210, seed: 230, rays: 22, disc: 0.24, short: 0.33, long: 0.46 });
  const eaten = sShift(sunSDF(g), 232, 268);
  return { bg: INK.black, ink: INK.white, body:
    swipe(24, 620, 590, 66, -3, r, INK.blu)
    + print(sSub(host, sGrow(eaten, 4)), 0, 0, 640, 760,
      { cell: 4.6, falloff: 10, spread: 0.6, grain: 0.2, angle: 15, seed: 9, color: INK.white })
    + circ(337, 373, 105, INK.fluo, 1.2) };
});

/* 131 — the roll. Which body, what took hold of it, and how much of it is
   left, all decided by the seed. */
plate("131-rouleau-autophagie", 820, 1140, (r) => {
  const bg = pick(r, [INK.white, INK.fluo, INK.black]);
  const fg = bg === INK.black ? INK.white : INK.black;
  const acc = bg === INK.black ? INK.fluo : (bg === INK.fluo ? INK.blu : INK.fluo);
  const size = 480 + r() * 440;
  const tx = -size * 0.14 + (820 - size * 0.72) * r();
  const ty = 40 + Math.max(0, 1080 - size) * r();
  const cx = tx + size / 2, cy = ty + size / 2;
  let f;
  const which = r();
  if (which > 0.6) {
    const g = sunGeom({ size, seed: 231 + Math.floor(r() * 60), rays: 20 + Math.floor(r() * 18),
      disc: 0.18 + r() * 0.08, short: 0.3, long: 0.44 + r() * 0.05 });
    f = sShift(sunSDF(g), tx, ty);
  } else if (which > 0.3) {
    const cg = cellGeom({ size, seed: 20 + Math.floor(r() * 60), sat: 3 + Math.floor(r() * 4) });
    f = sShift(cellSDF(cg), tx, ty);
  } else {
    f = sPts(phylloPts(cx, cy, 140 + Math.floor(r() * 200),
      { c: size * 0.038, r0: size * 0.008, r1: size * 0.026 }));
  }
  if (r() > 0.4) f = sGrow(f, -8 + r() * 26);                    /* choked or let out */
  if (r() > 0.45) f = sWobble(f, 4 + r() * 9, 24 + r() * 40, 3 + Math.floor(r() * 90));
  if (r() > 0.35) f = sBite(f, mouths(f, cx, cy, size * 0.5, 3 + Math.floor(r() * 6), size * 0.09, r));
  if (r() > 0.7) f = sTwist(f, cx, cy, (r() - 0.5) * 0.012);     /* SPIRALE gets a say */
  const sym = print(f, 0, 0, 820, 1140, { cell: 3.6 + r() * 4, falloff: 7 + r() * 10,
    spread: 0.48 + r() * 0.2, grain: 0.16 + r() * 0.14, angle: r() * 90,
    seed: 3 + Math.floor(r() * 40), color: fg });
  const body = [];
  for (let i = 0; i < 1 + Math.floor(r() * 2.2); i++) {
    const bw = 260 + r() * 400, bh = 220 + r() * 400;
    body.push(brackets((820 - bw) * r(), 70 + (1140 - bh - 160) * r(), bw, bh, 18 + r() * 20));
  }
  if (r() > 0.5) body.push(axes(130 + r() * 560, 220 + r() * 700, 150 + r() * 200, 3 + Math.floor(r() * 4), 0, r));
  if (r() > 0.6) body.push(polar(150 + r() * 520, 250 + r() * 640, 90 + r() * 110,
    2 + Math.floor(r() * 3), 12 + Math.floor(r() * 16), 0, r));
  const sw = [];
  for (let i = 0; i < Math.floor(r() * 3); i++) {
    sw.push(swipe(10 + r() * 120, 140 + r() * 820, 420 + r() * 380, 38 + r() * 46, (r() - 0.5) * 9, r, acc));
  }
  return { bg, ink: fg, body: sw.join("") + sym + G(fg, n(1 + r() * 1.3), body.join("")) };
});

run(__dirname, P);
