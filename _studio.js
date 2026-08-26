/* MINOR INDEX — the vocabulary, declared once.
 *
 * Ten batch scripts have now been written by hand, and between them they only
 * ever do four things: choose a body, do something to it, put it through the
 * press, and set the page furniture around it. This file says that out loud.
 *
 *   PARAMS      every control the plates have ever used, and nothing else
 *   buildPlate  a state → an SVG, by the same route a batch script takes
 *   emitPlate   the same state → the JavaScript a batch script would contain
 *
 * The last one is the point. The atelier is not a toy beside the repository:
 * what comes out of it is a `plate(...)` block that can be pasted into the
 * next mk*.js and will produce exactly the file that was on screen.
 *
 * No fs, no DOM — Node requires it, `mkbundle.js` ships it to the browser.
 */
const M = require("./_mark.js");
const Y = require("./_glyphs.js");
const LT = require("./_letters.js");
const RA = require("./_raster.js");
const { INK, n, rng, axes, brackets, polar, swipe, trim, svg, G } = M;
const { screenImage, bbox } = RA;
const { cell, sunGeom, sunSolid, sunSDF, sunWhirl, screen, cellGeom, cellSDF,
        phylloPts, sPts, sScatter, sunBound, cellBound, spiralPath, spiralWalls, sSpiral, sDisc, sRing, sUnion, sSub, sShift,
        sTwist, sGrow, sSmooth, sMorph, sWobble, contour, sBite } = Y;

/* one rounding rule for every derived number, so the plate on screen and the
   plate the emitted code makes are the same file */
const q4 = (v) => Number(v.toFixed(4));

/* ---- the formats the plates have actually been cut at ------------------- */
const SHEETS = [
  { id: "carre", label: "square 640", w: 640, h: 640 },
  { id: "carre760", label: "square 760", w: 760, h: 760 },
  { id: "emblem", label: "emblem 820×1080", w: 820, h: 1080 },
  { id: "affiche", label: "poster 820×1140", w: 820, h: 1140 },
  { id: "paysage", label: "landscape 900×640", w: 900, h: 640 },
  { id: "bande", label: "strip 1020×300", w: 1020, h: 300 },
  { id: "sceau", label: "seal 560×560", w: 560, h: 560 },
  { id: "libre", label: "custom", w: 0, h: 0 },
];
const INKS = ["black", "white", "fluo", "blu", "grey"];
const SUNNY = ["sun", "corona", "lace", "two", "field"];
const CELLY = ["cell", "network", "two"];

