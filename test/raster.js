/* What the press reads out of a photograph.
 *
 * Everything else in this suite compares a file with a file. This one is
 * arithmetic, because the image side of the press was rewritten to answer a
 * different question — not "what is the average of these bytes" but "how
 * much light is in this patch" — and the difference between the two is
 * invisible in a plate until you know it is there.
 *
 * Five claims:
 *   the summed table gives the same mean a loop over the pixels gives;
 *   the box is clipped to the picture, not padded with white it never had;
 *   light is averaged as light, and weighted the way sRGB weights it;
 *   the table, being a cache, never changes an answer;
 *   and a plate held back to the shadows is a plate, at every setting.
 */
const path = require("path");
const T = require("./_t.js");
const ROOT = path.join(__dirname, "..");
const RA = require(path.join(ROOT, "_raster.js"));
const ST = require(path.join(ROOT, "_studio.js"));

T.head("the image, read as light — the table under the screen");

/* a picture made to order: `f(x, y)` returns [r, g, b, a] */
function img(w, h, f) {
  const px = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = f(x, y), k = (y * w + x) * 4;
    px[k] = c[0]; px[k + 1] = c[1]; px[k + 2] = c[2]; px[k + 3] = c.length > 3 ? c[3] : 255;
  }
  return { w, h, px };
}
const near = (a, b, eps) => Math.abs(a - b) <= (eps === undefined ? 1e-12 : eps);

/* ---- 1. the table against the loop it replaced ------------------------- */

/* the same mean, worked out the slow way, in the same quantised light so the
   two can be compared exactly rather than nearly */
function slowMean(im, x0, y0, x1, y1) {
  let sy = 0, sa = 0, n = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const k = (y * im.w + x) * 4, a = im.px[k + 3] / 255;
    const lin = 0.2126 * RA.LIGHT.toLinear(im.px[k]) + 0.7152 * RA.LIGHT.toLinear(im.px[k + 1])
              + 0.0722 * RA.LIGHT.toLinear(im.px[k + 2]);
    sy += Math.round((a * lin + (1 - a)) * 65535);
    sa += Math.round(a * 65535);
    n++;
  }
  return { light: sy / n / 65535, opacity: sa / n / 65535 };
}

const noisy = img(64, 48, (x, y) => [(x * 37 + y * 11) % 256, (x * 5 + y * 61) % 256,
  (x * 97 + y * 3) % 256, x < 8 ? (x * 31) % 256 : 255]);
const Tn = RA.integral(noisy);
let worst = 0, worstA = 0;
for (const [cx, cy, r] of [[20, 20, 1], [20, 20, 4], [32, 24, 12], [10, 6, 6], [40, 30, 3]]) {
  const got = RA.meanAt(Tn, cx, cy, r, null);
  const want = slowMean(noisy, cx - r, cy - r, cx + r, cy + r);
  worst = Math.max(worst, Math.abs(got.light - want.light));
  worstA = Math.max(worstA, Math.abs(got.opacity - want.opacity));
}
T.ok("a box read off the table is the box summed pixel by pixel (" + worst.toExponential(1) + ")",
  worst < 1e-12 && worstA < 1e-12, worst + " / " + worstA);

/* the sums are integers on purpose: a table built along the rows and a loop
   run some other way must agree in the last bit, or a plate stops reprinting */
T.ok("and the agreement is exact, not close", worst === 0 && worstA === 0, worst);

/* ---- 2. the edge ------------------------------------------------------- */

/* a picture with no white in it at all: any mean over any patch inside it
   must be the ink it is made of. The old press counted the pixels that were
   not there, so an edge lost a third of its ink and a corner two thirds. */
const solid = img(32, 32, () => [0, 0, 0]);
const Ts = RA.integral(solid);
const mid = RA.meanAt(Ts, 16, 16, 6, null).light;
const edge = RA.meanAt(Ts, 0, 16, 6, null).light;
const corner = RA.meanAt(Ts, 0, 0, 6, null).light;
T.ok("a black field is black in the middle, at the edge and in the corner",
  near(mid, 0) && near(edge, 0) && near(corner, 0), [mid, edge, corner].join(" "));

/* and the clip is the crop, not the canvas: reading inside a src box stays
   inside it, so cropping to the body cannot drag in the empty margin */
const half = img(32, 32, (x) => (x < 16 ? [0, 0, 0] : [255, 255, 255]));
const Th = RA.integral(half);
const cropped = RA.meanAt(Th, 15, 16, 6, [0, 0, 16, 32]).light;
T.ok("a crop holds: a box at its edge reads only what is inside it",
  near(cropped, 0), cropped);

/* ---- 3. light, and the weights it is summed with ----------------------- */

/* half the pixels black, half white. In light that is 0.5 — which is not
   half way up the scale a hand adjusts on, and that gap is the whole reason
   the old tone scale leaned dark wherever the picture had an edge in it. */
