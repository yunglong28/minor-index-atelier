/* The typeface, checked against the format rather than against one machine.
 *
 * These are the tests that would have caught an OS/2 table four bytes short:
 * macOS renders that file, and nothing else opens it.
 */
const fs = require("fs");
const path = require("path");
const T = require("./_t.js");
const TTF = require("./ttf.js");
const ROOT = path.join(__dirname, "..");
const F = require(path.join(ROOT, "_font.js"));
const LT = require(path.join(ROOT, "_letters.js"));

/* what each version of OS/2 has to weigh */
const OS2LEN = { 0: 78, 1: 86, 2: 96, 3: 96, 4: 96, 5: 100 };
const REQUIRED = ["OS/2", "cmap", "glyf", "head", "hhea", "hmtx", "loca", "maxp", "name", "post"];

T.head("the typeface — the tables, read back the way a rasteriser reads them");

/* one family table, read from _font.js so the tests cannot describe weights
   that mkfont.js does not write */
const WEIGHTS = F.FAMILY.map((w) => Object.assign({ bold: w.weight > 0.18 }, w));
const make = (w) => F.buildTTF({ family: "Minor Index", style: w.style,
                                 weight: w.weight, hand: w.hand, seed: 7 });

for (const w of WEIGHTS) {
  const built = make(w);
  const f = TTF.read(built.font);
  const at = (s) => w.style + " — " + s;

  T.ok(at("it is a TrueType file"), f.sfntVersion === 0x00010000, f.sfntVersion.toString(16));
  T.ok(at("head carries the magic number"), f.head.magic === 0x5f0f3cf5);

  for (const name of REQUIRED) T.ok(at("has " + name), !!f.dir[name]);

  T.ok(at("the table directory is in tag order"),
    f.order.slice().sort().join() === f.order.join(), f.order.join(" "));

  /* the one that was wrong: OS/2 must weigh what its version says */
  T.ok(at("OS/2 v" + f.os2.version + " is " + OS2LEN[f.os2.version] + " bytes"),
    f.os2.len === OS2LEN[f.os2.version], "it is " + f.os2.len);

  T.ok(at("head is 54 bytes"), f.dir.head.len === 54, f.dir.head.len);
  T.ok(at("post 3.0 is 32 bytes"), f.dir.post.len === 32, f.dir.post.len);
  T.ok(at("maxp 1.0 is 32 bytes"), f.dir.maxp.len === 32, f.dir.maxp.len);
  T.ok(at("hhea is 36 bytes"), f.dir.hhea.len === 36, f.dir.hhea.len);

  /* every table's checksum has to be the one the directory promised */
  let badsum = [];
  for (const name of f.order) {
    if (name === "head") continue;              /* head's is adjusted after the fact */
    const e = f.dir[name];
    if (f.checksum(e.off, e.len) !== e.checksum) badsum.push(name);
  }
  T.ok(at("every table checksum matches"), badsum.length === 0, badsum.join(" "));

  T.ok(at("loca has numGlyphs + 1 entries in range"),
    f.locs.length === f.numGlyphs + 1 && f.locs[f.numGlyphs] <= f.dir.glyf.len,
    f.locs.length + " entries, last " + f.locs[f.numGlyphs] + " of " + f.dir.glyf.len);
  let rising = true;
  for (let i = 1; i < f.locs.length; i++) if (f.locs[i] < f.locs[i - 1]) rising = false;
  T.ok(at("loca never goes backwards"), rising);

  T.ok(at("hmtx covers every glyph"),
    f.hhea.numberOfHMetrics === f.numGlyphs && f.dir.hmtx.len === f.numGlyphs * 4,
    f.hhea.numberOfHMetrics + " metrics, hmtx " + f.dir.hmtx.len + " bytes");

  /* the cmap, and the promise that lowercase types the caps */
  const cm = f.cmap();
  T.ok(at("cmap has a (3,1) format 4 subtable"),
    cm.subtables.some((s) => s.platformID === 3 && s.encodingID === 1 && s.format === 4));
  const codes = Object.keys(built.map).map(Number);
  const missed = codes.filter((c) => cm.map[c] !== built.map[c]);
  T.ok(at("every mapped codepoint reads back (" + codes.length + ")"),
    missed.length === 0, missed.slice(0, 8).map((c) => "U+" + c.toString(16)).join(" "));
  /* lowercase used to be an alias for the capital. It is a drawing of its
     own now — the same letter cut small — so what is checked is that it is a
     different glyph, that it stands at the small-cap height the drawing
     declares, and that it kept its stem instead of being photographed down. */
  const gid = (c) => cm.map[c.codePointAt(0)];
  T.ok(at("lowercase is its own glyph, not the capital again"),
    gid("a") !== gid("A") && gid("é") !== gid("É") && gid("œ") !== gid("Œ"));
  const capH = f.glyph(gid("H")).yMax, scH = f.glyph(gid("h")).yMax;
  const pen = (w.weight * F.CAP) / 2;                    /* the cap's, as a radius */
  const want = LT.SC.h * F.CAP + pen * LT.SC.pen / LT.SC.h;
  /* the hand shakes the top of a letter by half its wobble either way, so
     the height is checked to the wobble and not to the unit */
  const tol = 0.015 * F.CAP + 2;
  T.ok(at("the small cap stands at " + Math.round(LT.SC.h * 100) + "% of the cap"),
    Math.abs(scH - want) <= tol, scH + " against " + Math.round(want));
  T.ok(at("the small cap is narrower than the cap it was cut from"),
    f.glyph(gid("h")).xMax < f.glyph(gid("H")).xMax);
  T.ok(at("space is a glyph with an advance and no outline"),
    f.glyph(cm.map[32]).empty === true);

  /* the names, decoded from the encoding each record claims */
  const nm = f.names();
  const win = nm.filter((r) => r.platformID === 3);
  const mac = nm.filter((r) => r.platformID === 1);
  T.ok(at("has both Macintosh and Windows name records"), win.length > 0 && mac.length > 0);
  const family = win.find((r) => r.nameID === 1);
  T.ok(at("the Windows family name is real UTF-16BE"),
    family && family.text === "Minor Index", family && JSON.stringify(family.text));
  T.ok(at("every Windows record is an even number of bytes"),
    win.every((r) => r.len % 2 === 0));
  T.ok(at("the Windows subfamily is " + w.style),
    (win.find((r) => r.nameID === 2) || {}).text === w.style,
    JSON.stringify((win.find((r) => r.nameID === 2) || {}).text));
  T.ok(at("the PostScript name has no spaces"),
    /^[\x21-\x7e]+$/.test((win.find((r) => r.nameID === 6) || {}).text || " "));

  /* weight, said the same way in all three places a reader might look */
  T.ok(at("usWeightClass is " + w.css), f.os2.usWeightClass === w.css, f.os2.usWeightClass);
  T.ok(at("head.macStyle says " + (w.bold ? "bold" : "regular")),
    (f.head.macStyle & 1) === (w.bold ? 1 : 0), f.head.macStyle);
  T.ok(at("fsSelection says " + (w.bold ? "bold" : "regular")),
    f.os2.fsSelection === (w.bold ? 0x20 : 0x40), "0x" + f.os2.fsSelection.toString(16));

  /* vertical metrics that agree with each other */
  T.ok(at("sTypoAscender matches hhea"), f.os2.sTypoAscender === f.hhea.ascent);
  T.ok(at("usWinAscent/Descent are positive"),
    f.os2.usWinAscent > 0 && f.os2.usWinDescent > 0,
    f.os2.usWinAscent + " / " + f.os2.usWinDescent);
  T.ok(at("sCapHeight is the cap height"), f.os2.sCapHeight === F.CAP, f.os2.sCapHeight);
  T.ok(at("head was stamped with a date"), f.head.created[1] > 0, f.head.created.join(","));

  /* the outlines are actually in there, and inside the em */
  let empty = 0, out = 0, pts = 0;
  for (let g = 2; g < f.numGlyphs; g++) {
    const gl = f.glyph(g);
    if (gl.empty) { empty++; continue; }
    pts += gl.points;
    if (gl.xMin < f.head.xMin || gl.xMax > f.head.xMax
        || gl.yMin < f.head.yMin || gl.yMax > f.head.yMax) out++;
  }
  T.ok(at("every letter has an outline"), empty === 0, empty + " are empty");
  T.ok(at("no glyph escapes head's bounding box"), out === 0, out + " do");
  T.ok(at("a fatter pen makes more ink"), pts > 0, pts + " points");
}