/* ---- every control, in the order a plate is built ----------------------- */
const is = (k, ...v) => (s) => v.indexOf(s[k]) >= 0;
/* an image has no field to cut solid, so it is screened whatever the pass says */
const screened = (s) => s.sym === "image" || s.mode === "ecran";
const notImage = (s) => s.sym !== "image";
const PARAMS = [
  { id: "sheet", label: "THE SHEET", note: "size, ground, and the marks that say it was printed", fields: [
    { id: "format", type: "select", label: "format", def: "carre",
      help: "Sizes taken from plates that exist. Custom frees the two sliders below.",
      options: SHEETS.map((f) => ({ v: f.id, label: f.label })) },
    { id: "w", type: "range", label: "width", min: 240, max: 1400, step: 10, def: 640, when: is("format", "libre") },
    { id: "h", type: "range", label: "height", min: 200, max: 1400, step: 10, def: 640, when: is("format", "libre") },
    { id: "bg", type: "ink", label: "ground", def: "white",
      help: "The paper. Black turns the plate into a knock-out — ink becomes the light. None leaves it transparent.",
      options: INKS.concat(["none"]) },
    { id: "trimMarks", type: "bool", label: "trim marks", def: true,
      help: "Crop crosses in the four corners, the way a press hands a sheet over." },
  ] },
  { id: "corps", label: "THE BODY", note: "one form — the sun, the cell, or something grown out of them", fields: [
    { id: "sym", type: "select", label: "body", def: "sun", options: [
      { v: "sun", label: "sun — disc and rays" },
      { v: "corona", label: "corona — rays, no disc" },
      { v: "cell", label: "cell — soma, spikes, satellites" },
      { v: "network", label: "network — several cells" },
      { v: "seed", label: "seed head — 137.5° spiral of grains" },
      { v: "lace", label: "lace — a sun eaten full of holes" },
      { v: "spiral", label: "spiral — one logarithmic band" },
      { v: "shell", label: "shell — spiral with chamber walls" },
      { v: "rings", label: "rings — concentric" },
      { v: "two", label: "two bodies — sun and cell grown together" },
      { v: "field", label: "field — a scatter of small suns" },
      { v: "disc", label: "disc — the plain kernel" },
      { v: "image", label: "image — a body that is not ours" } ],
      help: "Every body is a distance field, not a shape: it answers how far outside you are. That is why anything can be cut into anything." },
    { id: "size", type: "range", label: "size", min: 100, max: 1400, step: 10, def: 520,
      help: "The body's box. Push it past the sheet to make it bleed off the edge — plates 78 and 101 do." },
    { id: "seed", type: "seed", label: "body seed", def: 7, when: notImage,
      help: "Which particular organism grows. Same seed, same body, every time." },
    { id: "px", type: "range", label: "position x", min: -500, max: 1200, step: 5, def: 60 },
    { id: "py", type: "range", label: "position y", min: -500, max: 1200, step: 5, def: 60 },
    { id: "rays", type: "range", label: "rays", min: 6, max: 52, step: 1, def: 30, when: (s) => SUNNY.indexOf(s.sym) >= 0,
      help: "How many arms leave the disc. They alternate long and short." },
    { id: "disc", type: "range", label: "disc", min: 0.08, max: 0.36, step: 0.005, def: 0.22, when: (s) => SUNNY.indexOf(s.sym) >= 0,
      help: "The body at the centre, as a fraction of the box." },
    { id: "reachA", type: "range", label: "short reach", min: 0.16, max: 0.52, step: 0.01, def: 0.32, when: (s) => SUNNY.indexOf(s.sym) >= 0,
      help: "How far the short rays travel." },
    { id: "reachB", type: "range", label: "long reach", min: 0.24, max: 0.62, step: 0.01, def: 0.46, when: (s) => SUNNY.indexOf(s.sym) >= 0,
      help: "How far the long ones do. Set both equal for an even star." },
    { id: "sat", type: "range", label: "satellites", min: 2, max: 9, step: 1, def: 4, when: (s) => CELLY.indexOf(s.sym) >= 0,
      help: "Bodies hanging off the cell on filaments." },
    { id: "count", type: "range", label: "how many", min: 2, max: 18, step: 1, def: 6, when: is("sym", "network", "field"),
      help: "Bodies scattered inside the box, placed by the body seed." },
    { id: "seeds", type: "range", label: "grains", min: 30, max: 620, step: 10, def: 300, when: is("sym", "seed", "lace"),
      help: "For the seed head, how many grains; for lace, how many holes are eaten out." },
    { id: "gspace", type: "range", label: "grain spacing", min: 6, max: 30, step: 0.5, def: 16, when: is("sym", "seed", "lace"),
      help: "Distance between them. Tight spacing closes the head into one mass." },
    { id: "turns", type: "range", label: "turns", min: 0.6, max: 5, step: 0.05, def: 3, when: is("sym", "spiral", "shell"),
      help: "How many times round. The band always ends at the edge of the box." },
    { id: "tight", type: "range", label: "tightness", min: 0.06, max: 0.42, step: 0.005, def: 0.19, when: is("sym", "spiral", "shell"),
      help: "How fast it opens out. Low is a coiled watch spring, high is a wide sweep." },
    { id: "sband", type: "range", label: "band width", min: 2, max: 48, step: 1, def: 14, when: is("sym", "spiral", "shell"),
      help: "Thickness at the outer end — it tapers to nothing at the middle." },
    { id: "ringN", type: "range", label: "how many rings", min: 2, max: 14, step: 1, def: 5, when: is("sym", "rings") },
    { id: "ringW", type: "range", label: "ring width", min: 1, max: 40, step: 1, def: 8, when: is("sym", "rings") },
    { id: "imgName", type: "image", label: "the file", def: "image.png", when: is("sym", "image"),
      help: "Any photograph, drawing or frame. It is never redrawn — it is only ever asked how much ink it would hold, exactly as plate 95 asks it of a borrowed body. Drop a file anywhere on the sheet, or paste one." },
    { id: "imgCrop", type: "bool", label: "crop to the body", def: true, when: is("sym", "image"),
      help: "Frame what the image actually occupies rather than the empty canvas around it. Only tells them apart where there is transparency." },
    { id: "imgLo", type: "range", label: "floor", min: 0, max: 0.6, step: 0.01, def: 0.12, when: is("sym", "image"),
      help: "Below this much ink nothing prints — where the gloves stay light. Raise it to empty the pale half of the image." },
    { id: "imgHi", type: "range", label: "ceiling", min: 0.2, max: 1, step: 0.01, def: 0.72, when: is("sym", "image"),
      help: "Above this the dot is solid. Lower it and the darks flood together." },
    { id: "imgGamma", type: "range", label: "curve", min: 0.4, max: 2, step: 0.05, def: 0.95, when: is("sym", "image"),
      help: "Bends everything between the two. Under 1 opens the midtones, over 1 closes them." },
    { id: "imgSoft", type: "range", label: "softness", min: 0.3, max: 2, step: 0.05, def: 0.8, when: is("sym", "image"),
      help: "How much of the image one dot reads. Wide is the blur a real screen has; narrow keeps the detail and starts to sparkle." },
    { id: "imgMin", type: "range", label: "faint dots", min: 0.005, max: 0.2, step: 0.005, def: 0.015, when: is("sym", "image"),
      help: "The coverage a dot has to reach to be printed at all. Raise it to clear the loose dots off the ground — that is what plates 98 and 99 do." },
    { id: "imgInvert", type: "bool", label: "negative", def: false, when: is("sym", "image"),
      help: "The image read the other way round: the light holds the ink." },
  ] },
  { id: "appetit", label: "APPETITE", note: "what the body does to itself before it is printed",
    when: notImage, fields: [
    { id: "morph", type: "range", label: "toward the cell", min: 0, max: 1, step: 0.02, def: 0, when: is("sym", "sun"),
      help: "Slides the sun into the cell. The middle is neither — plate 123 is this slider in five steps." },
    { id: "grow", type: "range", label: "fatten / starve", min: -34, max: 44, step: 1, def: 0,
      help: "Weight, in units of ink. A printer calls it spread and choke: right fattens the whole form, left eats it back until only the kernel is left." },
    { id: "twist", type: "range", label: "twist", min: -0.03, max: 0.03, step: 0.0005, def: 0,
      help: "Turns the field by an amount that grows with the radius, so straight rays bend into a vortex. This is the whole SPIRALE batch." },
    { id: "wobAmp", type: "range", label: "tremble", min: 0, max: 22, step: 0.5, def: 0,
      help: "Pushes the edge around with noise, so nothing is machine-true." },
    { id: "wobScale", type: "range", label: "tremble scale", min: 8, max: 130, step: 2, def: 46, when: (s) => s.wobAmp > 0,
      help: "Small is a jitter along the edge; large is a slow swell through the whole body." },
    { id: "bites", type: "range", label: "bites", min: 0, max: 16, step: 1, def: 0,
      help: "Mouths taken out where the body actually ends — the edge is found first, then bitten." },
    { id: "biteSize", type: "range", label: "bite size", min: 8, max: 160, step: 2, def: 54, when: (s) => s.bites > 0 },
    { id: "occ", type: "bool", label: "eclipse", def: false,
      help: "Another body passes in front. The dots stop dead where it starts." },
    { id: "occX", type: "range", label: "eclipse x", min: -400, max: 400, step: 5, def: 90, when: (s) => s.occ },
    { id: "occY", type: "range", label: "eclipse y", min: -400, max: 400, step: 5, def: -60, when: (s) => s.occ },
    { id: "occR", type: "range", label: "eclipse radius", min: 20, max: 420, step: 5, def: 150, when: (s) => s.occ },
  ] },
  { id: "presse", label: "THE PRESS", note: "toner at 15°, blu at 75° — anything else is a pass nobody paid for", fields: [
    { id: "mode", type: "select", label: "pass", def: "ecran", when: notImage,
      options: [{ v: "ecran", label: "screened — through the copier" }, { v: "plein", label: "flat — cut solid" }],
      help: "Screened turns coverage into dots. Flat cuts the form in one colour, the way plates 77 and 80 were cut." },
    { id: "ink", type: "ink", label: "ink", def: "black" },
    { id: "pitch", type: "range", label: "screen pitch", min: 1.6, max: 13, step: 0.2, def: 4.4, when: screened,
      help: "Distance between dot centres. Fine reads as a photograph; coarse reads as a bad photocopy, which is the house style." },
    { id: "angle", type: "range", label: "screen angle", min: 0, max: 90, step: 1, def: 15, when: screened,
      help: "15° is the toner plate, 75° the blu one. Keeping them apart is what stops the two passes moiring." },
    { id: "dspread", type: "range", label: "dot size", min: 0.3, max: 0.82, step: 0.01, def: 0.54, when: screened,
      help: "Dot radius against the pitch. Above 0.6 neighbouring dots touch and the form floods — that is plate 78." },
    { id: "falloff", type: "range", label: "fringe", min: 2, max: 60, step: 0.5, def: 9,
      when: (s) => s.mode === "ecran" && s.sym !== "image",
      help: "How far outside the body dots keep appearing. A wide fringe is a soft halo; plate 128 is nothing but fringe." },
    { id: "grain", type: "range", label: "grain", min: 0, max: 0.5, step: 0.01, def: 0.18, when: screened,
      help: "Random noise in the coverage — dirt on the glass. It also scatters loose dots across the empty sheet." },
    { id: "pseed", type: "seed", label: "screen seed", def: 5, when: screened,
      help: "Which particular run through the copier." },
    { id: "plate2", type: "select", label: "second plate", def: "aucune", options: [
      { v: "aucune", label: "none — one pass" },
      { v: "registre", label: "out of register — shifted" },
      { v: "grossi", label: "spread underneath — a rim" } ],
      help: "A second colour under the first. Shifted gives the misprint of plate 107; spread gives the choke-and-spread rim of plate 119." },
    { id: "p2ink", type: "ink", label: "second ink", def: "blu", when: (s) => s.plate2 !== "aucune" },
    { id: "p2dx", type: "range", label: "shift x", min: -30, max: 30, step: 1, def: -8, when: is("plate2", "registre") },
    { id: "p2dy", type: "range", label: "shift y", min: -30, max: 30, step: 1, def: 6, when: is("plate2", "registre") },
    { id: "p2grow", type: "range", label: "spread by", min: 2, max: 30, step: 1, def: 9, when: is("plate2", "grossi") },
  ] },
  { id: "lettrage", label: "LETTERING", note: "words made of the same material as the bodies", fields: [
    { id: "tmode", type: "select", label: "lettering", def: "none", options: [
      { v: "none", label: "none" },
      { v: "printed", label: "printed \u2014 through the press with everything else" },
      { v: "cut", label: "cut \u2014 drawn on top, untouched" } ],
      help: "Printed puts the word into the field before anything is done to it, so the screen, the twist and the bites all take it too. Cut lays it over the finished plate like a marker." },
    { id: "text", type: "text", label: "the word", def: "AUTOPHAGIE", when: (s) => s.tmode !== "none",
      help: "Caps, figures, French accents, & and ?. Lowercase types the caps." },
    { id: "tcap", type: "range", label: "cap height", min: 12, max: 400, step: 2, def: 96, when: (s) => s.tmode !== "none" },
    { id: "tx", type: "range", label: "x", min: -300, max: 1300, step: 5, def: 60, when: (s) => s.tmode !== "none" },
    { id: "ty", type: "range", label: "y (cap line)", min: -200, max: 1300, step: 5, def: 400, when: (s) => s.tmode !== "none" },
    { id: "tweight", type: "range", label: "pen", min: 0.04, max: 0.34, step: 0.005, def: 0.12, when: (s) => s.tmode !== "none",
      help: "Stroke width as a fraction of the cap height \u2014 the same number the font weights use." },
    { id: "ttrack", type: "range", label: "tracking", min: -0.02, max: 0.4, step: 0.01, def: 0.1, when: (s) => s.tmode !== "none" },
    { id: "thand", type: "range", label: "hand", min: 0, max: 0.09, step: 0.002, def: 0.02, when: (s) => s.tmode !== "none",
      help: "The shake. Zero is ruled and machine-made; past 0.05 it starts to fall apart." },
    { id: "tslant", type: "range", label: "slant", min: -28, max: 12, step: 1, def: 0, when: (s) => s.tmode !== "none" },
    { id: "twidth", type: "range", label: "width", min: 0.6, max: 1.5, step: 0.02, def: 1, when: (s) => s.tmode !== "none" },
    { id: "tseed", type: "seed", label: "hand seed", def: 7, when: (s) => s.tmode !== "none" },
  ] },
  { id: "mobilier", label: "FURNITURE", note: "what a press leaves behind that is not the image", fields: [
    { id: "fInk", type: "ink", label: "furniture ink", def: "black",
      help: "Also the colour of the trim marks. On a black ground, set it to white." },
    { id: "fBrackets", type: "bool", label: "corner brackets", def: false,
      help: "Hairline corners that frame the sheet like an instrument." },
    { id: "fAxes", type: "bool", label: "ticked axes", def: false,
      help: "Cross-hairs with graduations, measuring nothing in particular." },
    { id: "fPolar", type: "bool", label: "polar grid", def: false },
    { id: "fRing", type: "bool", label: "ring", def: false },
    { id: "fTicks", type: "bool", label: "crown of ticks", def: false,
      help: "Small squares on a circle — the collar around the emblem of plate 77." },
    { id: "fBand", type: "bool", label: "band at the foot", def: false,
      help: "A solid bar across the bottom, where a poster would carry its credits." },
    { id: "fBandInk", type: "ink", label: "band ink", def: "fluo", when: (s) => s.fBand },
    { id: "fSwipe", type: "bool", label: "marker swipe", def: false,
      help: "One pull of a highlighter across the sheet, uneven at both ends." },
    { id: "fSwipeInk", type: "ink", label: "marker ink", def: "fluo", when: (s) => s.fSwipe },
    { id: "fReg", type: "bool", label: "registration crosses", def: false,
      help: "The targets a printer lines two plates up with." },
  ] },
];

