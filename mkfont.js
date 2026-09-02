/* MINOR INDEX — the family, written out.
 *
 * One drawing, and the three dials it was always drawn with. The pen, the
 * width and the slant were parameters of the plates long before they were
 * axes of a font, so a weight is not a redraw: it is the same skeleton at a
 * different setting.
 *
 * Seven files come out. `MinorIndex.ttf` is the whole continuum — wght, wdth
 * and slnt, with the axis bent so that asking for 300, 400 and 700 lands
 * exactly on the three weights that were drawn. The three static files are
 * the same three settings cut out of it, for anywhere a variable font is not
 * welcome and for anyone who would rather download 35kb than 230kb.
 *
 * The last three are the presses. The letters are a distance field like every
 * body on a plate, so the screen, the flood and the knock-out are not effects
 * laid over the type — they are the type, printed, and each of them is a font
 * in its own family: set a word in `Minor Index Knockout` and the slabs meet
 * into one band with the word cut out of it.
 *
 *   node logo/mkfont.js            → docs/fonts/
 */
const fs = require("fs");
const path = require("path");
const F = require("./_font.js");

/* the family is declared in _font.js, so mkfont.js and the tests cannot
   disagree about what the three weights are */
const WEIGHTS = F.FAMILY;

const dir = path.join(__dirname, "docs", "fonts");
fs.mkdirSync(dir, { recursive: true });

const made = [];
const V = F.buildVF({ family: "Minor Index" });
fs.writeFileSync(path.join(dir, "MinorIndex.ttf"), V.font);
console.log(`${"Variable".padEnd(8)} ${Math.round(V.font.length / 1024)}kb  ${V.glyphs} glyphs  `
  + F.AXES.map((a) => `${a.tag} ${a.min}\u2013${a.max}`).join("  "));

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

/* the presses. Each is its own family: they are not weights of the cut
   letter, and a font menu that sorted them as weights would hide two of
   them behind the third. */
for (const p of F.PRESSES) {
  const family = "Minor Index " + p.name;
  const r = F.buildTTF({ family: family, cut: p.cut });
  const file = "MinorIndex-" + p.name + ".ttf";
  fs.writeFileSync(path.join(dir, file), r.font);
  made.push({ style: p.name, file: file, kb: Math.round(r.font.length / 1024),
              glyphs: r.glyphs, codes: Object.keys(r.map).length });
  console.log(`${p.name.padEnd(8)} ${Math.round(r.font.length / 1024)}kb  ${r.glyphs} glyphs  `
    + `${p.label} — ${family}`);
}

console.log("→ docs/specimen.html loads them (run `node mkbundle.js` to build the site)");
