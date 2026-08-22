/* MINOR INDEX — SOLEIL. Plates 77–94, and not a word on any of them.
 *
 * Two rules hold for this batch and everything after it:
 *   · the eight-armed mark is retired. The symbols are the cell (plates
 *     23–25) and the sun, and either one is printed the way 08 and 09 were
 *     printed — over-inked, or knocked out of the toner.
 *   · no lettering. The sheet carries the image and the page furniture, and
 *     nothing that has to be read.
 *
 *   node logo/mksol.js                 all of them
 *   node logo/mksol.js 5150            reroll the seeded ones
 *   node logo/mksol.js --only 85,93    just these
 */
const S = require("./_sheet.js");
const Y = require("./_glyphs.js");
const { INK, n, pick, axes, brackets, polar, swipe, G, place, run,
        ticks, reg, band, frame, print, mouths } = S;
const { cell, sunGeom, sunSolid, sunSDF, screen, sDisc, sSub, sShift } = Y;

const P = [];
const plate = (name, w, h, draw) => P.push({ name, w, h, draw });


/* 77 — the emblem. The sun, and the ring the words used to sit in. */
plate("77-soleil-emblem", 820, 1080, () => {
  const cx = 410, cy = 520, size = 620;
  const g = sunGeom({ size, seed: 77, rays: 30, disc: 0.23, short: 0.34, long: 0.46 });
  return { bg: INK.black, ink: INK.white, body:
    place(cx - size / 2, cy - size / 2, sunSolid(g, INK.white))
    + G(INK.white, 4, `<circle cx="${cx}" cy="${cy}" r="368" fill="none"/>`)
    + G(INK.white, 1.2, `<circle cx="${cx}" cy="${cy}" r="344" fill="none"/>`)
    + ticks(cx, cy, 356, 24, 7, INK.white) };
});

/* 78 — over-inked, full bleed. The copier is running hot and the rays have
   grown into each other: plate 08, without the mark. */
plate("78-soleil-surexpose", 640, 640, () => {
  const size = 760, tx = -60, ty = -150;
  const g = sunGeom({ size, seed: 78, rays: 26, disc: 0.2, short: 0.3, long: 0.44 });
  return { body: print(sunSDF(g), tx, ty, 640, 640,
    { cell: 7.4, falloff: 15, spread: 0.66, grain: 0.26, angle: 15, seed: 5, color: INK.black }) };
});

/* 79 — knocked out, under the instrument: plate 09 and plate 27, in one. */
plate("79-soleil-negatif", 640, 640, (r) => {
  const size = 420, tx = 110, ty = 110;
  const g = sunGeom({ size, seed: 79, rays: 32, disc: 0.22, short: 0.33, long: 0.46 });
  return { bg: INK.black, ink: INK.white, body:
    print(sunSDF(g), tx, ty, 640, 640,
      { cell: 4.2, falloff: 8, spread: 0.5, angle: 75, seed: 9, color: INK.white })
    + G(INK.white, 1.1, axes(320, 320, 250, 4, 0, r)
      + `<ellipse cx="320" cy="320" rx="206" ry="140" fill="none"/>`
      + brackets(70, 84, 500, 472, 30)) };
});

/* 80 — the cell, cut in stock, with a chip of marker at the foot. */
plate("80-cellule", 560, 660, () => ({
  bg: INK.black, ink: INK.white, body:
    place(60, 74, cell({ size: 440, seed: 23, sat: 4, color: INK.white }))
    + band(60, 566, 440, 26, INK.fluo)
    + G(INK.white, 1.2, `<line x1="60" y1="546" x2="500" y2="546"/>`),
}));

/* 81 — the same cell, cut the other way, with the marker pulled across it. */
plate("81-cellule-inverse", 560, 660, (r) => ({
  body: swipe(46, 250, 470, 62, -4, r, INK.fluo)
    + place(60, 74, cell({ size: 440, seed: 23, sat: 4, color: INK.black }))
    + band(60, 566, 440, 26, INK.black)
    + reg(78, 604, 9, INK.blu) + reg(482, 604, 9, INK.blu),
}));