/* an ink field without a stated list takes the whole table */
for (const g of PARAMS) for (const f of g.fields) {
  if (f.type === "ink" && !f.options) f.options = INKS.slice();
}

const DEFAULTS = (() => {
  const d = { name: "sans-titre", num: 132 };
  for (const g of PARAMS) for (const f of g.fields) d[f.id] = f.def;
  return d;
})();
const FIELDS = (() => { const m = {}; for (const g of PARAMS) for (const f of g.fields) m[f.id] = f; return m; })();
const visible = (f, s) => !f.when || f.when(s);
const sheetOf = (s) => {
  const p = SHEETS.find((x) => x.id === s.format) || SHEETS[0];
  return p.id === "libre" ? { w: s.w, h: s.h } : { w: p.w, h: p.h };
};

/* ---- page furniture, the parts every batch keeps redefining ------------- */
const stTicks = (cx, cy, r, count, size, color) => {
  const out = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    out.push(`<rect x="${n(cx + Math.cos(a) * r - size / 2)}" y="${n(cy + Math.sin(a) * r - size / 2)}" `
      + `width="${n(size)}" height="${n(size)}"/>`);
  }
  return `<g fill="${color}">${out.join("")}</g>`;
};
const stReg = (cx, cy, r, color) =>
  G(color, 1.2, `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none"/>`
    + `<line x1="${n(cx - r * 1.7)}" y1="${n(cy)}" x2="${n(cx + r * 1.7)}" y2="${n(cy)}"/>`
    + `<line x1="${n(cx)}" y1="${n(cy - r * 1.7)}" x2="${n(cx)}" y2="${n(cy + r * 1.7)}"/>`);
