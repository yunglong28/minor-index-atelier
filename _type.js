/* MINOR INDEX — lettering without a font.
 *
 * No <text> element ever leaves these files: a system font is a decision
 * made by whatever machine opens the SVG, and that is not a decision the
 * mark can afford. The alphabet is a 5×7 field, rendered with the same dots
 * as the mark itself (or as blocks, when it needs to shout).
 */

const F = {
  A: "01110,10001,10001,11111,10001,10001,10001",
  B: "11110,10001,10001,11110,10001,10001,11110",
  C: "01110,10001,10000,10000,10000,10001,01110",
  D: "11100,10010,10001,10001,10001,10010,11100",
  E: "11111,10000,10000,11110,10000,10000,11111",
  F: "11111,10000,10000,11110,10000,10000,10000",
  G: "01110,10001,10000,10111,10001,10001,01111",
  H: "10001,10001,10001,11111,10001,10001,10001",
  I: "11111,00100,00100,00100,00100,00100,11111",
  J: "00111,00010,00010,00010,00010,10010,01100",
  K: "10001,10010,10100,11000,10100,10010,10001",
  L: "10000,10000,10000,10000,10000,10000,11111",
  M: "10001,11011,10101,10101,10001,10001,10001",
  N: "10001,11001,10101,10011,10001,10001,10001",
  O: "01110,10001,10001,10001,10001,10001,01110",
  P: "11110,10001,10001,11110,10000,10000,10000",
  Q: "01110,10001,10001,10001,10101,10010,01101",
  R: "11110,10001,10001,11110,10100,10010,10001",
  S: "01111,10000,10000,01110,00001,00001,11110",
  T: "11111,00100,00100,00100,00100,00100,00100",
  U: "10001,10001,10001,10001,10001,10001,01110",
  V: "10001,10001,10001,10001,10001,01010,00100",
  W: "10001,10001,10001,10101,10101,11011,01010",
  X: "10001,10001,01010,00100,01010,10001,10001",
  Y: "10001,10001,01010,00100,00100,00100,00100",
  Z: "11111,00001,00010,00100,01000,10000,11111",
  0: "01110,10011,10011,10101,11001,11001,01110",
  1: "00100,01100,00100,00100,00100,00100,01110",
  2: "01110,10001,00001,00110,01000,10000,11111",
  3: "11111,00010,00100,00010,00001,10001,01110",
  4: "00010,00110,01010,10010,11111,00010,00010",
  5: "11111,10000,11110,00001,00001,10001,01110",
  6: "00110,01000,10000,11110,10001,10001,01110",
  7: "11111,00001,00010,00100,01000,01000,01000",
  8: "01110,10001,10001,01110,10001,10001,01110",
  9: "01110,10001,10001,01111,00001,00010,01100",
  " ": "00000,00000,00000,00000,00000,00000,00000",
  ".": "00000,00000,00000,00000,00000,01100,01100",
  ",": "00000,00000,00000,00000,01100,01100,11000",
  ":": "00000,01100,01100,00000,01100,01100,00000",
  "-": "00000,00000,00000,11111,00000,00000,00000",
  "·": "00000,00000,01100,01100,00000,00000,00000",
  "/": "00001,00010,00010,00100,01000,01000,10000",
  "#": "01010,11111,01010,01010,11111,01010,00000",
  "%": "11001,11010,00010,00100,01000,01011,10011",
  "?": "01110,10001,00001,00110,00100,00000,00100",
  "!": "00100,00100,00100,00100,00100,00000,00100",
  "°": "01100,10010,01100,00000,00000,00000,00000",
  "(": "00010,00100,01000,01000,01000,00100,00010",
  ")": "01000,00100,00010,00010,00010,00100,01000",
  "+": "00000,00100,00100,11111,00100,00100,00000",
  "=": "00000,00000,11111,00000,11111,00000,00000",
  "×": "00000,10001,01010,00100,01010,10001,00000",
};
const rows = (ch) => (F[ch] || F["?"]).split(",");
const n = (v) => Number(v.toFixed(2));

/** width of a string at a given cell size (5 wide + 1 gap per glyph) */
const textWidth = (s, cell, track = 1) => s.length * (5 + track) * cell - track * cell;
/** the cell size that makes a string exactly this wide — layout, not guesswork */
const fitCell = (s, maxW, track = 1) => maxW / (s.length * (5 + track) - track);
/** left edge for a centred string */
const centerX = (s, cell, W, track = 1) => (W - textWidth(s, cell, track)) / 2;
/** left edge for a string ending at x */
const rightX = (s, cell, x, track = 1) => x - textWidth(s, cell, track);

/**
 * Letters made of the same screen as the mark.
 * degrade 0..1 drops dots and scatters them: generation loss, on the type.
 */
function dotText(s, x, y, cell, opts) {
  const o = Object.assign({
    color: "#141410", r: 0.42, jitter: 0.1, degrade: 0, track: 1, seed: 5,
  }, opts);
  let sd = o.seed;
  const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  const out = [];
  const S = s.toUpperCase().split("");
  for (let ci = 0; ci < S.length; ci++) {
    const g = rows(S[ci]);
    for (let ry = 0; ry < 7; ry++) {
      for (let cx = 0; cx < 5; cx++) {
        if (g[ry][cx] !== "1") continue;
        if (o.degrade && rnd() < o.degrade * 0.55) continue;
        const jx = (rnd() - 0.5) * cell * (o.jitter + o.degrade * 0.9);
        const jy = (rnd() - 0.5) * cell * (o.jitter + o.degrade * 0.9);
        const px = x + ci * (5 + o.track) * cell + cx * cell + jx;
        const py = y + ry * cell + jy;
        const rr = cell * o.r * (1 - o.degrade * 0.25 + (rnd() - 0.5) * 0.2);
        if (rr < 0.12) continue;
        out.push(`<circle cx="${n(px)}" cy="${n(py)}" r="${n(rr)}"/>`);
      }
    }
  }
  return `<g fill="${o.color}">${out.join("")}</g>`;
}

/** the same alphabet as solid cells, for when it has to carry a headline */
function blockText(s, x, y, cell, opts) {
  const o = Object.assign({ color: "#141410", inset: 0, track: 1, stencil: 0 }, opts);
  const out = [];
  const S = s.toUpperCase().split("");
  for (let ci = 0; ci < S.length; ci++) {
    const g = rows(S[ci]);
    for (let ry = 0; ry < 7; ry++) {
      /* a stencil break: the machine that cut this had to hold the counters */
      if (o.stencil && ry === 3 && ci % 2 === 0) continue;
      for (let cx = 0; cx < 5; cx++) {
        if (g[ry][cx] !== "1") continue;
        const px = x + ci * (5 + o.track) * cell + cx * cell;
        const py = y + ry * cell;
        out.push(`<rect x="${n(px - cell / 2 + o.inset)}" y="${n(py - cell / 2 + o.inset)}" `
          + `width="${n(cell - o.inset * 2)}" height="${n(cell - o.inset * 2)}"/>`);
      }
    }
  }
  return `<g fill="${o.color}">${out.join("")}</g>`;
}

module.exports = { dotText, blockText, textWidth, fitCell, centerX, rightX, F };
