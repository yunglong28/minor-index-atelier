/* MINOR INDEX — RETICLE, further out.
 *
 * The instrument stops being symmetrical. Same vocabulary — brackets, ticked
 * axes, ellipses, dimension lines, call-outs pointing at nothing — but the
 * composition is rolled from a seed, so the measuring apparatus is as
 * arbitrary as the thing it claims to measure.
 *
 *   node logo/mkreticle.js            (same seeds every run)
 *   node logo/mkreticle.js 4821       (roll a different set)
 */
const fs = require("fs");
const path = require("path");
const OUT = require("./_sheet.js").PLATES(__dirname);   /* plates/ */
const SEED0 = parseInt(process.argv[2] || "1207", 10);

const INK = {
  stock: "#d9d7ce", paper: "#f2f0e8", toner: "#17160f",
  blu: "#001ef7", oxide: "#a92c17", marker: "#e8ff00",
};
const GROT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";
const n = (v) => Number(v.toFixed(2));
const rng = (s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];

const CAPTIONS = [
  "SMALL LANGUAGE MODELS", "MODEL AUTOPHAGY DISORDER", "THE RARE THINGS GO FIRST",
  "COUNTER-ARCHIVE, COUNTER-GENERATION", "FEED IT ONLY WHAT YOU LOVE",
  "PROVENANCE: DISPUTED", "SPECIMEN: THE OTHERS", "EVERYTHING. INDISCRIMINATELY.",
  "THE PARAPHRASES SURVIVE", "TRANSLATION PENDING", "MORE SOON",
  "UNPLUG ME AND CARRY ME", "AN ARCHIVE BELONGS TO WHOEVER BUILT IT",
];
const STAMPS = [
  "PLATE 07 / 13", "COPY #3 OF ITSELF", "r 52 · r 38 · r 17", "0.28 RAD",
  "MINOR-INDEX", "GEN. 4", "SCREEN 15°", "4096 PAGES", "NOT TO SCALE",
];

/* ---- the mark, as a coverage field of dots ---------------------------- */
const ARMS = [0, 1, 2, 3, 4, 5, 6, 7];
const segDist = (px, py, s) => {
  const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
  const L2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - s.x1) * dx + (py - s.y1) * dy) / L2));
  return Math.hypot(px - (s.x1 + dx * t), py - (s.y1 + dy * t)) - s.w / 2;
};
function markDots(o) {
  const opt = Object.assign({
    size: 240, arms: ARMS, barbs: true, cell: 4.4, angle: 15,
    falloff: 9, grain: 0.2, spread: 0.5, color: INK.toner, seed: 3, eyeOnly: false,
  }, o);
  const k = opt.size / 240, C = opt.size / 2;
  const S = [];
  if (!opt.eyeOnly) {
    for (const i of opt.arms) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const long = i % 2 === 0;
      const r0 = 34 * k, r1 = (long ? 104 : 76) * k;
      S.push({ x1: C + Math.cos(a) * r0, y1: C + Math.sin(a) * r0,
               x2: C + Math.cos(a) * r1, y2: C + Math.sin(a) * r1, w: (long ? 13 : 7) * k });
      if (opt.barbs) {
        const ba = a + (long ? 0.28 : -0.28);
        S.push({ x1: C + Math.cos(a) * (r1 - 26 * k), y1: C + Math.sin(a) * (r1 - 26 * k),
                 x2: C + Math.cos(ba) * r1, y2: C + Math.sin(ba) * r1, w: 4 * k });
      }
    }
  }
  const sdf = (x, y) => {
    let d = 1e9;
    for (const s of S) d = Math.min(d, segDist(x, y, s));
    d = Math.min(d, Math.abs(Math.hypot(x - C, y - C) - 30 * k) - 2.6 * k);
    const rx = 26 * k, ry = 13 * k;
    d = Math.min(d, (Math.hypot((x - C) / rx, (y - C) / ry) - 1) * ry);
    const pd = Math.hypot(x - C, y - C + 2 * k);
    if (pd < 4.5 * k) d = Math.max(d, 4.5 * k - pd);
    return d;
  };
  const r = rng(opt.seed);
  const a = (opt.angle * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const N = Math.ceil((opt.size * 1.5) / opt.cell), out = [];
  for (let i = -N; i <= N; i++) for (let j = -N; j <= N; j++) {
    const lx = i * opt.cell, ly = j * opt.cell;
    const x = C + lx * ca - ly * sa, y = C + lx * sa + ly * ca;
    if (x < -4 || x > opt.size + 4 || y < -4 || y > opt.size + 4) continue;
    let cov = Math.max(0, Math.min(1, 1 - sdf(x, y) / opt.falloff));
    cov += (r() - 0.5) * opt.grain * (cov > 0.02 ? 1 : 0.35);
    if (cov <= 0.015) continue;
    const rr = opt.cell * opt.spread * Math.sqrt(cov);
    if (rr < 0.16) continue;
    out.push(`<circle cx="${n(x + (r() - 0.5) * 1.1)}" cy="${n(y + (r() - 0.5) * 1.1)}" r="${n(rr)}"/>`);
  }
  return `<g fill="${opt.color}">${out.join("")}</g>`;
}