/* 82 — the network: six cells, none of them the centre. */
plate("82-reseau", 900, 640, (r) => {
  const out = [];
  for (let i = 0; i < 6; i++) {                       /* three by two, shaken */
    const s = 150 + r() * 190;
    const cx = 150 + (i % 3) * 300 + (r() - 0.5) * 90;
    const cy = 180 + Math.floor(i / 3) * 280 + (r() - 0.5) * 70;
    out.push(place(cx - s / 2, cy - s / 2,
      cell({ size: s, seed: 23 + i * 11, sat: 3 + Math.floor(r() * 3),
             color: i === 4 ? INK.fluo : INK.white })));
  }
  return { bg: INK.black, ink: INK.white, body: out.join("") };
});

/* 83 — the cell under the instrument. */
plate("83-cellule-instrument", 640, 640, (r) => ({
  body: place(150, 150, cell({ size: 340, seed: 41, sat: 5, color: INK.black }))
    + G(INK.black, 1.2, axes(320, 320, 252, 4, 0, r)
      + `<ellipse cx="320" cy="320" rx="204" ry="136" fill="none"/>`
      + brackets(68, 84, 504, 472, 30)),
}));

/* 84 — five generations. Each tile is the copy of the one before: coarser
   screen, wider fringe, less of it left. */
plate("84-generations", 1020, 300, () => {
  const out = [];
  for (let i = 0; i < 5; i++) {
    const x = 30 + i * 194, s = 176;
    const g = sunGeom({ size: s, seed: 84 + i * 7, rays: 30 - i * 3, disc: 0.22, short: 0.32, long: 0.45 });
    out.push(place(x, 62, screen({ x: 0, y: 0, w: s, h: s, sdf: sunSDF(g),
      cell: 2.6 + i * 1.5, falloff: 6 + i * 2.4, spread: 0.5 + i * 0.05,
      grain: 0.16 + i * 0.12, angle: 15 + i * 9, seed: 3 + i * 5, color: INK.black }))
      + frame(x, 62, s, s, INK.black)
      + band(x, 262, s * (1 - i * 0.18), 6, i === 4 ? INK.blu : INK.black));
  }
  return { body: out.join("") };
});

/* 85 — the eclipse. The dots stop where the other body starts. */
plate("85-eclipse", 760, 760, () => {
  const size = 600, tx = 80, ty = 80;
  const g = sunGeom({ size, seed: 85, rays: 34, disc: 0.21, short: 0.32, long: 0.46 });
  const occ = sDisc(size / 2 + 74, size / 2 - 48, 188);
  return { bg: INK.black, ink: INK.white, body:
    print(sSub(sunSDF(g), occ), tx, ty, 760, 760,
      { cell: 3.6, falloff: 8, spread: 0.5, angle: 15, seed: 11, color: INK.white })
    + G(INK.white, 1.2, `<circle cx="${tx + size / 2 + 74}" cy="${ty + size / 2 - 48}" r="188" fill="none"/>`) };
});

/* 86 — the seal. Applied, not printed, and it says nothing. */
plate("86-sceau", 560, 560, (r) => {
  const C = 280, size = 244;
  const g = sunGeom({ size, seed: 86, rays: 24, disc: 0.24, short: 0.33, long: 0.46 });
  return { body: swipe(30, 402, 500, 56, -5, r, INK.fluo)
    + place(0, 0, G(INK.blu, 6, `<circle cx="${C}" cy="${C}" r="212" fill="none"/>`)
      + G(INK.blu, 1.6, `<circle cx="${C}" cy="${C}" r="188" fill="none"/>`
        + `<circle cx="${C}" cy="${C}" r="120" fill="none"/>`)
      + ticks(C, C, 154, 36, 6, INK.blu)
      + place(C - size / 2, C - size / 2, screen({ x: 0, y: 0, w: size, h: size, sdf: sunSDF(g),
          cell: 3.2, falloff: 6, grain: 0.14, angle: 15, seed: 3, color: INK.blu })),
      `rotate(-7 ${C} ${C})`) };
});

/* 87 — the poster. Ink at the size ink costs. */
plate("87-affiche", 820, 1140, () => {
  const g = sunGeom({ size: 900, seed: 87, rays: 34, disc: 0.2, short: 0.3, long: 0.45 });
  const gs = sunGeom({ size: 190, seed: 187, rays: 22, disc: 0.24, short: 0.33, long: 0.46 });
  return { bg: INK.fluo, body:
    print(sunSDF(g), 300, -300, 820, 1140,
      { cell: 5.2, falloff: 13, spread: 0.58, grain: 0.24, angle: 15, seed: 7, color: INK.black })
    + band(0, 940, 820, 200, INK.black)
    + place(60, 946, screen({ x: 0, y: 0, w: 190, h: 190, sdf: sunSDF(gs),
        cell: 3.4, falloff: 7, angle: 75, seed: 5, color: INK.fluo }))
    + ticks(660, 1040, 70, 12, 7, INK.fluo) };
});