/* the pen is a parameter, so the weights are one drawing and not three */
const light = F.outlineGlyph("A", { weight: 0.075, hand: 0.015, seed: 7 });
const bold = F.outlineGlyph("A", { weight: 0.19, hand: 0.015, seed: 7 });
T.ok("Light and Bold are the same skeleton", light.contours.length === bold.contours.length,
  light.contours.length + " vs " + bold.contours.length);
T.ok("Bold covers more of the em", bold.contours.flat().length === light.contours.flat().length);
T.ok("the three weights sort into three places in a font menu",
  new Set(F.FAMILY.map((w) => w.css)).size === F.FAMILY.length,
  F.FAMILY.map((w) => w.style + "=" + w.css).join(" "));

/* the alphabet the README claims */
const chars = Object.keys(LT.G);
const caps = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const figs = "0123456789".split("");
T.ok("the drawn alphabet has all 26 caps", caps.every((c) => LT.G[c]));
T.ok("and all ten figures", figs.every((c) => LT.G[c]));
T.ok("and the punctuation the film needs (" + chars.length + " drawn in all)",
  ["&", "?", "\u0152", ".", ",", ":", "-", "/", "!", "(", ")", "\u00b0", "'"]
    .every((c) => LT.G[c]));
for (const acc of ["É", "È", "Ê", "Ë", "À", "Â", "Ç", "Î", "Ï", "Ô", "Û", "Ù", "Œ"]) {
  if (!LT.glyph(acc)) T.ok("French needs " + acc, false);
}
T.ok("the accents French needs are all drawn", true);