/* ---- instrument parts. `hand` wobbles every line, as if ruled badly ---- */
function L(x1, y1, x2, y2, hand, r) {
  if (!hand) return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"/>`;
  const N = 4, pts = [`M ${n(x1)} ${n(y1)}`];
  for (let i = 1; i <= N; i++) {
    const t = i / N;
    pts.push(`L ${n(x1 + (x2 - x1) * t + (r() - 0.5) * hand)} ${n(y1 + (y2 - y1) * t + (r() - 0.5) * hand)}`);
  }
  return `<path d="${pts.join(" ")}"/>`;
}
function axes(cx, cy, len, count, hand, r, jitter) {
  const out = [L(cx, cy - len, cx, cy + len, hand, r), L(cx - len, cy, cx + len, cy, hand, r)];
  for (let i = -count; i <= count; i++) {
    if (!i) continue;
    const t = (i / count) * len * 0.92 * (1 + (jitter ? (r() - 0.5) * 0.12 : 0));
    const s = len * 0.035;
    out.push(L(cx + t, cy - s, cx + t, cy + s, hand, r));
    out.push(L(cx - s, cy + t, cx + s, cy + t, hand, r));
  }
  return out.join("");
}
function brackets(x, y, w, h, br, hand, r) {
  const c = (px, py, sx, sy) =>
    `<path d="M ${n(px + sx * br)} ${n(py)} L ${n(px)} ${n(py)} L ${n(px)} ${n(py + sy * br)}"/>`;
  return c(x, y, 1, 1) + c(x + w, y, -1, 1) + c(x, y + h, 1, -1) + c(x + w, y + h, -1, -1);
}
function dimension(x1, y1, x2, y2, label, off, stroke) {
  const a = Math.atan2(y2 - y1, x2 - x1), ox = Math.cos(a + Math.PI / 2) * off, oy = Math.sin(a + Math.PI / 2) * off;
  const mx = (x1 + x2) / 2 + ox, my = (y1 + y2) / 2 + oy;
  const cap = (px, py) => `<line x1="${n(px + ox - Math.cos(a + Math.PI / 2) * 5)}" y1="${n(py + oy - Math.sin(a + Math.PI / 2) * 5)}" x2="${n(px + ox + Math.cos(a + Math.PI / 2) * 5)}" y2="${n(py + oy + Math.sin(a + Math.PI / 2) * 5)}"/>`;
  return `<line x1="${n(x1 + ox)}" y1="${n(y1 + oy)}" x2="${n(x2 + ox)}" y2="${n(y2 + oy)}"/>${cap(x1, y1)}${cap(x2, y2)}
    <text x="${n(mx)}" y="${n(my - 5)}" text-anchor="middle" font-family="${MONO}" font-size="10" fill="${stroke}" stroke="none">${label}</text>`;
}
function callout(x, y, tx, ty, label, stroke) {
  const w = label.length * 6.2 + 10;
  return `<line x1="${n(x)}" y1="${n(y)}" x2="${n(tx)}" y2="${n(ty)}"/>
    <line x1="${n(tx)}" y1="${n(ty)}" x2="${n(tx + (tx > x ? w : -w))}" y2="${n(ty)}"/>
    <circle cx="${n(x)}" cy="${n(y)}" r="2.4" fill="${stroke}"/>
    <text x="${n(tx + (tx > x ? 4 : -w + 4))}" y="${n(ty - 5)}" font-family="${MONO}" font-size="10" fill="${stroke}" stroke="none">${label}</text>`;
}
function trim(w, h, m, len) {
  const o = [];
  for (const [x, y] of [[m, m], [w - m, m], [m, h - m], [w - m, h - m]]) {
    o.push(`<line x1="${n(x - len)}" y1="${n(y)}" x2="${n(x + len)}" y2="${n(y)}"/>`);
    o.push(`<line x1="${n(x)}" y1="${n(y - len)}" x2="${n(x)}" y2="${n(y + len)}"/>`);
  }
  return o.join("");
}
function polar(cx, cy, r0, rings, spokes, hand, r) {
  const out = [];
  for (let i = 1; i <= rings; i++) out.push(`<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r0 * i / rings)}" fill="none"/>`);
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    const inR = i % 3 === 0 ? r0 * 0.06 : r0 * 0.88;
    out.push(L(cx + Math.cos(a) * inR, cy + Math.sin(a) * inR,
               cx + Math.cos(a) * r0 * 1.04, cy + Math.sin(a) * r0 * 1.04, hand, r));
  }
  return out.join("");
}

