/* The atelier's one promise: what comes out of Code rebuilds the plate that
 * was on screen, byte for byte. Not asserted in a README — run here.
 *
 * Every body in both passes, every appetite, both ways of setting a word,
 * both second plates, all the furniture, and a spread of rolls. The emitted
 * code is evaluated in a scope holding exactly what its header says it needs.
 */
const path = require("path");
const vm = require("vm");
const T = require("./_t.js");
const ROOT = path.join(__dirname, "..");
const S = require(path.join(ROOT, "_sheet.js"));
const Y = require(path.join(ROOT, "_glyphs.js"));
const LT = require(path.join(ROOT, "_letters.js"));
const RA = require(path.join(ROOT, "_raster.js"));
const ST = require(path.join(ROOT, "_studio.js"));

const SCOPE = Object.assign({}, Y, S, {
  textField: LT.textField, textSolid: LT.textSolid,
  screenImage: RA.screenImage, bbox: RA.bbox, readPNG: RA.readPNG,
  INK: S.INK, path: path, __dirname: ROOT,
  console: console, Math: Math, Object: Object, Array: Array, JSON: JSON,
  Number: Number, String: String, Infinity: Infinity, isFinite: isFinite,
});

/* the emitted block is a `plate(...)` call; give it the `plate` a batch has */
function runEmitted(code) {
  let got = null;
  const ctx = vm.createContext(Object.assign({}, SCOPE, {
    plate: function (name, w, h, draw) {
      const out = draw();
      got = S.sheet(w, h, typeof out === "string" ? { body: out } : out);
    },
  }));
  vm.runInContext(code, ctx, { timeout: 60000 });
  return got;
}

T.head("round trip — buildPlate(state) === the code emitPlate(state) writes");

function trip(label, over) {
  const state = Object.assign({}, ST.DEFAULTS, { num: 200, name: "t" }, over);
  let built, code, made;
  try { built = ST.buildPlate(state).svg; }
  catch (e) { return T.ok(label, false, "buildPlate threw: " + e.message); }
  try { code = ST.emitPlate(state); }
  catch (e) { return T.ok(label, false, "emitPlate threw: " + e.message); }
  try { made = runEmitted(code); }
  catch (e) { return T.ok(label, false, "the emitted code threw: " + e.message); }
  if (!made) return T.ok(label, false, "the emitted code called no plate()");
  return T.same(label, built, made);
}

const BODIES = ["sun", "corona", "cell", "network", "seed", "lace", "spiral",
                "shell", "rings", "two", "field", "disc"];
for (const sym of BODIES) {
  trip(sym + " · screened", { sym: sym, mode: "ecran" });
  trip(sym + " · flat", { sym: sym, mode: "plein" });
}

trip("appetite · everything at once", { sym: "sun", grow: 6, twist: 0.004, wobAmp: 5,
  wobScale: 40, bites: 4, biteSize: 50, occ: true });
trip("appetite · sun toward the cell", { sym: "sun", morph: 0.5 });
trip("appetite · starved", { sym: "cell", grow: -12 });
trip("furniture · all of it", { fBrackets: true, fAxes: true, fPolar: true, fRing: true,
  fTicks: true, fBand: true, fSwipe: true, fReg: true });
trip("lettering · printed", { tmode: "printed" });
trip("lettering · cut", { tmode: "cut" });
trip("lettering · printed, slanted and narrowed", { tmode: "printed", tslant: -14,
  twidth: 0.82, tweight: 0.2, thand: 0.05 });
trip("lettering · accents", { tmode: "cut", text: "ÉTÉ ŒIL & 137.5°" });

trip("second plate · out of register", { plate2: "registre" });
trip("second plate · spread underneath", { plate2: "grossi" });
trip("second plate · out of register, flat", { mode: "plein", plate2: "registre" });
trip("second plate · spread underneath, flat", { mode: "plein", plate2: "grossi" });
trip("second plate · flat, on a body cut as a line", { sym: "rings", mode: "plein", plate2: "grossi" });
trip("second plate · flat, two bodies", { sym: "two", mode: "plein", plate2: "registre" });

/* a word set "printed" on a flat pass is cut with the body */
trip("lettering · printed, flat", { mode: "plein", tmode: "printed" });
trip("lettering · printed and spread underneath, flat",
  { mode: "plein", tmode: "printed", plate2: "grossi" });
trip("lettering · cut, flat", { mode: "plein", tmode: "cut" });
/* and the appetite a flat cut cannot take must not show up in the code */
trip("flat · the appetite is not in the geometry",
  { mode: "plein", grow: 20, wobAmp: 8, bites: 5, occ: true, morph: 0.4 });
trip("flat · the twist is", { mode: "plein", sym: "sun", twist: 0.006 });

trip("sheet · no ground", { bg: "none" });
trip("sheet · no trim marks", { trimMarks: false });
trip("sheet · a strip", { format: "bande" });
trip("sheet · custom", { format: "libre", w: 900, h: 420, size: 380 });

/* the image, which until now was the one pass the promise never covered:
   the emitted code reads the file off the disk, so the plate on screen and
   the plate the code prints only agree if the levels, the crop, the placing
   and the separation all survive being written out. */
const PHOTO = RA.readPNG(path.join(ROOT, "pokemon.png"));
ST.useImage(PHOTO);
const shot = (label, over) => trip("image · " + label,
  Object.assign({ sym: "image", imgName: "pokemon.png", size: 420, px: 110, py: 110 }, over));
shot("as it comes", {});
shot("cropped to the body", { imgCrop: true });
shot("the whole canvas", { imgCrop: false });
shot("levels wound in", { imgLo: 0.28, imgHi: 0.9, imgGamma: 1.6 });
shot("soft, coarse and dirty", { imgSoft: 1.9, pitch: 8.4, grain: 0.34, dspread: 0.74 });
shot("hard, fine and clean", { imgSoft: 0.35, pitch: 2.2, grain: 0.04, imgMin: 0.08 });
shot("negative", { imgInvert: true, bg: "black", ink: "white" });
shot("second plate · out of register", { plate2: "registre" });
shot("second plate · spread underneath", { plate2: "grossi" });
shot("second plate · separation", { plate2: "separation" });
shot("second plate · separation, held high", { plate2: "separation", p2from: 0.75, p2ink: "fluo" });
shot("with a word printed into it", { tmode: "printed" });
shot("with a word cut over it", { tmode: "cut" });
shot("on a strip, with all the furniture", { format: "bande", fBrackets: true, fAxes: true,
  fTicks: true, fBand: true, fSwipe: true, fReg: true });
ST.useImage(null);

for (let s = 1; s <= 24; s++) {
  trip("roll " + s, Object.assign(ST.rollState(s), { num: 300 + s, name: "roll" }));
}

module.exports = T.counts;
if (require.main === module) process.exit(T.report() ? 0 : 1);
