/* MINOR INDEX — the family, written out.
 *
 * Three weights of one drawing. The pen width was always a parameter of the
 * plates, so a weight is not a redraw: it is the same skeleton with a fatter
 * or thinner pen, outlined and packed into a TrueType file.
 *
 *   node logo/mkfont.js            → docs/fonts/MinorIndex-*.ttf
 *
 * The specimen page (web/specimen.html) is maintained by hand and loads these
 * files by name, so it can never describe a font it is not showing.
 */
const fs = require("fs");
const path = require("path");
const F = require("./_font.js");

const WEIGHTS = [
  { style: "Light", weight: 0.075, hand: 0.014 },
  { style: "Regular", weight: 0.12, hand: 0.015 },
  { style: "Bold", weight: 0.19, hand: 0.016 },
];

const dir = path.join(__dirname, "docs", "fonts");
fs.mkdirSync(dir, { recursive: true });

const made = [];
for (const w of WEIGHTS) {
  const r = F.buildTTF({ family: "Minor Index", style: w.style,
                         weight: w.weight, hand: w.hand, seed: 7 });
  const file = path.join(dir, "MinorIndex-" + w.style + ".ttf");
  fs.writeFileSync(file, r.font);
  made.push({ style: w.style, file: "MinorIndex-" + w.style + ".ttf",
              kb: Math.round(r.font.length / 1024), glyphs: r.glyphs,
              codes: Object.keys(r.map).length });
  console.log(`${w.style.padEnd(8)} ${made[made.length - 1].kb}kb  ${r.glyphs} glyphs  `
    + `${Object.keys(r.map).length} codepoints`);
}

/* the specimen page is hand-maintained (web/specimen.html) and loads these
   files by name, so it can never describe a font it is not showing */
console.log("→ docs/specimen.html loads them (open it, or `node logo/mkbundle.js` first)");