/* 88 — the roll. Sun or cell, palette and composition left to the seed. */
plate("88-rouleau", 820, 1140, (r) => {
  const bg = pick(r, [INK.white, INK.fluo, INK.black]);
  const fg = bg === INK.black ? INK.white : INK.black;
  const acc = bg === INK.black ? INK.fluo : (bg === INK.fluo ? INK.blu : INK.fluo);
  const size = 460 + r() * 420;
  const tx = -size * 0.15 + (820 - size * 0.7) * r();   /* bleeds sideways only */
  const ty = 50 + Math.max(0, 1080 - size) * r();
  let sym;
  if (r() > 0.42) {
    const g = sunGeom({ size, seed: 188 + Math.floor(r() * 60), rays: 20 + Math.floor(r() * 18),
      disc: 0.18 + r() * 0.08, short: 0.28 + r() * 0.08, long: 0.42 + r() * 0.06 });
    sym = r() > 0.5 ? place(tx, ty, sunSolid(g, fg))
      : print(sunSDF(g), tx, ty, 820, 1140, { cell: 3.4 + r() * 4.4, falloff: 7 + r() * 10,
          spread: 0.48 + r() * 0.18, grain: 0.18 + r() * 0.14, angle: r() * 90,
          seed: 3 + Math.floor(r() * 40), color: fg });
  } else {
    sym = place(tx, ty, cell({ size, seed: 20 + Math.floor(r() * 60),
      sat: 3 + Math.floor(r() * 4), color: fg }));
  }
  const body = [];
  for (let i = 0; i < 1 + Math.floor(r() * 2.2); i++) {
    const bw = 260 + r() * 400, bh = 220 + r() * 400;
    body.push(brackets((820 - bw) * r(), 70 + (1140 - bh - 160) * r(), bw, bh, 18 + r() * 20));
  }
  if (r() > 0.5) body.push(axes(130 + r() * 560, 220 + r() * 700, 150 + r() * 200, 3 + Math.floor(r() * 4), 0, r));
  if (r() > 0.62) body.push(polar(150 + r() * 520, 250 + r() * 640, 90 + r() * 110,
    2 + Math.floor(r() * 3), 12 + Math.floor(r() * 16), 0, r));
  const sw = [];
  for (let i = 0; i < Math.floor(r() * 3); i++) {
    sw.push(swipe(10 + r() * 120, 140 + r() * 820, 420 + r() * 380, 38 + r() * 46, (r() - 0.5) * 9, r, acc));
  }
  return { bg, ink: fg, body: sw.join("") + sym + G(fg, n(1 + r() * 1.3), body.join("")) };
});

/* 89 — out of register. One sun, two plates, and the press did not line
   them up: blu at 75°, toner at 15°. */
plate("89-hors-registre", 700, 700, () => {
  const size = 540, g = sunGeom({ size, seed: 89, rays: 28, disc: 0.22, short: 0.32, long: 0.46 });
  const sdf = sunSDF(g);
  return { body:
    print(sShift(sdf, -9, 7), 80, 80, 700, 700,
      { cell: 4.4, falloff: 9, spread: 0.52, angle: 75, seed: 3, color: INK.blu })
    + print(sdf, 80, 80, 700, 700,
      { cell: 4.4, falloff: 9, spread: 0.5, angle: 15, seed: 7, color: INK.black })
    + reg(60, 60, 10, INK.blu) + reg(640, 640, 10, INK.black) };
});

/* 90 — the contact sheet: twelve exposures of one sun, no two screens
   the same. */
