/* MINOR INDEX — a photograph, put through the same copier.
 *
 * The plates screen distance fields; this screens pixels. A PNG is decoded
 * here rather than by a library, for the same reason there is no font in
 * these files: what the sheet is made of should be in the repository.
 *
 * 8-bit, non-interlaced, colour types 0/2/4/6 — which is every PNG anything
 * on this machine writes.
 */
/* node has these; in the browser the bundle hands over undefined and only
   readPNG is unavailable — screenImage takes the pixels it is given */
const fs = require("fs");
const zlib = require("zlib");
const { INK, n, rng } = require("./_mark.js");
const { halftone } = require("./_press.js");

const CHANNELS = { 0: 1, 2: 3, 4: 2, 6: 4 };
const paeth = (a, b, c) => {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : (pb <= pc ? b : c);
};

/** → { w, h, px } with px as RGBA bytes */
function readPNG(file) {
  if (!fs) throw new Error("readPNG needs node — in a page, decode the image with a canvas");
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error(file + ": not a PNG");
  let o = 8, hdr = null;
  const idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o), type = b.toString("latin1", o + 4, o + 8);
    if (type === "IHDR") {
      hdr = { w: b.readUInt32BE(o + 8), h: b.readUInt32BE(o + 12),
              depth: b[o + 16], color: b[o + 17], interlace: b[o + 20] };
    } else if (type === "IDAT") idat.push(b.slice(o + 8, o + 8 + len));
    else if (type === "IEND") break;
    o += len + 12;
  }
  if (!hdr) throw new Error(file + ": no IHDR");
  if (hdr.depth !== 8 || hdr.interlace || !CHANNELS[hdr.color]) {
    throw new Error(`${file}: need 8-bit non-interlaced colour type 0/2/4/6, `
      + `got depth ${hdr.depth} type ${hdr.color} interlace ${hdr.interlace}`);
  }
  const ch = CHANNELS[hdr.color], stride = hdr.w * ch;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(stride * hdr.h);
  for (let y = 0; y < hdr.h; y++) {
    const f = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1, dst = y * stride, up = dst - stride;
    for (let i = 0; i < stride; i++) {
      const x = raw[src + i];
      const a = i >= ch ? out[dst + i - ch] : 0;
      const bb = y ? out[up + i] : 0;
      const c = y && i >= ch ? out[up + i - ch] : 0;
      out[dst + i] = (f === 0 ? x : f === 1 ? x + a : f === 2 ? x + bb
        : f === 3 ? x + ((a + bb) >> 1) : x + paeth(a, bb, c)) & 255;
    }
  }
  /* to RGBA, whatever came in */
  const px = new Uint8Array(hdr.w * hdr.h * 4);
  for (let i = 0, j = 0; i < hdr.w * hdr.h; i++, j += 4) {
    const s = i * ch;
    if (ch === 1) { px[j] = px[j + 1] = px[j + 2] = out[s]; px[j + 3] = 255; }
    else if (ch === 2) { px[j] = px[j + 1] = px[j + 2] = out[s]; px[j + 3] = out[s + 1]; }
    else if (ch === 3) { px[j] = out[s]; px[j + 1] = out[s + 1]; px[j + 2] = out[s + 2]; px[j + 3] = 255; }
    else { px[j] = out[s]; px[j + 1] = out[s + 1]; px[j + 2] = out[s + 2]; px[j + 3] = out[s + 3]; }
  }
  return { w: hdr.w, h: hdr.h, px };
}

/** what the image actually occupies, so a plate can frame the body and not
 *  the empty canvas around it */