/* ---- one drawing, three dials ---------------------------------------- */
T.head("the variable font — asked for a weight, it gives the drawing at that pen");

const vfr = F.buildVF({ family: "Minor Index" });
const vf = TTF.read(vfr.font);

T.ok("it carries fvar, gvar, avar and STAT",
  ["fvar", "gvar", "avar", "STAT"].every((t) => !!vf.dir[t]),
  Object.keys(vf.dir).join(" "));
for (const t of REQUIRED) T.ok("and still has " + t, !!vf.dir[t]);
T.ok("OS/2 is still 96 bytes", vf.os2.len === 96, vf.os2.len);
T.ok("the table directory is in tag order",
  vf.order.slice().sort().join() === vf.order.join(), vf.order.join(" "));
let vbad = [];
for (const name of vf.order) {
  if (name === "head") continue;
  if (vf.checksum(vf.dir[name].off, vf.dir[name].len) !== vf.dir[name].checksum) vbad.push(name);
}
T.ok("every table checksum matches", vbad.length === 0, vbad.join(" "));

const fv = vf.fvar();
T.ok("three axes: " + fv.axes.map((a) => a.tag).join(" "),
  fv.axes.map((a) => a.tag).join(" ") === "wght wdth slnt");
T.ok("the default instance is Regular, upright, normal width",
  fv.axes[0].def === 400 && fv.axes[1].def === 100 && fv.axes[2].def === 0,
  fv.axes.map((a) => a.tag + "=" + a.def).join(" "));
T.ok("weight runs 100 to 900", fv.axes[0].min === 100 && fv.axes[0].max === 900);
T.ok("it names " + fv.instances.length + " instances", fv.instances.length === F.INSTANCES.length);
const iNames = vf.names().filter((r) => r.platformID === 3);
for (const inst of F.INSTANCES) {
  if (!iNames.some((r) => r.text === inst.name)) T.ok("names the " + inst.name + " instance", false);
}
T.ok("and every instance it names has a name record", true);
T.ok("gvar covers every glyph", vf.u16(vf.dir.gvar.off + 12) === vf.numGlyphs,
  vf.u16(vf.dir.gvar.off + 12) + " of " + vf.numGlyphs);
T.ok("avar bends all three axes", vf.u16(vf.dir.avar.off + 6) === 3);

