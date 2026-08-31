/* MINOR INDEX — the sheet, and the plumbing every generator repeats.
 *
 * One import for a batch script: the palette, the instrument parts, a
 * writer, a CLI (seed + --only), and the gallery it leaves behind.
 *
 * A batch is a table of plates. Each plate is { name, w, h, draw(r) }, where
 * r is a seeded rng belonging to that plate alone, and draw returns either a
 * body string or { bg, body, trim }. Nothing else is required of it.
 */
const fs = require("fs");
const path = require("path");
const M = require("./_mark.js");
const Y = require("./_glyphs.js");

const { INK, GROT, MONO, ARMS, n, rng, pick, segDist,
        L, axes, brackets, dimension, callout, trim, polar, swipe, under, svg, G } = M;

/* the furniture, the sheet and the placing live in `_furniture.js`, which
   touches no disk, so the atelier can have the same copy the batches do */
const FURN = require("./_furniture.js");
const { ticks, reg, band, frame, discs, place, print, mouths, sheet } = FURN;

/** args: `node logo/mkX.js 5150 --only 77,80` */
function args(argv) {
  const rest = argv.slice(2);
  const oi = rest.indexOf("--only");
  const only = oi < 0 ? null : new Set(rest[oi + 1].split(",").map((s) => s.trim()));
  /* the plate list is not a seed: `--only 113` must not roll the batch at 113 */
  const given = rest.find((a, i) => /^\d+$/.test(a) && (oi < 0 || i !== oi + 1));
  return { seed: parseInt(given || "6104", 10), only, explicit: given !== undefined };
}

/** every SVG in the folder, in plate order, as one page to flick through */
function writeIndex(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".svg"))
    .sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0));
  const cards = files.map((f) =>
    `<figure><img src="${f}" alt="${f}" loading="lazy"><figcaption>${f.replace(/\.svg$/, "")}</figcaption></figure>`).join("\n");
  fs.writeFileSync(path.join(dir, "index.html"),
`<!doctype html><meta charset="utf-8"><title>MINOR INDEX — plates</title>
<style>
  :root { color-scheme: light dark; --bg:#8f8f8c; --fg:${INK.black}; }
  body { margin:0; padding:28px; background:var(--bg); font:12px/1.4 ui-monospace,Menlo,monospace; }
  main { display:grid; gap:22px; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); }
  figure { margin:0; background:#fff; box-shadow:0 1px 0 rgba(0,0,0,.35); }
  img { display:block; width:100%; height:auto; }
  figcaption { padding:6px 8px; color:var(--fg); background:${INK.grey}; }
</style>
<main>
${cards}
</main>
`);
  return files.length;
}

/** where the printed plates live, next to the scripts that print them */
const PLATES = (dir) => {
  const p = path.join(dir, "plates");
  fs.mkdirSync(p, { recursive: true });
  return p;
};

/** run a batch: write every plate, then the gallery
 *
 * A plate may pin the seed it was printed at (`{ seed: 88 }`). A roll plate
 * is a plate someone kept out of a pile, and the pile it came out of is part
 * of the file: without the pin a bare run silently prints a different one.
 * An explicit seed on the command line still rerolls everything — that is
 * what asking for a seed means.
 */
function run(root, plates, argv) {
  const dir = PLATES(root);
  const { seed, only, explicit } = args(argv || process.argv);
  let wrote = 0;
  for (let i = 0; i < plates.length; i++) {
    const p = plates[i];
    const num = String(parseInt(p.name, 10));
    if (only && !only.has(num) && !only.has(p.name)) continue;
    const sd = !explicit && p.seed !== undefined ? p.seed : seed;
    const out = p.draw(rng(sd + i * 97 + 13), sd);
    const body = typeof out === "string" ? { body: out } : out;
    const c = sheet(p.w || body.w, p.h || body.h, body);
    fs.writeFileSync(path.join(dir, p.name + ".svg"), c);
    console.log(`${p.name}.svg  ${(c.length / 1024).toFixed(0)}kb`);
    wrote++;
  }
  const N = writeIndex(dir);
  console.log(`→ ${wrote} plate(s), ${N} in ${dir}/index.html   (reroll: node ${path.basename(process.argv[1])} 5150)`);
}

module.exports = Object.assign({}, M, FURN,
  { run, writeIndex, args, PLATES });
