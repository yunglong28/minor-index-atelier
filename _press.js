/* MINOR INDEX — the copier, once.
 *
 * Coverage becomes dot area on a rotated screen. That walk was written three
 * times — for the retired mark, for any distance field, and for a photograph
 * — and the three copies were the same twenty lines with a different answer
 * to one question: how much ink is there at this point.
 *
 * So that question is the only argument. Everything else — the rotated
 * lattice, the window, the grain, the dot radius, the shake in the placement
 * and the two thousandths of a millimetre `n()` rounds to — is here, and is
 * the same for a sun, a cell and a face.
 */
const { INK, n, rng } = require("./_mark.js");

/**
 * One pass through the press.
 *
 *   cover(x, y)  how much ink this point holds, 0..1, before the grain
 *   min          the coverage a dot has to reach to be printed at all
 *   stray        how much of the grain lands where there is no ink to
 *                roughen — dirt on the glass falls on the empty sheet too,
 *                and 0.35 of it is what every plate in this repository was
 *                printed with. Set it to 0 and the ground comes out clean
 *                while the form is untouched: the stream is drawn from
 *                either way, so the same speck still falls in the same
 *                place on the form.
 *   cap          clamp coverage at 1 before taking the root (an image can
 *                run over; a distance field was clamped on the way in)
 *   N            how far out the lattice goes, in cells; the default covers
 *                the sheet at any angle
 *   onBand       handed each strip of dots as it is laid down. Observational
 *                only: the dots, their order and the random stream are what
 *                they would have been with nobody watching.
 *   onDot        handed every dot as a place and a radius, for a caller that
 *                needs the geometry rather than the mark — a screened letter
 *                on its way into a font, which has outlines and no circles.
 *                Observational in the same way.
 */
function halftone(o) {
  const opt = Object.assign({ x: 0, y: 0, w: 240, h: 240, cell: 4.4, angle: 15,
    grain: 0.2, spread: 0.5, color: INK.black, seed: 3, min: 0.015, cap: false, stray: 0.35,
    N: 0, cover: () => 0, onBand: null, onDot: null }, o);
  const r = rng(opt.seed);
  const a = (opt.angle * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const cx = opt.x + opt.w / 2, cy = opt.y + opt.h / 2;
  const N = opt.N || Math.ceil((Math.max(opt.w, opt.h) * 1.5) / (2 * opt.cell));
  const out = [];
  const band = opt.onBand ? Math.max(1, Math.ceil(N / 18)) : 0;
  let mark = 0, since = 0;
  for (let i = -N; i <= N; i++) {
    for (let j = -N; j <= N; j++) {
      const lx = i * opt.cell, ly = j * opt.cell;
      const x = cx + lx * ca - ly * sa, y = cy + lx * sa + ly * ca;
      if (x < opt.x - 4 || x > opt.x + opt.w + 4 || y < opt.y - 4 || y > opt.y + opt.h + 4) continue;
      let cov = opt.cover(x, y);
      cov += (r() - 0.5) * opt.grain * (cov > 0.02 ? 1 : opt.stray);
      if (cov <= opt.min) continue;
      const rr = opt.cell * opt.spread * Math.sqrt(opt.cap ? Math.min(1, cov) : cov);
      if (rr < 0.16) continue;
      const dx = n(x + (r() - 0.5) * 1.1), dy = n(y + (r() - 0.5) * 1.1), d = n(rr);
      if (opt.onDot) opt.onDot(dx, dy, d);
      out.push(`<circle cx="${dx}" cy="${dy}" r="${d}"/>`);
    }
    /* hand over what has printed so far, if anyone is watching */
    if (band && ++since >= band) {
      since = 0;
      if (out.length > mark) { opt.onBand(out.slice(mark).join("")); mark = out.length; }
    }
  }
  if (band && out.length > mark) opt.onBand(out.slice(mark).join(""));
  return `<g fill="${opt.color}">${out.join("")}</g>`;
}

/* a distance field, read as coverage: on the form, off it, and the fringe
   between. A body reaches only so far — past its bound plus the fringe the
   answer could not have printed a dot, so the field is not asked. The grain
   is still drawn, in the same order and off the same stream, because loose
   dots on the empty sheet are the point of it. */
const fieldCover = (sdf, falloff, bound) => {
  if (!bound) return (x, y) => Math.max(0, Math.min(1, 1 - sdf(x, y) / falloff));
  const far = bound.r + falloff, bx = bound.cx, by = bound.cy;
  return (x, y) => (Math.hypot(x - bx, y - by) > far
    ? 0 : Math.max(0, Math.min(1, 1 - sdf(x, y) / falloff)));
};

module.exports = { halftone, fieldCover };
