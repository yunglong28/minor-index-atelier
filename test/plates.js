/* The repository has to be able to print itself.
 *
 * Every batch is run into a scratch directory and its plates compared with
 * the ones that are committed. This is the test that catches a roll plate
 * losing the seed it was rolled at.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const T = require("./_t.js");
const ROOT = path.join(__dirname, "..");
const S = require(path.join(ROOT, "_sheet.js"));

const BATCHES = ["mklogo", "mkalt", "mkreticle", "mkwild", "mktype",
                 "mkposter", "mksol", "mkpoke", "mkspiral", "mkautophagie"];

T.head("the plates — every batch still prints the files that are committed");

/* run a batch without letting it write: catch the plate table `run` is given,
   and draw it here. The first-generation scripts write their own files, so
   they are given a scratch directory instead. */
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "minor-plates-"));
const realRun = S.run;
const realPlates = S.PLATES;
let captured = null;
S.run = function (root, plates, argv) { captured = { plates: plates, argv: argv }; };
S.PLATES = function () { fs.mkdirSync(path.join(scratch, "plates"), { recursive: true }); 
                         return path.join(scratch, "plates"); };

const seen = new Set();
let missing = 0;
for (const b of BATCHES) {
  captured = null;
  const argv = process.argv;
  process.argv = [argv[0], path.join(ROOT, b + ".js")];
  try { require(path.join(ROOT, b + ".js")); }
  catch (e) { T.ok(b + " runs", false, e.stack); process.argv = argv; continue; }
  process.argv = argv;

  if (!captured) {                    /* a first-generation script: it wrote its own */
    const dir = path.join(scratch, "plates");
    const wrote = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".svg")) : [];
    let bad = 0;
    for (const f of wrote) {
      if (seen.has(f)) continue;
      seen.add(f);
      const want = path.join(ROOT, "plates", f);
      if (!fs.existsSync(want)) { missing++; continue; }
      if (fs.readFileSync(want, "utf8") !== fs.readFileSync(path.join(dir, f), "utf8")) {
        bad++; T.ok(b + " → " + f, false, "the printed plate is not the committed one");
      }
    }
    if (!bad) T.ok(b + " — " + wrote.length + " plate(s) unchanged", true);
    for (const f of wrote) fs.unlinkSync(path.join(dir, f));
    continue;
  }

  const { seed, only } = S.args(captured.argv || process.argv);
  let bad = 0, n = 0;
  for (let i = 0; i < captured.plates.length; i++) {
    const p = captured.plates[i];
    /* a plate may pin the seed it was rolled at; the batch seed is the default */
    const sd = p.seed === undefined ? seed : p.seed;
    const out = p.draw(S.rng(sd + i * 97 + 13), sd);
    const body = typeof out === "string" ? { body: out } : out;
    const made = S.sheet(p.w || body.w, p.h || body.h, body);
    const want = path.join(ROOT, "plates", p.name + ".svg");
    n++;
    if (!fs.existsSync(want)) { missing++; T.ok(p.name, false, "no committed plate"); continue; }
    if (fs.readFileSync(want, "utf8") !== made) {
      bad++;
      T.ok(b + " → " + p.name, false, "the printed plate is not the committed one"
        + (p.seed === undefined ? "\n(if this plate was rolled at a seed, pin it with `seed:` on the plate)" : ""));
    }
  }
  if (!bad) T.ok(b + " — " + n + " plate(s) unchanged", true);
}
S.run = realRun; S.PLATES = realPlates;
try { fs.rmSync(scratch, { recursive: true, force: true }); } catch (e) {}

T.ok("no batch printed a plate that is not committed", missing === 0, missing + " unaccounted for");

/* and nothing committed is orphaned */
const committed = fs.readdirSync(path.join(ROOT, "plates")).filter((f) => f.endsWith(".svg"));
T.ok("the contact sheet lists every plate (" + committed.length + ")",
  fs.readFileSync(path.join(ROOT, "plates", "index.html"), "utf8")
    .split("<figure>").length - 1 === committed.length);

module.exports = T.counts;
if (require.main === module) process.exit(T.report() ? 0 : 1);
