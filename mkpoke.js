/* MINOR INDEX — the borrowed body.
 *
 * Something that was never drawn for this identity, run through the same
 * press as everything else: logo/pokemon.png, screened at the pitch and
 * spread of plate 78, where the copier is hot and the dots have grown into
 * each other. Nothing here is redrawn by hand — the image is decoded in
 * _raster.js and only ever asked how much ink it would hold.
 *
 *   node logo/mkpoke.js              node logo/mkpoke.js --only 96
 */
const path = require("path");
const S = require("./_sheet.js");
const { readPNG, screenImage, bbox } = require("./_raster.js");
const { INK, run } = S;

const IMG = readPNG(path.join(__dirname, "pokemon.png"));
/* the levels that hold this particular body: the gloves stay light, the
   trunk goes to three quarters, the spiral and the eyes go solid */
const LV = { lo: 0.12, hi: 0.72, gamma: 0.95 };
/* frame the body, not the canvas it was rendered on */
const box = { img: IMG, src: bbox(IMG), x: -18, y: -6, w: 676, h: 652 };
const P = [];
/* `seed` pins the roll a plate was kept from; see run() in _sheet.js */
const plate = (name, w, h, draw, seed) => P.push({ name, w, h, draw, seed });

/* 95 — plate 78's screen, on a body that is not ours. */
plate("95-pokemon-surexpose", 640, 640, () => ({
  body: screenImage(Object.assign({}, box, LV,
    { cell: 6.6, angle: 15, spread: 0.68, grain: 0.24, soft: 0.8, seed: 5, color: INK.black })),
}));

/* 96 — the same pass, knocked out of the toner. */
plate("96-pokemon-negatif", 640, 640, () => ({
  bg: INK.black, ink: INK.white,
  body: screenImage(Object.assign({}, box, LV,
    { cell: 5.4, angle: 75, spread: 0.6, grain: 0.18, soft: 0.8, seed: 9, color: INK.white })),
}));

/* 97 — two plates, out of register: blu at 75°, toner at 15°. */
plate("97-pokemon-hors-registre", 640, 640, () => ({
  body: screenImage(Object.assign({}, box, LV,
      { x: box.x - 7, y: box.y + 5, cell: 5, angle: 75, spread: 0.5, grain: 0.14,
        soft: 0.8, seed: 3, color: INK.blu }))
    + screenImage(Object.assign({}, box, LV,
      { cell: 5, angle: 15, spread: 0.52, grain: 0.14, soft: 0.8, seed: 7, color: INK.black })),
}));

/* 98, 99 — the same two, cut out: no ground, no corner marks, and the field
   grain turned down so nothing floats loose outside the body. Drop them on
   whatever colour you like. */
plate("98-pokemon-detoure", 640, 640, () => ({
  bg: null, trim: false,
  body: screenImage(Object.assign({}, box, LV,
    { cell: 6.6, angle: 15, spread: 0.68, grain: 0.08, min: 0.05, soft: 0.8,
      seed: 5, color: INK.black })),
}));

plate("99-pokemon-detoure-blanc", 640, 640, () => ({
  bg: null, trim: false,
  body: screenImage(Object.assign({}, box, LV,
    { cell: 5.4, angle: 75, spread: 0.6, grain: 0.08, min: 0.05, soft: 0.8,
      seed: 9, color: INK.white })),
}));

run(__dirname, P);