const checker = img(32, 32, (x, y) => ((x + y) % 2 ? [255, 255, 255] : [0, 0, 0]));
const mc = RA.meanAt(RA.integral(checker), 16, 16, 8, null).light;
T.ok("a black-and-white checker is half the light", near(mc, 0.5, 5e-5), mc);
const percep = RA.LIGHT.toPerceptual(mc);
T.ok("and that is 0.735 on the perceptual scale, not 0.5 (" + percep.toFixed(4) + ")",
  near(percep, 0.7354, 5e-4), percep);

/* the two curves are each other's inverse over the whole byte range */
let rt = 0;
for (let b = 0; b < 256; b++) rt = Math.max(rt, Math.abs(RA.LIGHT.toPerceptual(RA.LIGHT.toLinear(b)) - b / 255));
T.ok("the two curves undo each other for every byte (" + rt.toExponential(1) + ")", rt < 1e-9, rt);

/* sRGB luminance, not Rec.601 luma: green is 0.7152 of the light, not 0.587 */
const green = RA.meanAt(RA.integral(img(8, 8, () => [0, 255, 0])), 4, 4, 3, null).light;
T.ok("green carries 0.7152 of the light, the way sRGB says (" + green.toFixed(4) + ")",
  near(green, 0.7152, 1e-4), green);

/* what is not there is paper: a transparent pixel is white, and says so */
const clear = RA.meanAt(RA.integral(img(8, 8, () => [0, 0, 0, 0])), 4, 4, 3, null);
T.ok("a transparent patch is paper, and holds no image",
  near(clear.light, 1, 1e-4) && near(clear.opacity, 0, 1e-4), clear.light + " / " + clear.opacity);

/* ---- 4. the table is a cache, and a cache may not be visible ----------- */

const shot = img(120, 90, (x, y) => [(x * 3) % 256, (y * 7) % 256, (x * y) % 256]);
const opts = { img: shot, x: 0, y: 0, w: 300, h: 240, cell: 5, angle: 15, spread: 0.6,
  grain: 0.2, seed: 4, lo: 0.1, hi: 0.75, gamma: 1, soft: 1.4, min: 0.02 };
const cold = RA.screenImage(Object.assign({}, opts));
const warm = RA.screenImage(Object.assign({}, opts));
T.same("a photograph screened twice is the same plate", cold, warm);
const fresh = RA.screenImage(Object.assign({}, opts, { img: img(120, 90, (x, y) =>
  [(x * 3) % 256, (y * 7) % 256, (x * y) % 256]) }));
T.same("and the same picture in a new object prints the same plate", cold, fresh);

/* softness costs nothing now: the box is four lookups whatever its size, so
   a wide screen must not take longer than a narrow one */
const time = (soft) => {
  const t0 = Date.now();
  for (let i = 0; i < 3; i++) RA.screenImage(Object.assign({}, opts, { soft, seed: 4 + i }));
  return Date.now() - t0;
};
time(0.4);                                   /* warm the table and the code */
const narrow = time(0.4), wide = time(6);
T.ok("a screen six times as soft costs about the same (" + narrow + "ms → " + wide + "ms)",
  wide < narrow * 2 + 60, narrow + "ms → " + wide + "ms");

/* ---- 5. the separation ------------------------------------------------- */

/* held back, a plate takes less ink — the rest of the picture is the ink
   underneath's to carry, which is what a duotone is */
const dots = (o) => (RA.screenImage(Object.assign({}, opts, o)).match(/<circle/g) || []).length;
const whole = dots({ from: 0 }), shadows = dots({ from: 0.6 }), edgeCase = dots({ from: 1 });
T.ok("a plate held back to the shadows prints fewer dots (" + whole + " → " + shadows + ")",
  shadows > 0 && shadows < whole, whole + " → " + shadows);
/* held back the whole way the range closes and the plate is a threshold —
   still a plate, and still finite, which it was not before it was floored */
T.ok("held back the whole way it is a threshold, not a division by nothing (" + edgeCase + ")",
  edgeCase > 0 && edgeCase < shadows && dots({ from: 1 }).toString() === String(edgeCase)
  && RA.screenImage(Object.assign({}, opts, { from: 1 })).indexOf("NaN") < 0, edgeCase);

/* and the atelier reaches it: the option is there, and only for a picture */
const p2 = ST.FIELDS.plate2.options.filter((o) => o.v === "separation")[0];
T.ok("the atelier offers a separation", !!p2);
T.ok("and offers it only where there is a photograph to separate",
  !!p2 && ST.visible(p2, { sym: "image" }) && !ST.visible(p2, { sym: "sun" }));

module.exports = T.counts;
if (require.main === module) process.exit(T.report() ? 0 : 1);
