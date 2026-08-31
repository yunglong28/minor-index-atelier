/* The published site is generated. A stale bundle is a page that quietly
 * disagrees with the repository, so it is checked rather than remembered.
 */
const fs = require("fs");
const path = require("path");
const T = require("./_t.js");
const ROOT = path.join(__dirname, "..");
const B = require(path.join(ROOT, "mkbundle.js"));

T.head("the site — docs/ is what mkbundle.js writes, and nothing else");

const out = B.build();
for (const file in out) {
  const at = path.join(ROOT, "docs", file);
  if (!fs.existsSync(at)) { T.ok("docs/" + file + " exists", false, "run `node mkbundle.js --inline`"); continue; }
  const have = fs.readFileSync(at, typeof out[file] === "string" ? "utf8" : null);
  const want = out[file];
  if (typeof want === "string") T.same("docs/" + file + " is current", want, have);
  else T.ok("docs/" + file + " is current", Buffer.compare(Buffer.from(want), have) === 0);
}

T.ok("docs/.nojekyll is there — Pages drops _bundle.js without it",
  fs.existsSync(path.join(ROOT, "docs", ".nojekyll")));

/* the two traps the README names, as tests rather than as warnings */
const page = fs.readFileSync(path.join(ROOT, "docs", "index.html"), "utf8");
const spec = fs.readFileSync(path.join(ROOT, "docs", "specimen.html"), "utf8");
const art = fs.readFileSync(path.join(ROOT, "docs", "atelier.html"), "utf8");
T.ok("the served pages declare a doctype — without it a table loses its colour",
  /^<!doctype html>/i.test(page) && /^<!doctype html>/i.test(spec));
T.ok("the artifact copy brings no second doctype", !/<!doctype/i.test(art));
T.ok("the artifact copy has nothing external to fetch",
  !/<script[^>]+src=/i.test(art) && !/<link[^>]+stylesheet[^>]*href="[^"]*_/i.test(art));

/* everything the atelier reaches for has to be on window.MINOR */
const bundle = out["_bundle.js"];
const used = new Set();
page.replace(/\bM\.([A-Za-z_$][\w$]*)/g, (m, k) => { used.add(k); return m; });
const missing = [...used].filter((k) => !new RegExp("^\\s*" + k + ":", "m").test(bundle));
T.ok("the page asks for nothing the bundle does not expose", missing.length === 0, missing.join(" "));

module.exports = T.counts;
if (require.main === module) process.exit(T.report() ? 0 : 1);
