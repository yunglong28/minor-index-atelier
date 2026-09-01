/* The press, watched.
 *
 * Two claims live here. First, that a plate handed over band by band is the
 * same plate as one handed over whole — the hooks say when, never what.
 * Second, that the bounding circle every body carries is honest: the copier
 * skips asking the field only where the answer could not have printed a dot.
 * That second one is really tested next door, in roundtrip.js, because the
 * code emitPlate writes screens without a bound at all — so if a bound ever
 * clipped one dot, seventy-one plates would stop matching.
 */
const path = require("path");
const T = require("./_t.js");
const ROOT = path.join(__dirname, "..");
const ST = require(path.join(ROOT, "_studio.js"));

T.head("the press — a plate that arrives in bands is the plate");

function streamed(state) {
  let head = "", tail = "", ink = "";
  const bands = [];
  const whole = ST.buildPlate(state, {
    open: (h) => { head = h; },
    band: (c) => { bands.push(c); },
    close: (t) => { tail = t; },
  });
  return { whole: whole.svg, joined: head + bands.join("") + tail, bands: bands.length };
}

function watch(label, over) {
  const st = Object.assign({}, ST.DEFAULTS, { num: 400, name: "t" }, over);
  const r = streamed(st);
  T.same(label + " — reassembles byte for byte", r.whole, r.joined);
  return r;
}

const a = watch("a sun", {});
T.ok("and it arrives in more than one band (" + a.bands + ")", a.bands > 4, a.bands);
watch("a cell", { sym: "cell" });
watch("a network on a landscape sheet", { sym: "network", format: "paysage", count: 8 });
watch("with a second plate under it", { plate2: "grossi", p2grow: 12 });
watch("with furniture and a swipe", { fSwipe: true, fBrackets: true, fTicks: true, fBand: true });
watch("with a word printed into it", { tmode: "printed" });
watch("with a word cut over it", { tmode: "cut" });
watch("bitten, twisted and trembling", { twist: 0.005, wobAmp: 8, bites: 6, grow: 7 });
watch("on a strip", { format: "bande" });
watch("no ground, no trim", { bg: "none", trimMarks: false });

/* a word with nothing grown under it is a field like any other, and arrives
   in bands like one */
const w = watch("a word alone on the sheet", { sym: "none", tmode: "printed" });
T.ok("and it too arrives in bands (" + w.bands + ")", w.bands > 0, w.bands);

/* but a sheet with nothing on it at all has no pass to watch, and must still
   come out a plate: a ground, its trim marks, and whatever furniture is set */
const bare = ST.buildPlate(Object.assign({}, ST.DEFAULTS, { sym: "none", fBrackets: true }),
  { open: () => T.ok("a bare sheet opens no stream", false), band: () => {}, close: () => {} });
T.ok("a bare sheet still prints, and holds no dot",
  bare.svg.indexOf("<svg") === 0 && bare.dots === 0 && bare.svg.indexOf("<path") > 0,
  bare.dots + " dots, " + bare.kb + "kb");

/* a flat cut has no long pass to watch — it must still come out whole */
const flat = ST.buildPlate(Object.assign({}, ST.DEFAULTS, { mode: "plein" }),
  { open: () => T.ok("a flat cut opens no stream", false), band: () => {}, close: () => {} });
T.ok("a flat cut still prints", flat.svg.indexOf("<svg") === 0 && flat.svg.length > 500);

/* the shortcut has to be worth taking */
const heavy = Object.assign({}, ST.DEFAULTS, { format: "libre", w: 1400, h: 1400,
  sym: "cell", size: 500, px: 450, py: 450, pitch: 2.4 });
const t0 = Date.now(); ST.buildPlate(heavy); const withBound = Date.now() - t0;
T.ok("a small body on a large sheet prints in well under a second (" + withBound + "ms)",
  withBound < 900, withBound + "ms");

module.exports = T.counts;
if (require.main === module) process.exit(T.report() ? 0 : 1);