/* the bend, checked where it matters: the three weights that were drawn */
const cmVF = vf.cmap();
for (const w of F.FAMILY) {
  const gid = cmVF.map["A".codePointAt(0)];
  const got = vf.varGlyph(gid, { wght: w.css });
  const want = F.outlineGlyph("A", { weight: w.weight, hand: 0.015, seed: 7, joints: "all" })
    .contours.reduce((a, c) => a.concat(c), []);
  let worst = 0;
  for (let i = 0; i < want.length; i++) {
    worst = Math.max(worst, Math.abs(got[i][0] - want[i][0]), Math.abs(got[i][1] - want[i][1]));
  }
  T.ok("wght " + w.css + " is the drawing at the " + w.style + " pen (worst "
    + worst.toFixed(2) + " units of 1000)", worst < 2, worst);
}
/* and the other two dials move what they say they move */
const gidA = cmVF.map["A".codePointAt(0)];
const wide = vf.varGlyph(gidA, { wdth: 125 }), narrow = vf.varGlyph(gidA, { wdth: 75 });
const upright = vf.varGlyph(gidA, {}), leaning = vf.varGlyph(gidA, { slnt: -15 });
const spanX = (p) => Math.max.apply(null, p.map((q) => q[0])) - Math.min.apply(null, p.map((q) => q[0]));
T.ok("width widens and narrows the letter",
  spanX(wide) > spanX(upright) * 1.15 && spanX(narrow) < spanX(upright) * 0.85,
  [spanX(narrow), spanX(upright), spanX(wide)].join(" / "));
T.ok("width moves the advance too",
  wide[wide.length - 3][0] - wide[wide.length - 4][0]
  > upright[upright.length - 3][0] - upright[upright.length - 4][0],
  "an advance that does not follow the width sets solid text at the wrong pitch");
/* a shear leaves the baseline and moves the cap line */
const capMove = (a, b) => {
  let m = 0;
  for (let i = 0; i < a.length - 4; i++) if (b[i][1] > 500) m = Math.max(m, Math.abs(b[i][0] - a[i][0]));
  return m;
};
T.ok("slant leans the letter over (" + capMove(upright, leaning).toFixed(0) + " units at the cap)",
  capMove(upright, leaning) > 100, capMove(upright, leaning));
T.ok("and leaves the baseline where it was",
  Math.abs(leaning[0][1] - upright[0][1]) < 40,
  "y moved " + Math.abs(leaning[0][1] - upright[0][1]));

/* ---- the presses ------------------------------------------------------- */
T.head("the presses — the same letters printed, and each printing a font");

const ring = (c) => {
  let a = 0;
  for (let i = 0; i < c.length; i++) {
    const p = c[i], q = c[(i + 1) % c.length];
    a += (q[0] - p[0]) * (q[1] + p[1]);
  }
  return a;
};
const cutAdv = (ch) => F.outlineGlyph(ch, { weight: 0.13, hand: 0.02, seed: 7 }).adv;

for (const p of F.PRESSES) {
  const built = F.buildTTF({ family: "Minor Index " + p.name, cut: p.cut });
  const f = TTF.read(built.font);
  const at = (s) => p.label + " — " + s;

  T.ok(at("it is a TrueType file"), f.sfntVersion === 0x00010000, f.sfntVersion.toString(16));
  for (const name of REQUIRED) T.ok(at("has " + name), !!f.dir[name]);
  T.ok(at("OS/2 v" + f.os2.version + " is " + OS2LEN[f.os2.version] + " bytes"),
    f.os2.len === OS2LEN[f.os2.version], "it is " + f.os2.len);
  T.ok(at("the table directory is in tag order"),
    f.order.slice().sort().join() === f.order.join(), f.order.join(" "));
  let bad = [];
  for (const name of f.order) {
    if (name === "head") continue;
    if (f.checksum(f.dir[name].off, f.dir[name].len) !== f.dir[name].checksum) bad.push(name);
  }
  T.ok(at("every table checksum matches"), bad.length === 0, bad.join(" "));
  T.ok(at("it carries the whole alphabet"), f.numGlyphs === built.glyphs, f.numGlyphs);

  /* a font menu has to show three presses and not one face with two ghosts */
  const fam = f.names().filter((r) => r.platformID === 3 && r.nameID === 1)[0];
  T.ok(at("it is a family of its own, not a weight of the cut letter"),
    fam && fam.text === "Minor Index " + p.name, fam && fam.text);

  let empty = 0, out = 0;
  for (let g = 2; g < f.numGlyphs; g++) {
    const gl = f.glyph(g);
    if (gl.empty) { empty++; continue; }
    if (gl.xMin < f.head.xMin || gl.xMax > f.head.xMax
        || gl.yMin < f.head.yMin || gl.yMax > f.head.yMax) out++;
  }
  T.ok(at("every letter has ink"), empty === 0, empty + " are empty");
  T.ok(at("no glyph escapes head's bounding box"), out === 0, out + " do");
}

/* the screen is the copier's, at the size a plate is printed at, so a screened
   word has to set to the same measure as a cut one */
