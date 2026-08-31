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

/**
 * The image as coverage: how much ink each cell of the screen would hold.
 * Levels first (lo/hi/gamma), then the box average that stands in for the
 * softness a real screen has, then the dot.
 *
 *   x,y,w,h  the box on the sheet; the image is fitted inside it
 *   cell     screen pitch        angle  screen angle
 *   spread   dot radius as a fraction of the pitch (>0.6 over-inks)
 */
function screenImage(o) {
  const opt = Object.assign({ img: null, x: 0, y: 0, w: 240, h: 240, cell: 6, angle: 15,
    spread: 0.6, grain: 0.22, seed: 3, color: INK.black, lo: 0.05, hi: 0.7, gamma: 1,
    soft: 1, invert: false, min: 0.016, src: null }, o);
  const im = opt.img;
  const [sx, sy, sw, sh] = opt.src || [0, 0, im.w, im.h];
  const s = Math.min(opt.w / sw, opt.h / sh);              /* contain, centred */
  const ox = opt.x + (opt.w - sw * s) / 2, oy = opt.y + (opt.h - sh * s) / 2;
  const R = Math.max(1, Math.round((opt.cell * opt.soft) / s / 2));   /* box, in px */

  const ink = (ix, iy) => {                 /* one lattice point → 0..1 of ink */
    const px = sx + Math.round((ix - ox) / s), py = sy + Math.round((iy - oy) / s);
    let acc = 0, cnt = 0, op = 0;
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
      const X = px + i, Y = py + j;
      cnt++;
      if (X < 0 || Y < 0 || X >= im.w || Y >= im.h) continue;
      const k = (Y * im.w + X) * 4;
      const lum = (im.px[k] * 0.299 + im.px[k + 1] * 0.587 + im.px[k + 2] * 0.114) / 255;
      const a = im.px[k + 3] / 255;
      acc += a * (1 - lum);
      op += a;
    }
    let v = (acc / (cnt || 1) - opt.lo) / (opt.hi - opt.lo);
    v = Math.max(0, Math.min(1, v));
    if (opt.gamma !== 1) v = Math.pow(v, opt.gamma);
    /* read the other way round, but only where there is an image to read:
       what the canvas left empty stays empty */
    return opt.invert ? (1 - v) * (op / (cnt || 1)) : v;
  };

  return halftone({ x: opt.x, y: opt.y, w: opt.w, h: opt.h, cell: opt.cell,
    angle: opt.angle, grain: opt.grain, spread: opt.spread, color: opt.color,
    seed: opt.seed, min: opt.min, cap: true, cover: ink });
}

module.exports = { readPNG, screenImage, bbox };