function bbox(img, alphaMin) {
  const A = (alphaMin === undefined ? 8 : alphaMin);
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (img.px[(y * img.w + x) * 4 + 3] < A) continue;
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return x1 < 0 ? [0, 0, img.w, img.h] : [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
}

/* ---- colour, which is not the same thing as a byte ----------------------
 *
 * An sRGB byte is not an amount of light. It is a number that a display will
 * turn into light by raising it to about 2.2, and that curve exists because
 * eyes are not linear. Two consequences the old press got wrong:
 *
 *   Averaging. Adding encoded bytes and dividing does not give the average
 *   light of a patch; it gives something darker. Every screen cell here is
 *   an average of a patch, so the whole tone scale was leaning dark, most
 *   where the contrast inside a cell was highest — which is to say at every
 *   edge in the picture.
 *
 *   Weighting. 0.299/0.587/0.114 is Rec.601 luma, a shortcut for encoded
 *   broadcast video. Luminance in sRGB is 0.2126/0.7152/0.0722, and it is a
 *   sum of light, not of bytes.
 *
 * So: decode to light, average in light, and come back to the perceptual
 * scale only for the tone controls — which is where lo, hi and gamma have
 * always been reaching, because that is the scale a hand adjusts on.
 */
const S2L = new Float64Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  S2L[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
const LIGHT = { toLinear: (b) => S2L[b], toPerceptual: (c) =>
  (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055) };
const QUANT = 65535;          /* light, as an integer, so a sum of it is exact */

/**
 * The image summed once, so the average over any patch is four lookups.
 *
 * The screen asks for the mean of a box hundreds of thousands of times, and
 * the box gets bigger as the screen gets softer — it was a loop over every
 * pixel under every dot. A summed-area table answers the same question in
 * constant time whatever the box, which is what lets the softness be a real
 * number instead of a whole count of pixels.
 *
 * The sums are integers. Floating point addition is not associative, so a
 * table built in one order and a loop run in another would disagree in the
 * last bits and the plate would not be reproducible; integers up to 2^53 are
 * exact however they are added, and a 1200×1200 image tops out near 2^37.
 *
 * `A` is the alpha table, and it is only built when the image has any — a
 * photograph does not, and that is 11MB not spent.
 */
function integral(img) {
  const W = img.w, H = img.h, P = img.px, S = W + 1;
  let opaque = true;
  for (let k = 3; k < P.length; k += 4) if (P[k] < 255) { opaque = false; break; }
  const Y = new Float64Array(S * (H + 1));
  const A = opaque ? null : new Float64Array(S * (H + 1));
  for (let y = 0; y < H; y++) {
    let ry = 0, ra = 0;
    const row = (y + 1) * S, up = y * S;
    for (let x = 0; x < W; x++) {
      const k = (y * W + x) * 4, a = P[k + 3] / 255;
      const lin = 0.2126 * S2L[P[k]] + 0.7152 * S2L[P[k + 1]] + 0.0722 * S2L[P[k + 2]];
      /* what the paper would show: the pixel laid over white, in light */
      ry += Math.round((a * lin + (1 - a)) * QUANT);
      Y[row + x + 1] = Y[up + x + 1] + ry;
      if (A) { ra += Math.round(a * QUANT); A[row + x + 1] = A[up + x + 1] + ra; }
    }
  }
  return { Y, A, W, H, S, opaque };
}
const table = (img) => img.__sat || (img.__sat = integral(img));

/**
 * The mean of a box, at a real place and a real size.
 *
 * Two more things the old press got wrong, both fixed by asking the question
 * properly rather than by adding a correction:
 *
 *   Where. The box used to be centred on the nearest whole pixel, so at a
 *   fine pitch several dots in a row read the identical patch and the tone
 *   field staircased along the image's own grid. The table is read between
 *   its entries, so the box is where the dot actually fell.
 *
 *   The edge. Pixels off the image used to be counted in the divisor while
 *   contributing nothing, so a photograph printed with a pale frame — an
 *   edge lost a third of its ink and a corner two thirds. The box is clipped
 *   to the picture and divided by the area that is really there.
 */
function meanAt(T, cx, cy, r, clip) {
  const S = T.S;
  const cx0 = clip ? clip[0] : 0, cy0 = clip ? clip[1] : 0;
  const cx1 = clip ? clip[0] + clip[2] : T.W, cy1 = clip ? clip[1] + clip[3] : T.H;
  const x0 = Math.max(cx0, cx - r), x1 = Math.min(cx1, cx + r);
  const y0 = Math.max(cy0, cy - r), y1 = Math.min(cy1, cy + r);
  const area = (x1 - x0) * (y1 - y0);
  if (!(area > 0)) return { light: 1, opacity: 0 };
  const read = (t, x, y) => {                    /* the table, between its entries */
    const ix = Math.floor(x), iy = Math.floor(y);
    const jx = Math.min(T.W, ix + 1), jy = Math.min(T.H, iy + 1);
    const tx = x - ix, ty = y - iy;
    return t[iy * S + ix] * (1 - tx) * (1 - ty) + t[iy * S + jx] * tx * (1 - ty)
         + t[jy * S + ix] * (1 - tx) * ty + t[jy * S + jx] * tx * ty;
  };
  const box = (t) => read(t, x1, y1) - read(t, x0, y1) - read(t, x1, y0) + read(t, x0, y0);
  return { light: box(T.Y) / area / QUANT,
           opacity: T.A ? box(T.A) / area / QUANT : 1 };
}

/**
 * The image as coverage: how much ink each cell of the screen would hold.
 *
 * The patch under the dot is averaged in light, brought back to the scale a
 * hand adjusts on, then put through the levels and handed to the press —
 * which does to it exactly what it does to a sun.
 *
 *   x,y,w,h  the box on the sheet; the image is fitted inside it
 *   cell     screen pitch        angle  screen angle
 *   soft     how much of the picture one dot reads, in screen cells
 *   spread   dot radius as a fraction of the pitch (>0.6 over-inks)
 *   lo/hi    where ink starts and where it floods      gamma  everything between
 *   from     hold the ink back until this far down the scale — a second plate
 *            that carries the shadows and lets the first carry the range
 */
function screenImage(o) {
  const opt = Object.assign({ img: null, x: 0, y: 0, w: 240, h: 240, cell: 6, angle: 15,
    spread: 0.6, grain: 0.22, seed: 3, color: INK.black, lo: 0.05, hi: 0.7, gamma: 1,
    soft: 1, invert: false, min: 0.016, src: null, from: 0, onBand: null }, o);
  const im = opt.img;
  const T = table(im);
  const src = opt.src || [0, 0, im.w, im.h];
  const [sx, sy, sw, sh] = src;
  const s = Math.min(opt.w / sw, opt.h / sh);              /* contain, centred */
  const ox = opt.x + (opt.w - sw * s) / 2, oy = opt.y + (opt.h - sh * s) / 2;
  /* the footprint of one screen cell in the picture — no longer a whole
     number of pixels, because it never was one */
  const rad = Math.max(0.5, (opt.cell * opt.soft) / s / 2);
  /* a separation: this plate takes only what is below `from` on the scale.
     Held back the whole way the range closes to nothing, and a range of
     nothing is a division by nothing — so it is floored, and what the plate
     becomes there is a threshold, which is what asking for it means. */
  const lo = opt.lo + (opt.hi - opt.lo) * opt.from;
  const span = Math.max(1e-6, opt.hi - lo);

  const ink = (ix, iy) => {                 /* one lattice point → 0..1 of ink */
    const m = meanAt(T, sx + (ix - ox) / s, sy + (iy - oy) / s, rad, src);
    let v = (1 - LIGHT.toPerceptual(m.light) - lo) / span;
    v = Math.max(0, Math.min(1, v));
    if (opt.gamma !== 1) v = Math.pow(v, opt.gamma);
    /* read the other way round, but only where there is an image to read:
       what the canvas left empty stays empty */
    return opt.invert ? (1 - v) * m.opacity : v;
  };

  return halftone({ x: opt.x, y: opt.y, w: opt.w, h: opt.h, cell: opt.cell,
    angle: opt.angle, grain: opt.grain, spread: opt.spread, color: opt.color,
    seed: opt.seed, min: opt.min, cap: true, cover: ink, onBand: opt.onBand });
}

module.exports = { readPNG, screenImage, bbox, integral, meanAt, LIGHT };