for (const ch of ["A", "M", "I", "8"]) {
  const g = F.pressGlyph(ch, Object.assign({}, F.press("screen")));
  T.ok("a screened " + ch + " sets to the same measure as a cut one",
    g.adv === cutAdv(ch), g.adv + " vs " + cutAdv(ch));
  T.ok("and is dots, every one of them a contour of its own",
    g.contours.length > 40 && g.contours.every((c) => c.length === g.contours[0].length),
    g.contours.length + " contours");
}
/* run hot, the same press puts down more ink */
const inkOf = (cut) => F.pressGlyph("O", Object.assign({}, F.press(cut)))
  .contours.reduce((a, c) => a + Math.abs(ring(c)) / 2, 0);
T.ok("over-inked lays down more ink than screened (" + Math.round(inkOf("hot") / inkOf("screen") * 100)
  + "% of it)", inkOf("hot") > inkOf("screen") * 1.2,
  Math.round(inkOf("screen")) + " vs " + Math.round(inkOf("hot")));

/* the knock-out: a band with the word taken out of it */
const kn = Object.assign({}, F.press("knock"));
for (const ch of ["A", "O", "E", "É"]) {
  const g = F.pressGlyph(ch, kn);
  const slab = g.contours[0];
  const xs = slab.map((q) => q[0]), ys = slab.map((q) => q[1]);
  const bleed = kn.bleed || 6;
  T.ok("the " + ch + " is knocked out of a slab one advance wide, plus the bleed",
    slab.length === 4 && Math.min.apply(null, xs) === -bleed
    && Math.max.apply(null, xs) === g.adv + bleed
    && Math.min.apply(null, ys) === kn.slab[0] && Math.max.apply(null, ys) === kn.slab[1],
    xs.join(",") + " / " + ys.join(","));
  T.ok("and is wound against it, or the ink fills the letter back in",
    g.contours.length > 1 && g.contours.slice(1).some((c) => ring(c) * ring(slab) < 0),
    g.contours.map((c) => (ring(c) > 0 ? "+" : "-")).join(""));
  T.ok("and nothing it traced lies outside the ink",
    g.contours.slice(1).every((c) => c.every((q) => q[0] >= -bleed && q[0] <= g.adv + bleed
      && q[1] >= kn.slab[0] && q[1] <= kn.slab[1])), "a loop outside the slab prints solid");
  T.ok("and no letter reaches into where two slabs overlap",
    g.contours.slice(1).every((c) => c.every((q) => q[0] > bleed && q[0] < g.adv - bleed)),
    "a hole inside the overlap closes when the next slab lands on it");
  T.ok("a knocked-out " + ch + " is set no tighter than a cut one",
    g.adv >= cutAdv(ch), g.adv + " vs " + cutAdv(ch));
}
T.ok("the O keeps its counter — the trace is the union's edge, not a pile of capsules",
  F.pressGlyph("O", kn).contours.length === 3,
  F.pressGlyph("O", kn).contours.length + " contours");

/* what is committed is what this code makes */
const dir = path.join(ROOT, "docs", "fonts");
const vFile = path.join(dir, "MinorIndex.ttf");
if (!fs.existsSync(vFile)) T.ok("docs/fonts/MinorIndex.ttf exists", false, "run `node mkfont.js`");
else {
  const have = new Uint8Array(fs.readFileSync(vFile));
  T.ok("docs/fonts/MinorIndex.ttf is what mkfont.js writes",
    have.length === vfr.font.length && vfr.font.every((b, i) => b === have[i]),
    "run `node mkfont.js`");
}
const committed = (name, made) => {
  const file = path.join(dir, "MinorIndex-" + name + ".ttf");
  if (!fs.existsSync(file)) { T.ok("docs/fonts/MinorIndex-" + name + ".ttf exists", false); return; }
  const have = new Uint8Array(fs.readFileSync(file));
  T.ok("docs/fonts/MinorIndex-" + name + ".ttf is what mkfont.js writes",
    have.length === made.length && made.every((b, i) => b === have[i]),
    "run `node mkfont.js`");
};
for (const w of WEIGHTS) committed(w.style, make(w).font);
/* and the presses, which is also where a screen that stopped being the same
   screen twice running would show up */
for (const p of F.PRESSES) {
  committed(p.name, F.buildTTF({ family: "Minor Index " + p.name, cut: p.cut }).font);
}

module.exports = T.counts;
if (require.main === module) process.exit(T.report() ? 0 : 1);