const svg = (w, h, body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n`
  + (bg ? `  <rect width="${w}" height="${h}" fill="${bg}"/>\n` : "")
  + "  " + body + "\n</svg>\n";
const write = (name, c) => {
  fs.writeFileSync(path.join(OUT, name), c);
  console.log(name + "  " + (c.length / 1024).toFixed(0) + "kb");
};
const G = (stroke, sw, body) =>
  `<g stroke="${stroke}" stroke-width="${sw}" fill="none">${body}</g>`;

/* ======================================================================
   the composer: rolls an instrument from the vocabulary above
   ====================================================================== */
function compose(seed, o) {
  const opt = Object.assign({ w: 640, h: 640, dark: false, hand: 0, mark: true }, o);
  const r = rng(seed);
  const W = opt.w, H = opt.h;
  const stroke = opt.dark ? INK.stock : INK.toner;
  const sw = 1.1 + r() * 0.8;
  const body = [];

  /* the subject sits where it lands, not in the middle */
  const S = Math.min(W, H);
  const size = S * (0.24 + r() * 0.28);
  const mx = (W - size) * (0.05 + r() * 0.9), my = (H - size) * (0.05 + r() * 0.9);
  const markSVG = opt.mark
    ? `<g transform="translate(${n(mx)} ${n(my)}) rotate(${n((r() - 0.5) * 24)} ${n(size / 2)} ${n(size / 2)})">`
      + markDots({
        size, seed: seed + 17, color: opt.dark ? INK.stock : INK.toner,
        cell: 3.2 + r() * 2.6, angle: r() * 90, falloff: 6 + r() * 12,
        grain: 0.14 + r() * 0.24, barbs: r() > 0.35, eyeOnly: r() > 0.82,
        arms: ARMS.filter(() => r() > 0.22),
      }) + "</g>"
    : "";

  /* the instrument, aimed at something near the subject but not on it */
  const ax = mx + size / 2 + (r() - 0.5) * size * 0.7;
  const ay = my + size / 2 + (r() - 0.5) * size * 0.7;
  body.push(axes(ax, ay, Math.min(W, H) * (0.28 + r() * 0.24), 3 + Math.floor(r() * 4), opt.hand, r, true));

  /* one or two frames, at different scales, not concentric */
  const frames = 1 + Math.floor(r() * 2.4);
  for (let i = 0; i < frames; i++) {
    const fw = W * (0.36 + r() * 0.46), fh = H * (0.3 + r() * 0.42);
    const fx = (W - fw) * r(), fy = (H - fh) * r();
    /* a ruled frame wobbles too, or the hand-drawn roll gives itself away */
    body.push(opt.hand
      ? L(fx, fy, fx + fw, fy, opt.hand, r) + L(fx + fw, fy, fx + fw, fy + fh, opt.hand, r)
        + L(fx + fw, fy + fh, fx, fy + fh, opt.hand, r) + L(fx, fy + fh, fx, fy, opt.hand, r)
      : `<rect x="${n(fx)}" y="${n(fy)}" width="${n(fw)}" height="${n(fh)}"/>`);
    body.push(brackets(fx - 10 - r() * 14, fy - 10 - r() * 14,
      fw + 20 + r() * 28, fh + 20 + r() * 28, 14 + r() * 20, opt.hand, r));
  }
  /* an ellipse, or a polar rose */
  if (r() > 0.45) {
    body.push(`<ellipse cx="${n(ax)}" cy="${n(ay)}" rx="${n(W * (0.16 + r() * 0.2))}" ry="${n(H * (0.1 + r() * 0.16))}"/>`);
  } else {
    body.push(polar(ax, ay, Math.min(W, H) * (0.16 + r() * 0.2), 2 + Math.floor(r() * 3), 12 + Math.floor(r() * 24), opt.hand, r));
  }
  /* dimensions and call-outs, measuring things that are not there */
  const dims = Math.floor(r() * 3);
  for (let i = 0; i < dims; i++) {
    const x1 = W * r() * 0.8, y1 = H * (0.1 + r() * 0.8);
    body.push(dimension(x1, y1, x1 + 60 + r() * 220, y1, (40 + r() * 180).toFixed(1), 12 + r() * 20, stroke));
  }
  const calls = Math.floor(r() * 3);
  for (let i = 0; i < calls; i++) {
    body.push(callout(mx + size * r(), my + size * r(),
      W * (0.06 + r() * 0.7), H * (0.08 + r() * 0.84), pick(r, STAMPS), stroke));
  }
  if (r() > 0.5) body.push(trim(W, H, 16 + r() * 14, 8 + r() * 8));

  /* the captions, set wherever the frame let them */
  const texts = [];
  const capN = 1 + Math.floor(r() * 3);
  for (let i = 0; i < capN; i++) {
    const s = 9 + r() * 6;
    texts.push(`<text x="${n(W * (0.05 + r() * 0.5))}" y="${n(H * (0.08 + r() * 0.86))}" `
      + `font-family="${r() > 0.5 ? GROT : MONO}" font-size="${n(s)}" letter-spacing="${n(r() * 2.4)}" `
      + `fill="${stroke}">${pick(r, CAPTIONS)}</text>`);
  }
  /* every so often the second plate turns up, at its own angle, off register */
  const plate2 = r() > 0.55
    ? `<g opacity="0.9" transform="translate(${n((r() - 0.5) * 16)} ${n((r() - 0.5) * 12)}) rotate(${n((r() - 0.5) * 8)} ${W / 2} ${H / 2})">`
      + G(INK.blu, sw * 0.8, axes(W * r(), H * r(), Math.min(W, H) * 0.3, 4, opt.hand, r, true)) + "</g>"
    : "";

  return svg(W, H, markSVG + G(stroke, n(sw), body.join("")) + texts.join("") + plate2,
    opt.dark ? INK.toner : INK.paper);
}

/* ---- designed ones ----------------------------------------------------- */

/* 31 — off-axis: the instrument is exact, and aimed slightly wrong */
write("31-reticle-offaxis.svg", compose(SEED0 + 3, {}));

/* 32 — double exposure: the sheet went through twice, at two angles */
write("32-reticle-double.svg", (() => {
  const a = compose(SEED0 + 11, {}).replace(/^[\s\S]*?<rect width="640" height="640"[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const b = compose(SEED0 + 29, {}).replace(/^[\s\S]*?<rect width="640" height="640"[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return svg(640, 640,
    `<g opacity="0.95">${a}</g>
    <g opacity="0.6" transform="rotate(6.5 320 320) translate(9 -7)">${b.replace(/#17160f/g, INK.blu)}</g>`,
    INK.paper);
})());