const stBand = (x, y, w, h, color) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${color}"/>`;
/* mouths, taken where the body actually ends */
function stMouths(f, cx, cy, rMax, count, size, rand) {
  const edge = contour(f, cx, cy, count * 6, rMax);
  const out = [];
  if (!edge.length) return out;
  for (let i = 0; i < count; i++) {
    const p = edge[Math.floor((i / count) * edge.length + rand() * 3) % edge.length];
    if (p) out.push({ x: p.x, y: p.y, r0: size * (0.55 + rand() * 0.9) });
  }
  return out;
}

/* ---- the body, then what is done to it --------------------------------- */
/* a scatter placed by the body seed, computed once and read by both the
   builder and the emitter, so the code carries the same positions */
function stScatter(s) {
  const r = rng((s.seed | 0) * 13 + 7), out = [];
  for (let i = 0; i < s.count; i++) {
    const sz = q4(s.size * (0.16 + r() * 0.26));
    const sd = 20 + Math.floor(r() * 60);
    const reach = q4(s.sym === "network" ? cellBound(cellGeom({ size: sz, seed: sd, sat: s.sat }))
                                         : sunBound(sunGeom(stSunOpts(s, sz, sd))));
    out.push([q4(s.px + (s.size - sz) * r()), q4(s.py + (s.size - sz) * r()), sz, sd, reach]);
  }
  return out;
}
const stSunOpts = (s, size, seed) => ({ size, seed, rays: s.rays, disc: s.disc,
  short: s.reachA, long: s.reachB });
const stSpiralA = (s) => q4((s.size * 0.45) / Math.exp(s.tight * s.turns * Math.PI * 2));
const stDiscs = (pts, color) => `<g fill="${color}">` + pts.map((p) =>
  `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(p.r)}"/>`).join("") + "</g>";

function stBody(s) {
  const size = s.size, cx = q4(s.px + size / 2), cy = q4(s.py + size / 2);
  const ink = INK[s.ink], sym = s.sym;
  const T = (b) => `<g transform="translate(${n(s.px)} ${n(s.py)})">${b}</g>`;
  let f = null, solid = null, geom = null;

  if (sym === "sun" || sym === "two" || sym === "corona" || sym === "lace") {
    geom = sunGeom(stSunOpts(s, size, s.seed));
    f = sShift(sunSDF(geom), s.px, s.py);
    solid = T(s.twist ? sunWhirl(geom, ink, s.twist) : sunSolid(geom, ink));
    if (sym === "corona") {                       /* the body gone, the light still arriving */
      f = sSub(f, sDisc(cx, cy, q4(size * s.disc * 0.98)));
      solid = T(sunSolid(geom, ink, { disc: false }));
    }
    if (sym === "lace") {                          /* bitten until it is a net */
      const holes = phylloPts(cx, cy, s.seeds, { c: s.gspace,
        r0: q4(s.gspace * 0.36), r1: q4(s.gspace * 0.82) });
      f = sSub(sGrow(f, q4(size * 0.028)), sPts(holes, 1.5));
      solid = T(sunSolid(geom, ink)) + stDiscs(holes, s.bg === "none" ? INK.white : INK[s.bg]);
    }
  }
  if (sym === "cell" || sym === "two") {
    const off = sym === "two" ? q4(size * 0.34) : 0;
    const cs = sym === "two" ? q4(size * 0.85) : size;
    const cg = cellGeom({ size: cs, seed: s.seed, sat: s.sat });
    const cf = sShift(cellSDF(cg), s.px + off, s.py + off);
    const cSolid = `<g transform="translate(${n(s.px + off)} ${n(s.py + off)})">`
      + cell({ size: cs, seed: s.seed, sat: s.sat, color: ink }) + "</g>";
    f = f ? sSmooth(f, cf, q4(size * 0.12)) : cf;
    solid = sym === "two" ? solid + cSolid : cSolid;
  }
  if (sym === "network") {                          /* plate 82, as a control */
    const at = stScatter(s);
    f = sScatter(at.map((a) => ({ f: sShift(cellSDF(cellGeom({ size: a[2], seed: a[3], sat: s.sat })), a[0], a[1]),
      cx: a[0] + a[2] / 2, cy: a[1] + a[2] / 2, r: a[4] })));
    solid = at.map((a) => `<g transform="translate(${n(a[0])} ${n(a[1])})">`
      + cell({ size: a[2], seed: a[3], sat: s.sat, color: ink }) + "</g>").join("");
  }
  if (sym === "field") {                            /* plates 94, 110, 125 */
    const at = stScatter(s);
    f = sScatter(at.map((a) => ({ f: sShift(sunSDF(sunGeom(stSunOpts(s, a[2], a[3]))), a[0], a[1]),
      cx: a[0] + a[2] / 2, cy: a[1] + a[2] / 2, r: a[4] })));
    solid = at.map((a) => `<g transform="translate(${n(a[0])} ${n(a[1])})">`
      + sunSolid(sunGeom(stSunOpts(s, a[2], a[3])), ink) + "</g>").join("");
  }
  if (sym === "seed") {
    const pts = phylloPts(cx, cy, s.seeds, { c: s.gspace,
      r0: q4(s.gspace * 0.25), r1: q4(s.gspace * 0.85) });
    f = sPts(pts);
    solid = stDiscs(pts, ink);
  }
  if (sym === "spiral" || sym === "shell") {
    const a = stSpiralA(s), taper = q4(s.sband / 120);
    f = sSpiral(cx, cy, { a, b: s.tight, turns: s.turns,
      w: (r) => Math.max(2.5, Math.min(s.sband, r * taper)) });
    solid = G(ink, q4(s.sband * 0.35), spiralPath(cx, cy, { a, b: s.tight, turns: s.turns, step: 7 }));
    if (sym === "shell") solid = G(ink, 0.9, spiralWalls(cx, cy, { a, b: s.tight, turns: s.turns })) + solid;
  }
  if (sym === "rings") {
    const rr = [];
    for (let i = 0; i < s.ringN; i++) rr.push(q4((size * 0.5 * (i + 1)) / s.ringN));
    f = sUnion.apply(null, rr.map((r) => sRing(cx, cy, r, s.ringW)));
    solid = G(ink, s.ringW, rr.map((r) =>
      `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none"/>`).join(""));
  }
  if (sym === "disc") {
    f = sDisc(cx, cy, q4(size * 0.32));
    solid = `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(q4(size * 0.32))}" fill="${ink}"/>`;
  }
  return { f, solid, cx, cy, geom };
}

/* ---- a body that is not ours -------------------------------------------
 * An image is not a distance field. It cannot be twisted, bitten or grown,
 * so it skips the appetite and goes straight to the press — and the press is
 * the same press: pitch, angle, dot, grain, the second plate. Nothing here
 * redraws anything. The image is only ever asked how much ink it would hold,
 * which is what plates 95–99 ask of a body that was never drawn for this.
 *
 * The pixels stay here rather than in the state: a state is JSON, it goes
 * into undo, into localStorage and into the emitted code, and a photograph
 * belongs in none of those.
 */