plate("90-planche-contact", 900, 700, (r) => {
  const out = [];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {
    const x = 30 + i * 212, y = 30 + j * 214, s = 190;
    const g = sunGeom({ size: s, seed: 90 + i * 7 + j * 23, rays: 18 + Math.floor(r() * 20),
      disc: 0.18 + r() * 0.08, short: 0.3, long: 0.45 });
    const col = r() > 0.88 ? INK.blu : (r() > 0.8 ? INK.fluo : INK.black);
    out.push(place(x, y, screen({ x: 0, y: 0, w: s, h: s, sdf: sunSDF(g),
      cell: 2.4 + r() * 3.4, falloff: 4 + r() * 10, spread: 0.44 + r() * 0.2,
      grain: 0.12 + r() * 0.2, angle: r() * 90, seed: 3 + Math.floor(r() * 50), color: col }))
      + frame(x, y, s, s, INK.black, 0.7));
  }
  return { body: out.join("") };
});

/* 91 — the corona. The body is gone; what it spent is still arriving. */
plate("91-couronne", 700, 700, () => {
  const size = 680, g = sunGeom({ size, seed: 91, rays: 40, disc: 0.16, short: 0.3, long: 0.48 });
  return { bg: INK.black, ink: INK.white, body:
    place(10, 10, sunSolid(g, INK.white, { disc: false }))
    + `<circle cx="350" cy="350" r="62" fill="${INK.fluo}"/>` };
});

/* 92 — superimposed: the cell cut over the sun's screen, one pass each. */
plate("92-superposition", 760, 760, () => {
  const g = sunGeom({ size: 700, seed: 92, rays: 30, disc: 0.2, short: 0.32, long: 0.46 });
  return { body:
    print(sunSDF(g), 30, 30, 760, 760,
      { cell: 4.6, falloff: 11, spread: 0.56, grain: 0.2, angle: 15, seed: 5, color: INK.fluo })
    + place(170, 170, cell({ size: 420, seed: 55, sat: 4, color: INK.black })) };
});

/* 93 — phases. The same sun, occluded a little further each time. */
plate("93-phases", 1020, 260, () => {
  const out = [];
  for (let i = 0; i < 5; i++) {
    const x = 30 + i * 194, s = 176;
    const g = sunGeom({ size: s, seed: 93, rays: 26, disc: 0.24, short: 0.32, long: 0.46 });
    const off = -1.15 + i * 0.62;
    out.push(place(x, 42, screen({ x: 0, y: 0, w: s, h: s,
      sdf: sSub(sunSDF(g), sDisc(s / 2 + off * s * 0.46, s / 2 - 8, s * 0.3)),
      cell: 3, falloff: 6.5, spread: 0.5, angle: 15, seed: 3 + i, color: INK.black }))
      + frame(x, 42, s, s, INK.black, 0.7));
  }
  return { body: out.join("") + G(INK.black, 1.1, `<line x1="30" y1="238" x2="990" y2="238"/>`) };
});

/* 94 — the night field. Sixteen small bodies, most of them faint. */
plate("94-champ-de-nuit", 900, 640, (r) => {
  const out = [], marks = [];
  for (let i = 0; i < 16; i++) {                      /* four by four, shaken */
    const s = 56 + r() * 110;
    const x = (i % 4) * 225 + 112 - s / 2 + (r() - 0.5) * 130;
    const y = Math.floor(i / 4) * 160 + 80 - s / 2 + (r() - 0.5) * 96;
    const col = r() > 0.9 ? INK.fluo : (r() > 0.82 ? INK.blu : INK.white);
    const g = sunGeom({ size: s, seed: 94 + i * 13, rays: 14 + Math.floor(r() * 18),
      disc: 0.18 + r() * 0.08, short: 0.3, long: 0.46 });
    out.push(r() > 0.65
      ? place(x, y, sunSolid(g, col))
      : place(x, y, screen({ x: 0, y: 0, w: s, h: s, sdf: sunSDF(g), cell: 2 + r() * 2,
          falloff: 3 + r() * 6, spread: 0.5, angle: r() * 90, seed: 3 + i, color: col })));
  }
  for (let i = 0; i < 60; i++) {
    const x = r() * 900, y = r() * 640, L2 = 4 + r() * 8;
    marks.push(r() > 0.5 ? `<line x1="${n(x)}" y1="${n(y - L2)}" x2="${n(x)}" y2="${n(y + L2)}"/>`
                         : `<line x1="${n(x - L2)}" y1="${n(y)}" x2="${n(x + L2)}" y2="${n(y)}"/>`);
  }
  return { bg: INK.black, ink: INK.white, body: G(INK.white, 0.7, marks.join("")) + out.join("") };
});

run(__dirname, P);