/* 33 — hand-ruled: every line drawn with a ruler and a bad hand */
write("33-reticle-hand.svg", compose(SEED0 + 41, { hand: 9 }));

/* 34 — the instrument, photocopied: the frame drops out in pieces */
write("34-reticle-dropout.svg", (() => {
  const src = compose(SEED0 + 53, {});
  const r = rng(SEED0 + 90);
  /* punch stock-coloured blocks through the finished plate */
  const holes = [];
  for (let i = 0; i < 46; i++) {
    const w = 12 + r() * 90, h = 6 + r() * 46;
    holes.push(`<rect x="${n(r() * 640)}" y="${n(r() * 640)}" width="${n(w)}" height="${n(h)}"/>`);
  }
  return src.replace("</svg>", `  <g fill="${INK.paper}">${holes.join("")}</g>\n</svg>`);
})());

/* 35 — polar: a star chart for a model with six stars */
write("35-reticle-polar.svg", (() => {
  const r = rng(SEED0 + 67);
  const body = polar(320, 320, 250, 4, 36, 0, r)
    + `<circle cx="320" cy="320" r="250" fill="none"/>`
    + brackets(48, 48, 544, 544, 26, 0, r);
  const degs = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    degs.push(`<text x="${n(320 + Math.cos(a) * 272)}" y="${n(320 + Math.sin(a) * 272 + 3)}" text-anchor="middle" font-family="${MONO}" font-size="9" fill="${INK.toner}">${i * 30}°</text>`);
  }
  return svg(640, 640,
    `<g transform="translate(200 200)">${markDots({ size: 240, seed: 5, cell: 4.0, falloff: 8 })}</g>`
    + G(INK.toner, 1.1, body) + degs.join("")
    + `<text x="48" y="36" font-family="${GROT}" font-size="14" letter-spacing="1.4" fill="${INK.toner}">LATENT NIGHT · GRATICULE</text>`,
    INK.paper);
})());

