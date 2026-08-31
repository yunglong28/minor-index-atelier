/* House rules, as tests. Not a style checker — four things that have gone
 * wrong here before and would go wrong again silently.
 */
const fs = require("fs");
const path = require("path");
const T = require("./_t.js");
const ROOT = path.join(__dirname, "..");

T.head("house rules");

const js = fs.readdirSync(ROOT).filter((f) => /\.js$/.test(f));
const src = {};
for (const f of js) src[f] = fs.readFileSync(path.join(ROOT, f), "utf8");

/* 1. every file parses */
for (const f of js) {
  try { new Function(src[f]); T.ok(f + " parses", true); }
  catch (e) { T.ok(f + " parses", false, e.message); }
}

/* 2. the bundle ships to a browser: no fs, no path, outside the node-only files */
const NODE_ONLY = new Set(["_sheet.js", "mkbundle.js", "mkfont.js"]);
const BUNDLED = ["_mark.js", "_press.js", "_glyphs.js", "_letters.js", "_furniture.js",
                 "_font.js", "_raster.js", "_studio.js"].filter((f) => src[f]);
for (const f of BUNDLED) {
  const bad = [];
  /* _raster.js requires fs deliberately and guards the one call that needs it */
  if (f !== "_raster.js" && /require\(["']fs["']\)/.test(src[f])) bad.push("fs");
  if (/require\(["']path["']\)/.test(src[f])) bad.push("path");
  T.ok(f + " can run in a page", bad.length === 0, "requires " + bad.join(", "));
}

/* 3. one Lehmer generator, not eight */
const LEHMER = /16807/g;
const copies = [];
for (const f of js) {
  const n = (src[f].match(LEHMER) || []).length;
  /* _mark.js owns it; the first-generation scripts are frozen with their plates */
  const frozen = ["_mark.js", "mklogo.js", "mkalt.js", "mkreticle.js", "_type.js"];
  if (n && frozen.indexOf(f) < 0) copies.push(f + "(" + n + ")");
}
T.ok("the random generator is written once", copies.length === 0, copies.join(" "));

/* 4. the ink table is in _mark.js, and the pages take it from there */
const hexes = /#(?:141410|f4f4f2|e4e4e0|e8ff00|001ef7)\b/gi;
const strays = [];
for (const f of js) {
  if (f === "_mark.js") continue;
  /* the retired palette of plates 01–40, and the retired 5×7 alphabet of
     53–76, are frozen with the plates that were printed from them */
  if (["mklogo.js", "mkalt.js", "mkreticle.js", "_type.js"].indexOf(f) >= 0) continue;
  const m = src[f].match(hexes);
  if (m) strays.push(f + "(" + m.length + ")");
}
T.ok("nothing but _mark.js writes an ink out in hex", strays.length === 0, strays.join(" "));

/* and the pages ask for the table by name rather than copying it */
const pages = fs.existsSync(path.join(ROOT, "src"))
  ? fs.readdirSync(path.join(ROOT, "src")).filter((f) => /\.html$/.test(f)) : [];
const painted = pages.filter((f) =>
  hexes.test(fs.readFileSync(path.join(ROOT, "src", f), "utf8")));
T.ok("the source pages take their palette from _mark.js (" + pages.length + ")",
  painted.length === 0, painted.join(" "));

module.exports = T.counts;
if (require.main === module) process.exit(T.report() ? 0 : 1);
