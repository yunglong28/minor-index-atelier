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
        L, axes, brackets, dimension, callout, trim, polar, swipe, svg, G } = M;

/* ---- the parts every batch was redefining ------------------------------
   ticks, registration, bands, frames, a screened window and mouths taken out
   of a contour: written three times each before they were moved here, and
   the atelier (`_studio.js`) emits code that expects them. */
const ticks = (cx, cy, r, count, size, color) => {
  const out = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    out.push(`<rect x="${n(cx + Math.cos(a) * r - size / 2)}" y="${n(cy + Math.sin(a) * r - size / 2)}" `
      + `width="${n(size)}" height="${n(size)}"/>`);
  }
  return `<g fill="${color}">${out.join("")}</g>`;
};
const reg = (cx, cy, r, color) =>
  G(color, 1.2, `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none"/>`
    + `<line x1="${n(cx - r * 1.7)}" y1="${n(cy)}" x2="${n(cx + r * 1.7)}" y2="${n(cy)}"/>`
    + `<line x1="${n(cx)}" y1="${n(cy - r * 1.7)}" x2="${n(cx)}" y2="${n(cy + r * 1.7)}"/>`);
const band = (x, y, w, h, color) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${color}"/>`;
const frame = (x, y, w, h, color, sw) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="none" stroke="${color}" stroke-width="${sw || 0.8}"/>`;
/* points from phylloPts (or any {x,y,r}) cut solid */
const discs = (pts, color) => `<g fill="${color}">` + pts.map((p) =>
  `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(p.r)}"/>`).join("") + "</g>";
/* a shape put through the copier, screened only over the window that will
   actually land on the sheet */
const print = (sdf, tx, ty, W, H, o) =>
  place(tx, ty, Y.screen(Object.assign({ x: -tx, y: -ty, w: W, h: H, sdf }, o)));
/* mouths, taken where the body actually ends, never where it is convenient */
function mouths(f, cx, cy, rMax, count, size, rand, from) {
  const edge = Y.contour(f, cx, cy, count * 6, rMax);
  const out = [];
  for (let i = 0; i < count; i++) {
    const p = edge[Math.floor(((i + (from || 0)) / count) * edge.length + rand() * 3) % edge.length];
    if (p) out.push({ x: p.x, y: p.y, r0: size * (0.55 + rand() * 0.9) });
  }
  return out;
}

/** a plate: ground, body, and the corner marks that say it was printed */
function sheet(w, h, o) {
  const opt = Object.assign({ bg: INK.white, ink: INK.black, trim: true, margin: 16, body: "" }, o);
  return svg(w, h, opt.body
    + (opt.trim ? G(opt.ink, 1.1, trim(w, h, opt.margin, opt.margin / 2)) : ""), opt.bg);
}
const place = (x, y, body, extra) =>
  `<g transform="translate(${n(x)} ${n(y)})${extra ? " " + extra : ""}">${body}</g>`;

/** args: `node logo/mkX.js 5150 --only 77,80` */
function args(argv) {
  const rest = argv.slice(2);
  const oi = rest.indexOf("--only");
  const only = oi < 0 ? null : new Set(rest[oi + 1].split(",").map((s) => s.trim()));
  /* the plate list is not a seed: `--only 113` must not roll the batch at 113 */
  const seed = parseInt(rest.find((a, i) => /^\d+$/.test(a) && (oi < 0 || i !== oi + 1)) || "6104", 10);
  return { seed, only };
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
  :root { color-scheme: light dark; --bg:#8f8f8c; --fg:#141410; }
  body { margin:0; padding:28px; background:var(--bg); font:12px/1.4 ui-monospace,Menlo,monospace; }
  main { display:grid; gap:22px; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); }
  figure { margin:0; background:#fff; box-shadow:0 1px 0 rgba(0,0,0,.35); }
  img { display:block; width:100%; height:auto; }
  figcaption { padding:6px 8px; color:var(--fg); background:#e4e4e0; }
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

/** run a batch: write every plate, then the gallery */
function run(root, plates, argv) {
  const dir = PLATES(root);
  const { seed, only } = args(argv || process.argv);
  let wrote = 0;
  for (let i = 0; i < plates.length; i++) {
    const p = plates[i];
    const num = String(parseInt(p.name, 10));
    if (only && !only.has(num) && !only.has(p.name)) continue;
    const out = p.draw(rng(seed + i * 97 + 13), seed);
    const body = typeof out === "string" ? { body: out } : out;
    const c = sheet(p.w || body.w, p.h || body.h, body);
    fs.writeFileSync(path.join(dir, p.name + ".svg"), c);
    console.log(`${p.name}.svg  ${(c.length / 1024).toFixed(0)}kb`);
    wrote++;
  }
  const N = writeIndex(dir);
  console.log(`→ ${wrote} plate(s), ${N} in ${dir}/index.html   (reroll: node ${path.basename(process.argv[1])} 5150)`);
}

module.exports = { INK, GROT, MONO, ARMS, n, rng, pick, segDist,
  L, axes, brackets, dimension, callout, trim, polar, swipe, svg, G,
  sheet, place, run, writeIndex, args, ticks, reg, band, frame, print, mouths, discs, PLATES };