/* 36 — contact sheet: nine rolls of the same instrument, none alike */
write("36-reticle-contact-sheet.svg", (() => {
  const tiles = [];
  for (let i = 0; i < 9; i++) {
    const inner = compose(SEED0 + 100 + i * 37, { w: 210, h: 210 })
      .replace(/^[\s\S]*?<rect width="210" height="210"[^>]*>/, "")
      .replace(/<\/svg>\s*$/, "");
    const x = (i % 3) * 214, y = Math.floor(i / 3) * 214;
    /* each frame is its own sheet: what runs off the edge is trimmed off */
    tiles.push(`<g transform="translate(${x} ${y})" clip-path="url(#t${i})">`
      + `<rect width="210" height="210" fill="${INK.paper}"/>${inner}</g>`);
  }
  const defs = tiles.map((_, i) =>
    `<clipPath id="t${i}"><rect width="210" height="210"/></clipPath>`).join("");
  return svg(646, 646, `<defs>${defs}</defs>` + tiles.join(""), INK.stock);
})());

/* 37 — the hybrid: the crosshair IS the mark. Eight axes instead of two,
   each ticked, meeting at the eye. */
write("37-reticle-sigil.svg", (() => {
  const r = rng(SEED0 + 7);
  const out = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const len = i % 2 === 0 ? 290 : 210;
    out.push(L(320 + Math.cos(a) * 44, 320 + Math.sin(a) * 44,
               320 + Math.cos(a) * len, 320 + Math.sin(a) * len, 0, r));
    for (let t = 1; t <= 4; t++) {
      const rr = 44 + ((len - 44) * t) / 4.4;
      const px = 320 + Math.cos(a) * rr, py = 320 + Math.sin(a) * rr;
      const s = i % 2 === 0 ? 9 : 6;
      out.push(`<line x1="${n(px - Math.sin(a) * s)}" y1="${n(py + Math.cos(a) * s)}" x2="${n(px + Math.sin(a) * s)}" y2="${n(py - Math.cos(a) * s)}"/>`);
    }
  }
  out.push(`<ellipse cx="320" cy="320" rx="70" ry="35" fill="none"/>`);
  out.push(`<circle cx="320" cy="320" r="44" fill="none"/>`);
  out.push(brackets(70, 70, 500, 500, 30, 0, r));
  return svg(640, 640,
    G(INK.toner, 1.3, out.join(""))
    + `<g transform="translate(250 250)">${markDots({ size: 140, seed: 9, cell: 3.0, falloff: 7, eyeOnly: true })}</g>`
    + `<text x="70" y="56" font-family="${GROT}" font-size="14" letter-spacing="1.6" fill="${INK.toner}">EIGHT AXES · ONE APERTURE</text>`
    + `<text x="570" y="600" text-anchor="end" font-family="${MONO}" font-size="10" fill="${INK.toner}">MINOR-INDEX</text>`,
    INK.paper);
})());

/* 38 — inverted roll, on toner */
write("38-reticle-night.svg", compose(SEED0 + 77, { dark: true }));

/* 39, 40 — two more rolls, undesigned */
write("39-reticle-roll-a.svg", compose(SEED0 + 131, {}));
write("40-reticle-roll-b.svg", compose(SEED0 + 199, { hand: 2.2 }));

console.log("→ " + OUT + "   (pass a seed to reroll: node logo/mkreticle.js 4821)");