let LOADED = null;
const useImage = (img) => { LOADED = img && img.px ? img : null; return LOADED; };
const theImage = () => LOADED;
/* the crop is a full scan of the pixels — do it once per image */
const stCrop = (img) => (img.box || (img.box = bbox(img)));

function stImage(s, img) {
  return { img, src: s.imgCrop ? stCrop(img) : [0, 0, img.w, img.h],
    x: s.px, y: s.py, w: s.size, h: s.size,
    lo: s.imgLo, hi: s.imgHi, gamma: s.imgGamma, soft: s.imgSoft,
    invert: s.imgInvert, min: s.imgMin,
    cell: s.pitch, angle: s.angle, spread: s.dspread, grain: s.grain,
    seed: s.pseed | 0 };
}
/* the second plate, read for an image: shifted, or let out under the first */
const stImage2 = (s) => s.plate2 === "registre"
  ? { x: q4(s.px + s.p2dx), y: q4(s.py + s.p2dy) }
  : { spread: q4(Math.min(0.82, s.dspread * (1 + s.p2grow / 40))),
      lo: q4(Math.max(0, s.imgLo - s.p2grow / 150)) };

/* ---- what the body does to itself, in the order a press would allow ----- */
function stAppetite(f, s, cx, cy, rand) {
  if (s.morph > 0 && s.sym === "sun") {
    const cg = cellGeom({ size: s.size, seed: s.seed, sat: s.sat });
    f = sMorph(f, sShift(cellSDF(cg), s.px, s.py), s.morph);
  }
  if (s.grow) f = sGrow(f, s.grow);
  if (s.wobAmp > 0) f = sWobble(f, s.wobAmp, s.wobScale, s.seed | 0);
  if (s.twist) f = sTwist(f, cx, cy, s.twist);
  if (s.occ) f = sSub(f, sDisc(cx + s.occX, cy + s.occY, s.occR));
  if (s.bites > 0) f = sBite(f, stMouths(f, cx, cy, s.size * 0.62, s.bites, s.biteSize, rand));
  return f;
}

/* one table of measurements, read by the builder and by the emitter, so the
   plate on screen and the plate the code makes cannot drift apart */
function stMetrics(W, H) {
  const m = Math.min(W, H), R = q4(m * 0.42);
  const k = { cx: W / 2, cy: H / 2, R, m,
    brX: W * 0.09, brY: H * 0.09, brW: W * 0.82, brH: H * 0.82, brC: m * 0.05,
    axR: R * 0.92, poR: R * 0.74, tkR: R * 0.96, tkS: m * 0.012,
    bdX: W * 0.07, bdY: H - Math.max(30, H * 0.075), bdW: W * 0.86, bdH: Math.max(14, H * 0.03),
    rgA: [W * 0.06, H * 0.06], rgB: [W * 0.94, H * 0.94],
    swX: W * 0.04, swY: H * 0.62, swW: W * 0.82, swH: Math.max(28, H * 0.055) };
  for (const key in k) if (typeof k[key] === "number") k[key] = q4(k[key]);
  k.rgA = k.rgA.map(q4); k.rgB = k.rgB.map(q4);
  return k;
}
function stFurniture(s, W, H, rand) {
  const ink = INK[s.fInk], out = [], k = stMetrics(W, H);
  const line = [];
  if (s.fBrackets) line.push(brackets(k.brX, k.brY, k.brW, k.brH, k.brC));
  if (s.fAxes) line.push(axes(k.cx, k.cy, k.axR, 4, 0, rand));
  if (s.fPolar) line.push(polar(k.cx, k.cy, k.poR, 3, 24, 0, rand));
  if (s.fRing) line.push(`<circle cx="${n(k.cx)}" cy="${n(k.cy)}" r="${n(k.R)}" fill="none"/>`);
  if (line.length) out.push(G(ink, 1.2, line.join("")));
  if (s.fTicks) out.push(stTicks(k.cx, k.cy, k.tkR, 24, k.tkS, ink));
  if (s.fBand) out.push(stBand(k.bdX, k.bdY, k.bdW, k.bdH, INK[s.fBandInk]));
  if (s.fReg) out.push(stReg(k.rgA[0], k.rgA[1], 10, ink) + stReg(k.rgB[0], k.rgB[1], 10, ink));
  return out.join("");
}

/** state → a finished plate. The same route a batch script takes. */
function buildPlate(state) {
  const s = Object.assign({}, DEFAULTS, state);
  const { w: W, h: H } = sheetOf(s);
  const t0 = Date.now();
  const rand = rng((s.seed | 0) * 7 + 11);
  const img = s.sym === "image" ? theImage() : null;
  if (s.sym === "image" && !img) throw new Error("no image yet");
  const { f, solid, cx, cy } = img ? { f: null, solid: null, cx: 0, cy: 0 } : stBody(s);
  const tOpt = { weight: s.tweight, hand: s.thand, track: s.ttrack, slant: s.tslant,
                 width: s.twidth, seed: s.tseed | 0 };
  /* printed lettering joins the plate before anything is done to it */
  const base = s.tmode === "printed" && !img
    ? sUnion(f, LT.textField(s.text, s.tx, s.ty, s.tcap, tOpt)) : f;
  const field = img ? null : stAppetite(base, s, cx, cy, rand);
  const ink = INK[s.ink], k = stMetrics(W, H);
  const pr = (sdf, color, o) => screen(Object.assign({ x: 0, y: 0, w: W, h: H, sdf,
    cell: s.pitch, angle: s.angle, spread: s.dspread, falloff: s.falloff,
    grain: s.grain, seed: s.pseed | 0, color }, o));
  const layers = [];
  if (s.fSwipe) layers.push(swipe(k.swX, k.swY, k.swW, k.swH, -4, rand, INK[s.fSwipeInk]));
  if (img) {
    const box = stImage(s, img);
    const pi = (o) => screenImage(Object.assign({}, box, o));
    if (s.plate2 !== "aucune") {
      layers.push(pi(Object.assign({ angle: 75, seed: (s.pseed | 0) + 4, color: INK[s.p2ink] },
        stImage2(s))));
    }
    layers.push(pi({ color: ink }));
    /* the word cannot be fused into a photograph, but it can go through the
       same screen on the same pull */
    if (s.tmode === "printed") {
      layers.push(pr(LT.textField(s.text, s.tx, s.ty, s.tcap, tOpt), ink,
        { seed: (s.pseed | 0) + 1 }));
    }
  } else if (s.mode === "plein") {
    layers.push(solid || "");
  } else {
    if (s.plate2 === "registre") {
      layers.push(pr(sShift(field, s.p2dx, s.p2dy), INK[s.p2ink], { angle: 75, seed: (s.pseed | 0) + 4 }));
    } else if (s.plate2 === "grossi") {
      layers.push(pr(sGrow(field, s.p2grow), INK[s.p2ink], { angle: 75, seed: (s.pseed | 0) + 4 }));
    }
    layers.push(pr(field, ink));
  }
  if (s.tmode === "cut") layers.push(LT.textSolid(s.text, s.tx, s.ty, s.tcap,
    Object.assign({ color: ink }, tOpt)));
  layers.push(stFurniture(s, W, H, rand));
  const bg = s.bg === "none" ? null : INK[s.bg];
  const marks = s.trimMarks ? G(INK[s.fInk], 1.1, trim(W, H, 16, 8)) : "";
  const out = svg(W, H, layers.join("") + marks, bg);
  return { svg: out, w: W, h: H,
    dots: (out.match(/<circle/g) || []).length,
    kb: Math.round(out.length / 1024), ms: Date.now() - t0 };
}

