/* MINOR INDEX — what a press leaves behind that is not the image.
 *
 * Ticks, registration crosses, bands, frames, discs, the mouths taken out of
 * a contour, and the sheet itself. These were written once in `_sheet.js` for
 * the batch scripts and again in `_studio.js` for the atelier, because
 * `_sheet.js` reaches for `fs` and the atelier has to run in a page. Nothing
 * here touches a file, so both can have the one copy.
 */
const M = require("./_mark.js");
const Y = require("./_glyphs.js");
const { INK, n, trim, svg, G } = M;

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

const place = (x, y, body, extra) =>
  `<g transform="translate(${n(x)} ${n(y)})${extra ? " " + extra : ""}">${body}</g>`;
/* a shape put through the copier, screened only over the window that will
   actually land on the sheet */
const print = (sdf, tx, ty, W, H, o) =>
  place(tx, ty, Y.screen(Object.assign({ x: -tx, y: -ty, w: W, h: H, sdf }, o)));

/* mouths, taken where the body actually ends, never where it is convenient.
   A body with no edge to find is a body with no mouths — and it must not
   spend a single number off the hand doing it, or every mark that comes
   after would move. */
function mouths(f, cx, cy, rMax, count, size, rand, from) {
  const edge = Y.contour(f, cx, cy, count * 6, rMax);
  const out = [];
  if (!edge.length) return out;
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

module.exports = { ticks, reg, band, frame, discs, place, print, mouths, sheet };