/* ---- the same state, as the code a batch script would hold -------------- */
function emitPlate(state) {
  const s = Object.assign({}, DEFAULTS, state);
  const { w: W, h: H } = sheetOf(s);
  const K = (v) => `INK.${v}`;
  const L = [], size = s.size, cx = q4(s.px + size / 2), cy = q4(s.py + size / 2);
  const sym = s.sym, k = stMetrics(W, H);
  if (sym === "image") {
    L.push(`/* the image itself is not in this file — put ${s.imgName} beside the script */`);
    L.push(`const IMG = readPNG(path.join(__dirname, ${JSON.stringify(s.imgName)}));`);
    L.push("");
  }
  L.push(`plate("${String(s.num).padStart(2, "0")}-${s.name}", ${W}, ${H}, () => {`);
  L.push(`  const q = rng(${(s.seed | 0) * 7 + 11});   /* the atelier's hand, so this plate is that plate */`);

  if (sym === "sun" || sym === "two" || sym === "corona" || sym === "lace") {
    L.push(`  const g = sunGeom({ size: ${size}, seed: ${s.seed}, rays: ${s.rays}, `
      + `disc: ${s.disc}, short: ${s.reachA}, long: ${s.reachB} });`);
    L.push(`  let f = sShift(sunSDF(g), ${s.px}, ${s.py});`);
    if (sym === "corona") L.push(`  f = sSub(f, sDisc(${cx}, ${cy}, ${q4(size * s.disc * 0.98)}));`);
    if (sym === "lace") {
      L.push(`  const holes = phylloPts(${cx}, ${cy}, ${s.seeds}, { c: ${s.gspace}, `
        + `r0: ${q4(s.gspace * 0.36)}, r1: ${q4(s.gspace * 0.82)} });`);
      L.push(`  f = sSub(sGrow(f, ${q4(size * 0.028)}), sPts(holes, 1.5));`);
    }
  }
  if (sym === "cell" || sym === "two") {
    const off = sym === "two" ? q4(size * 0.34) : 0;
    const cs = sym === "two" ? q4(size * 0.85) : size;
    L.push(`  const cg = cellGeom({ size: ${cs}, seed: ${s.seed}, sat: ${s.sat} });`);
    L.push(sym === "two"
      ? `  f = sSmooth(f, sShift(cellSDF(cg), ${q4(s.px + off)}, ${q4(s.py + off)}), ${q4(size * 0.12)});`
      : `  let f = sShift(cellSDF(cg), ${s.px}, ${s.py});`);
  }
  if (sym === "network" || sym === "field") {
    const at = stScatter(s);
    L.push(`  const at = [${at.map((a) => "[" + a.join(", ") + "]").join(", ")}];`);
    L.push(sym === "network"
      ? `  let f = sScatter(at.map(([x, y, z, d, b]) => ({ f: sShift(cellSDF(cellGeom({ size: z, seed: d, `
        + `sat: ${s.sat} })), x, y), cx: x + z / 2, cy: y + z / 2, r: b })));`
      : `  let f = sScatter(at.map(([x, y, z, d, b]) => ({ f: sShift(sunSDF(sunGeom({ size: z, seed: d, `
        + `rays: ${s.rays}, disc: ${s.disc}, short: ${s.reachA}, long: ${s.reachB} })), x, y), `
        + `cx: x + z / 2, cy: y + z / 2, r: b })));`);
  }
  if (sym === "seed") {
    L.push(`  const pts = phylloPts(${cx}, ${cy}, ${s.seeds}, { c: ${s.gspace}, `
      + `r0: ${q4(s.gspace * 0.25)}, r1: ${q4(s.gspace * 0.85)} });`);
    L.push(`  let f = sPts(pts);`);
  }
  if (sym === "spiral" || sym === "shell") {
    L.push(`  const taper = ${q4(s.sband / 120)};`);
    L.push(`  let f = sSpiral(${cx}, ${cy}, { a: ${stSpiralA(s)}, b: ${s.tight}, turns: ${s.turns}, `
      + `w: (rr) => Math.max(2.5, Math.min(${s.sband}, rr * taper)) });`);
  }
  if (sym === "rings") {
    const rr = [];
    for (let i = 0; i < s.ringN; i++) rr.push(q4((size * 0.5 * (i + 1)) / s.ringN));
    L.push(`  let f = sUnion(${rr.map((r) => `sRing(${cx}, ${cy}, ${r}, ${s.ringW})`).join(", ")});`);
  }
  if (sym === "disc") L.push(`  let f = sDisc(${cx}, ${cy}, ${q4(size * 0.32)});`);

  const tOpts = `{ weight: ${s.tweight}, hand: ${s.thand}, track: ${s.ttrack}, `
    + `slant: ${s.tslant}, width: ${s.twidth}, seed: ${s.tseed | 0} }`;
  const isImg = sym === "image";
  if (s.tmode === "printed" && !isImg)
    L.push(`  f = sUnion(f, textField(${JSON.stringify(s.text)}, ${s.tx}, ${s.ty}, ${s.tcap}, ${tOpts}));`);
  if (s.morph > 0 && sym === "sun" && !isImg)
    L.push(`  f = sMorph(f, sShift(cellSDF(cellGeom({ size: ${size}, seed: ${s.seed}, `
      + `sat: ${s.sat} })), ${s.px}, ${s.py}), ${s.morph});`);
  if (s.grow && !isImg) L.push(`  f = sGrow(f, ${s.grow});`);
  if (s.wobAmp > 0 && !isImg) L.push(`  f = sWobble(f, ${s.wobAmp}, ${s.wobScale}, ${s.seed | 0});`);
  if (s.twist && !isImg) L.push(`  f = sTwist(f, ${cx}, ${cy}, ${s.twist});`);
  if (s.occ && !isImg) L.push(`  f = sSub(f, sDisc(${q4(cx + s.occX)}, ${q4(cy + s.occY)}, ${s.occR}));`);
  if (s.bites > 0 && !isImg)
    L.push(`  f = sBite(f, mouths(f, ${cx}, ${cy}, ${q4(size * 0.62)}, ${s.bites}, ${s.biteSize}, q));`);

  const scr = (sdf, color, angle, seed) => `screen({ x: 0, y: 0, w: ${W}, h: ${H}, sdf: ${sdf}, `
    + `cell: ${s.pitch}, falloff: ${s.falloff}, spread: ${s.dspread}, grain: ${s.grain}, `
    + `angle: ${angle}, seed: ${seed}, color: ${K(color)} })`;
  const body = [];
  if (s.fSwipe) body.push(`swipe(${k.swX}, ${k.swY}, ${k.swW}, ${k.swH}, -4, q, ${K(s.fSwipeInk)})`);
  if (isImg) {
    const img = theImage();
    const src = img ? (s.imgCrop ? stCrop(img) : [0, 0, img.w, img.h]) : null;
    const im = (o) => {
      const g = Object.assign({ angle: s.angle, spread: s.dspread, lo: s.imgLo,
        x: s.px, y: s.py, seed: s.pseed | 0, color: s.ink }, o);
      return `screenImage({ img: IMG, src: ${src ? `[${src.join(", ")}]` : "bbox(IMG)"}, `
        + `x: ${g.x}, y: ${g.y}, w: ${size}, h: ${size},\n      `
        + `lo: ${g.lo}, hi: ${s.imgHi}, gamma: ${s.imgGamma}, soft: ${s.imgSoft}, `
        + `min: ${s.imgMin},${s.imgInvert ? " invert: true," : ""}\n      `
        + `cell: ${s.pitch}, angle: ${g.angle}, spread: ${g.spread}, grain: ${s.grain}, `
        + `seed: ${g.seed}, color: ${K(g.color)} })`;
    };
    if (s.plate2 !== "aucune") {
      body.push(im(Object.assign({ angle: 75, seed: (s.pseed | 0) + 4, color: s.p2ink },
        stImage2(s))));
    }
    body.push(im({}));
    if (s.tmode === "printed") body.push(scr(`textField(${JSON.stringify(s.text)}, `
      + `${s.tx}, ${s.ty}, ${s.tcap}, ${tOpts})`, s.ink, s.angle, (s.pseed | 0) + 1));
  } else if (s.mode === "plein") {
    const rr = [];
    for (let i = 0; i < s.ringN; i++) rr.push(q4((size * 0.5 * (i + 1)) / s.ringN));
    const solids = {
      sun: s.twist ? `place(${s.px}, ${s.py}, sunWhirl(g, ${K(s.ink)}, ${s.twist}))`
                   : `place(${s.px}, ${s.py}, sunSolid(g, ${K(s.ink)}))`,
      corona: `place(${s.px}, ${s.py}, sunSolid(g, ${K(s.ink)}, { disc: false }))`,
      cell: `place(${s.px}, ${s.py}, cell({ size: ${size}, seed: ${s.seed}, sat: ${s.sat}, color: ${K(s.ink)} }))`,
      network: `at.map(([x, y, z, d, b]) => place(x, y, cell({ size: z, seed: d, sat: ${s.sat}, color: ${K(s.ink)} }))).join("")`,
      field: `at.map(([x, y, z, d, b]) => place(x, y, sunSolid(sunGeom({ size: z, seed: d, rays: ${s.rays}, `
        + `disc: ${s.disc}, short: ${s.reachA}, long: ${s.reachB} }), ${K(s.ink)}))).join("")`,
      rings: `G(${K(s.ink)}, ${s.ringW}, ${rr.map((r) => JSON.stringify(
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"/>`)).join(" + ")})`,
      seed: `discs(pts, ${K(s.ink)})`,
      lace: `place(${s.px}, ${s.py}, sunSolid(g, ${K(s.ink)})) + discs(holes, ${K(s.bg === "none" ? "white" : s.bg)})`,
      two: `place(${s.px}, ${s.py}, sunSolid(g, ${K(s.ink)}))\n    + place(${q4(s.px + q4(size * 0.34))}, ${q4(s.py + q4(size * 0.34))}, cell({ size: ${q4(size * 0.85)}, seed: ${s.seed}, sat: ${s.sat}, color: ${K(s.ink)} }))`,
      spiral: `G(${K(s.ink)}, ${q4(s.sband * 0.35)}, spiralPath(${cx}, ${cy}, { a: ${stSpiralA(s)}, b: ${s.tight}, turns: ${s.turns}, step: 7 }))`,
      shell: `G(${K(s.ink)}, 0.9, spiralWalls(${cx}, ${cy}, { a: ${stSpiralA(s)}, b: ${s.tight}, turns: ${s.turns} }))\n    + G(${K(s.ink)}, ${q4(s.sband * 0.35)}, spiralPath(${cx}, ${cy}, { a: ${stSpiralA(s)}, b: ${s.tight}, turns: ${s.turns}, step: 7 }))`,
      disc: JSON.stringify(`<circle cx="${cx}" cy="${cy}" r="${q4(size * 0.32)}" fill="${INK[s.ink]}"/>`),
    };
    body.push(solids[sym] || `/* ${sym}: cut it solid in the atelier, or screen it here */`);
  } else {
    const p2seed = (s.pseed | 0) + 4;
    if (s.plate2 === "registre") body.push(scr(`sShift(f, ${s.p2dx}, ${s.p2dy})`, s.p2ink, 75, p2seed));
    if (s.plate2 === "grossi") body.push(scr(`sGrow(f, ${s.p2grow})`, s.p2ink, 75, p2seed));
    body.push(scr("f", s.ink, s.angle, s.pseed | 0));
  }
  if (s.tmode === "cut")
    body.push(`textSolid(${JSON.stringify(s.text)}, ${s.tx}, ${s.ty}, ${s.tcap}, `
      + `Object.assign({ color: ${K(s.ink)} }, ${tOpts}))`);
  const furn = [];
  if (s.fBrackets) furn.push(`brackets(${k.brX}, ${k.brY}, ${k.brW}, ${k.brH}, ${k.brC})`);
  if (s.fAxes) furn.push(`axes(${k.cx}, ${k.cy}, ${k.axR}, 4, 0, q)`);
  if (s.fPolar) furn.push(`polar(${k.cx}, ${k.cy}, ${k.poR}, 3, 24, 0, q)`);
  if (s.fRing) furn.push(JSON.stringify(`<circle cx="${k.cx}" cy="${k.cy}" r="${k.R}" fill="none"/>`));
  if (furn.length) body.push(`G(${K(s.fInk)}, 1.2, ${furn.join(" + ")})`);
  if (s.fTicks) body.push(`ticks(${k.cx}, ${k.cy}, ${k.tkR}, 24, ${k.tkS}, ${K(s.fInk)})`);
  if (s.fBand) body.push(`band(${k.bdX}, ${k.bdY}, ${k.bdW}, ${k.bdH}, ${K(s.fBandInk)})`);
  if (s.fReg) body.push(`reg(${k.rgA[0]}, ${k.rgA[1]}, 10, ${K(s.fInk)}) + reg(${k.rgB[0]}, ${k.rgB[1]}, 10, ${K(s.fInk)})`);
  L.push(`  return { bg: ${s.bg === "none" ? "null" : K(s.bg)}, ink: ${K(s.fInk)}, `
    + `${s.trimMarks ? "" : "trim: false, "}body:`);
  L.push("    " + body.join("\n    + ") + " };");
  L.push("});");
  /* say what the paste needs, so it drops into a batch script without hunting */
  const code = L.join("\n");
  const NEEDS = ["sunGeom", "sunSolid", "sunSDF", "sunWhirl", "cell", "cellGeom", "cellSDF",
    "phylloPts", "sPts", "sScatter", "sSpiral", "spiralPath", "spiralWalls", "screen", "sDisc", "sRing", "sUnion", "sSub",
    "sShift", "sTwist", "sGrow", "sSmooth", "sMorph", "sWobble", "sBite"]
    .filter((k) => new RegExp("\\b" + k + "\\(").test(code));
  const FROM_SHEET = ["rng", "place", "G", "swipe", "axes", "brackets", "polar", "ticks",
    "band", "reg", "frame", "mouths", "discs"].filter((k) => new RegExp("\\b" + k + "\\(").test(code));
  const FROM_LETTERS = ["textField", "textSolid"].filter((k) => new RegExp("\\b" + k + "\\(").test(code));
  const FROM_RASTER = ["readPNG", "screenImage", "bbox"]
    .filter((k) => new RegExp("\\b" + k + "\\(").test(code));
  const from = [["_glyphs.js", NEEDS], ["_sheet.js", FROM_SHEET],
    ["_letters.js", FROM_LETTERS], ["_raster.js", FROM_RASTER]].filter((p) => p[1].length);
  return "/* " + from.map((p) => `from ${p[0]}: ${p[1].join(", ")}`).join("\n   ") + " */\n" + code;
}

/* ---- the same plate, cheap enough to look at ---------------------------
 * A screened plate is tens of thousands of <circle> elements. That is the
 * right file to hand a printer and the wrong thing to put in a browser's
 * DOM, so the preview collapses every run of dots into one <path> of arcs:
 * the same picture, one node instead of ninety thousand. Export is never
 * compacted — the plate that leaves here is the canonical one.
 */
const DOT = /<circle cx="(-?[\d.]+)" cy="(-?[\d.]+)" r="([\d.]+)"\/>/g;
function compactDots(svgText, prec) {
  const q = (v) => Number(v.toFixed(prec === undefined ? 1 : prec));   /* screen-true is enough */
  return svgText.replace(/<g fill="([^"]+)">((?:<circle [^>]*\/>)+)<\/g>/g, (m, fill, body) => {
    let d = "";
    body.replace(DOT, (mm, x, y, r) => {
      const R = q(+r), D = q(R * 2);
      d += `M${q(+x - R)} ${q(+y)}a${R} ${R} 0 1 0 ${D} 0a${R} ${R} 0 1 0 ${-D} 0`;
      return "";
    });
    return `<path fill="${fill}" d="${d}"/>`;
  });
}

/* the roll: the decision the rouleau plates make (88, 115, 131), as a button */
function rollState(seed) {
  const r = rng(seed || Math.floor(Math.random() * 99999) + 1);
  const pick2 = (a) => a[Math.floor(r() * a.length) % a.length];
  const fmt = pick2(SHEETS.filter((f) => f.id !== "libre")).id;
  const dims = SHEETS.find((f) => f.id === fmt);
  const sym = pick2(["sun", "sun", "cell", "seed", "spiral", "two", "corona",
                     "network", "lace", "rings", "field", "shell"]);
  const bg = pick2(["white", "white", "black", "fluo"]);
  const ink = bg === "black" ? "white" : "black";
  const size = Math.round(Math.min(dims.w, dims.h) * (0.6 + r() * 0.9));
  return Object.assign({}, DEFAULTS, {
    format: fmt, bg, ink, sym, size, seed: Math.floor(r() * 900) + 3,
    px: Math.round((dims.w - size * 0.8) * r()), py: Math.round((dims.h - size * 0.8) * r()),
    rays: 14 + Math.floor(r() * 26), disc: Number((0.14 + r() * 0.12).toFixed(3)),
    reachA: Number((0.26 + r() * 0.1).toFixed(2)), reachB: Number((0.4 + r() * 0.12).toFixed(2)),
    sat: 3 + Math.floor(r() * 4), count: 3 + Math.floor(r() * 9),
    seeds: 120 + Math.floor(r() * 380), gspace: Number((10 + r() * 12).toFixed(1)),
    turns: Number((1.4 + r() * 2.6).toFixed(2)), tight: Number((0.12 + r() * 0.16).toFixed(3)),
    sband: 6 + Math.round(r() * 22), ringN: 3 + Math.floor(r() * 8), ringW: 3 + Math.round(r() * 16),
    grow: r() > 0.5 ? Math.round(-10 + r() * 34) : 0,
    twist: r() > 0.55 ? Number(((r() - 0.45) * 0.02).toFixed(4)) : 0,
    wobAmp: r() > 0.6 ? Math.round(r() * 12) : 0, wobScale: 20 + Math.round(r() * 70),
    bites: r() > 0.5 ? 2 + Math.floor(r() * 9) : 0, biteSize: 24 + Math.round(r() * 80),
    mode: r() > 0.82 ? "plein" : "ecran",
    pitch: Number((2.6 + r() * 4.6).toFixed(1)), angle: Math.round(r() * 90),
    dspread: Number((0.46 + r() * 0.22).toFixed(2)), falloff: Number((5 + r() * 10).toFixed(1)),
    grain: Number((0.1 + r() * 0.2).toFixed(2)), pseed: Math.floor(r() * 60) + 3,
    plate2: r() > 0.78 ? pick2(["registre", "grossi"]) : "aucune",
    fInk: ink, fBrackets: r() > 0.6, fAxes: r() > 0.7, fPolar: r() > 0.82,
    fRing: r() > 0.8, fTicks: r() > 0.7, fBand: r() > 0.7,
    fBandInk: bg === "fluo" ? "black" : "fluo",
    fSwipe: r() > 0.7, fSwipeInk: bg === "fluo" ? "blu" : "fluo", fReg: r() > 0.7,
  });
}

module.exports = { PARAMS, FIELDS, DEFAULTS, SHEETS, INKS, INK, stMetrics, compactDots,
  buildPlate, emitPlate, rollState, sheetOf, visible, useImage, theImage };
