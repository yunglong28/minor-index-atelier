/* MINOR INDEX — variant families, after three references.
 *
 *   A · COMPRESSION   ("still here?")  the mark as a JPEG that has been
 *       re-saved too many times: coarse blocks, chromatic fringe, dropout.
 *       Generation loss again, but in the other medium — the one the file
 *       suffers rather than the paper.
 *   B · NEURAL        the mark as a cell network: bulbous nodes, radiating
 *       spikes, tapering filaments. White on black, hand-cut.
 *   C · RETICLE       the mark as an instrument: hairline brackets, ticked
 *       axes, an ellipse, a boxed label. Precision around something vague.
 *
 *   node logo/mkalt.js
 */
const fs = require("fs");
const path = require("path");
const OUT = require("./_sheet.js").PLATES(__dirname);   /* plates/ */

const INK = {
  stock: "#d9d7ce", toner: "#17160f", blu: "#001ef7",
  oxide: "#a92c17", marker: "#e8ff00", paper: "#f2f0e8",
};
const GROT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";
const SERIF = "Georgia, 'Times New Roman', serif";
const n = (v) => Number(v.toFixed(2));
const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

const svg = (w, h, body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n`
  + (bg ? `  <rect width="${w}" height="${h}" fill="${bg}"/>\n` : "")
  + "  " + body + "\n</svg>\n";
const write = (name, content) => {
  fs.writeFileSync(path.join(OUT, name), content);
  console.log(name + "  " + (content.length / 1024).toFixed(0) + "kb");
};

/* ---- shared geometry: the same sigil as 01-mark ------------------------ */
const ARMS = [0, 1, 2, 3, 4, 5, 6, 7];
function segs(arms, barbs, k, C, w) {
  const out = [];
  for (const i of arms) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const long = i % 2 === 0;
    const r0 = 34 * k, r1 = (long ? 104 : 76) * k;
    out.push({ x1: C + Math.cos(a) * r0, y1: C + Math.sin(a) * r0,
               x2: C + Math.cos(a) * r1, y2: C + Math.sin(a) * r1, w: (long ? 13 : 7) * w * k });
    if (barbs) {
      const ba = a + (long ? 0.28 : -0.28);
      out.push({ x1: C + Math.cos(a) * (r1 - 26 * k), y1: C + Math.sin(a) * (r1 - 26 * k),
                 x2: C + Math.cos(ba) * r1, y2: C + Math.sin(ba) * r1, w: 4 * w * k });
    }
  }
  return out;
}
const segDist = (px, py, s) => {
  const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
  const L2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - s.x1) * dx + (py - s.y1) * dy) / L2));
  return Math.hypot(px - (s.x1 + dx * t), py - (s.y1 + dy * t)) - s.w / 2;
};
function sdf(px, py, S, k, C) {
  let d = 1e9;
  for (const s of S) d = Math.min(d, segDist(px, py, s));
  d = Math.min(d, Math.abs(Math.hypot(px - C, py - C) - 30 * k) - 2.6 * k);
  const rx = 26 * k, ry = 13 * k;
  d = Math.min(d, (Math.hypot((px - C) / rx, (py - C) / ry) - 1) * ry);
  const pd = Math.hypot(px - C, py - C + 2 * k);
  if (pd < 4.5 * k) d = Math.max(d, 4.5 * k - pd);
  return d;
}

/* ======================================================================
   A · COMPRESSION
   The mark quantised onto a coarse block grid, then split into channels
   that no longer line up. Nothing is anti-aliased: a block is on or off.
   ====================================================================== */
function blocks(o) {
  const opt = Object.assign({
    size: 240, cell: 7.5, thresh: 0.5, w: 1, arms: ARMS, barbs: true,
    fringe: 2.2, drop: 0.05, ring: 0.16, seed: 5,
  }, o);
  const k = opt.size / 240, C = opt.size / 2;
  const S = segs(opt.arms, opt.barbs, k, C, opt.w);
  const rand = rng(opt.seed);
  const N = Math.ceil(opt.size / opt.cell);
  const core = [], edgeA = [], edgeB = [], ringing = [];

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const x = i * opt.cell, y = j * opt.cell;
      /* sample the block's centre — a block is on or it is not */
      const d = sdf(x + opt.cell / 2, y + opt.cell / 2, S, k, C);
      const cov = Math.max(0, Math.min(1, 1 - d / (opt.cell * 1.1)));
      const rect = (dx, dy) => `<rect x="${n(x + dx)}" y="${n(y + dy)}" width="${n(opt.cell)}" height="${n(opt.cell)}"/>`;
      if (cov >= opt.thresh) {
        if (rand() > opt.drop) core.push(rect(0, 0));
        else ringing.push(rect(0, 0)); /* a block the codec threw away */
      } else if (cov > 0.14) {
        /* the edge blocks are where the channels come apart */
        if (rand() < 0.75) edgeA.push(rect(-opt.fringe, opt.fringe * 0.4));
        if (rand() < 0.75) edgeB.push(rect(opt.fringe, -opt.fringe * 0.3));
        if (rand() < opt.ring) ringing.push(rect(0, 0));
      } else if (cov > 0.02 && rand() < opt.ring * 0.7) {
        ringing.push(rect(0, 0)); /* mosquito noise out in the flat area */
      }
    }
  }
  return `<g fill="${INK.blu}" opacity="0.85">${edgeA.join("")}</g>
  <g fill="${INK.oxide}" opacity="0.7">${edgeB.join("")}</g>
  <g fill="${INK.toner}">${core.join("")}</g>
  <g fill="${INK.toner}" opacity="0.14">${ringing.join("")}</g>`;
}

/* 20 — the mark, re-saved */
write("20-compression-mark.svg", svg(240, 240, blocks({}), INK.paper));

/* 21 — further down the chain: bigger blocks, wider fringe, more dropout */
write("21-compression-mark-gen5.svg", svg(240, 240,
  blocks({ cell: 13, fringe: 4.5, drop: 0.14, ring: 0.3, seed: 77 }), INK.paper));

/* 22 — "more soon." The last thing the abandoned blog said, and the last
   line of the film. Serif, fringed, eaten by its own dropout. */
const dropout = (() => {
  const r = rng(41), out = [];
  for (let i = 0; i < 190; i++) {
    const x = 34 + r() * 640, y = 46 + r() * 116, s = 3 + r() * 10;
    out.push(`<rect x="${n(x)}" y="${n(y)}" width="${n(s)}" height="${n(s * (0.6 + r()))}"/>`);
  }
  return out.join("");
})();
write("22-compression-more-soon.svg", svg(760, 220,
  `<g font-family="${SERIF}" font-size="104" font-style="italic">
    <text x="40" y="146" fill="${INK.blu}" opacity="0.85" transform="translate(-3 1.6)">more soon.</text>
    <text x="40" y="146" fill="${INK.oxide}" opacity="0.7" transform="translate(3 -1.2)">more soon.</text>
    <text x="40" y="146" fill="${INK.toner}">more soon.</text>
  </g>
  <g fill="${INK.paper}">${dropout}</g>`, INK.paper));

/* ======================================================================
   B · NEURAL
   The same eight arms, but grown instead of drawn: a bulbous soma, spikes
   coming off it, filaments tapering out to satellite cells. White on black,
   the way it would be cut out of paper.
   ====================================================================== */
/* the cell now lives in _glyphs.js, where mksol.js can reach it too. Its
   default colour is the current palette's, so this batch names its own. */
const { cell: neural } = require("./_glyphs.js");

/* 23 — the cell. One soma, four satellites, white on black. */
write("23-neural-mark.svg", svg(240, 240, neural({ color: INK.stock }), INK.toner));

/* 24 — inverted: cut in toner, on stock */
write("24-neural-inverse.svg", svg(240, 240,
  neural({ color: INK.toner, seed: 3 }), INK.stock));

/* 25 — the cluster: six cells, the whole network of small models */
write("25-neural-cluster.svg", svg(320, 240,
  `<g transform="translate(40 0)">${neural({ sat: 6, seed: 19, scale: 1.06, color: INK.stock })}</g>`, INK.toner));

/* 26 — the cell, printed: the neural form put through the halftone screen,
   so the two languages meet */
function neuralDots(seedBase) {
  /* rebuild the same shapes, then sample coverage from a point-in-shape test
     done cheaply: distance to soma / satellites / filaments */
  const rand = rng(seedBase);
  const C = 120;
  const nodes = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.5 + rand() * 0.3;
    const R = 72 + rand() * 18;
    nodes.push({ x: C + Math.cos(a) * R, y: C + Math.sin(a) * R, r: 13 + rand() * 7 });
  }
  /* the spikes belong to the field too, or the cell reads as a lump */
  const spike = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.31;
    const L = 30 + 62 * (0.45 + ((i * 7) % 5) / 5);
    spike.push({ x1: C + Math.cos(a) * 24, y1: C + Math.sin(a) * 24,
                 x2: C + Math.cos(a) * L, y2: C + Math.sin(a) * L, w: 5 });
  }
  for (const nd of nodes) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.7;
      spike.push({ x1: nd.x, y1: nd.y,
                   x2: nd.x + Math.cos(a) * (nd.r + 20), y2: nd.y + Math.sin(a) * (nd.r + 20), w: 3.4 });
    }
  }
  const field = (x, y) => {
    let d = Math.hypot(x - C, y - C) - 30;
    for (const nd of nodes) d = Math.min(d, Math.hypot(x - nd.x, y - nd.y) - nd.r);
    for (const nd of nodes) d = Math.min(d, segDist(x, y, { x1: C, y1: C, x2: nd.x, y2: nd.y, w: 8 }));
    for (const s of spike) d = Math.min(d, segDist(x, y, s));
    return d;
  };
  const cell = 4.4, a = (15 * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const N = Math.ceil(360 / cell), out = [];
  const r2 = rng(seedBase + 91);
  for (let i = -N; i <= N; i++) {
    for (let j = -N; j <= N; j++) {
      const lx = i * cell, ly = j * cell;
      const x = 120 + lx * ca - ly * sa, y = 120 + lx * sa + ly * ca;
      if (x < -4 || x > 244 || y < -4 || y > 244) continue;
      let cov = Math.max(0, Math.min(1, 1 - field(x, y) / 10));
      cov += (r2() - 0.5) * 0.2 * (cov > 0.02 ? 1 : 0.35);
      if (cov <= 0.015) continue;
      const r = cell * 0.5 * Math.sqrt(cov);
      if (r < 0.16) continue;
      out.push(`<circle cx="${n(x + (r2() - 0.5) * 1.1)}" cy="${n(y + (r2() - 0.5) * 1.1)}" r="${n(r)}"/>`);
    }
  }
  return `<g fill="${INK.toner}">${out.join("")}</g>`;
}
write("26-neural-screened.svg", svg(240, 240, neuralDots(3), INK.stock));

/* ======================================================================
   C · RETICLE
   Instrument furniture: corner brackets, ticked axes, an ellipse, a boxed
   label. All hairline, all exact — around a thing that is neither.
   ====================================================================== */
function reticle(o) {
  const opt = Object.assign({
    w: 640, h: 640, stroke: INK.toner, sw: 1.4, label: null,
    top: null, bottom: null, inner: "",
  }, o);
  const { w, h } = opt;
  const cx = w / 2, cy = h / 2;
  const m = Math.min(w, h);
  const box = { x: cx - m * 0.34, y: cy - m * 0.30, w: m * 0.68, h: m * 0.60 };
  const br = m * 0.055; /* bracket arm */
  const corner = (x, y, sx, sy) =>
    `<path d="M ${n(x + sx * br)} ${n(y)} L ${n(x)} ${n(y)} L ${n(x)} ${n(y + sy * br)}"/>`;
  const ticks = [];
  for (let i = -4; i <= 4; i++) {
    if (!i) continue;
    const t = i / 4;
    ticks.push(`<line x1="${n(cx + t * m * 0.42)}" y1="${n(cy - m * 0.018)}" x2="${n(cx + t * m * 0.42)}" y2="${n(cy + m * 0.018)}"/>`);
    ticks.push(`<line x1="${n(cx - m * 0.018)}" y1="${n(cy + t * m * 0.42)}" x2="${n(cx + m * 0.018)}" y2="${n(cy + t * m * 0.42)}"/>`);
  }
  const capT = opt.top ? `<text x="${n(box.x + br * 0.5)}" y="${n(box.y - m * 0.012)}" font-family="${GROT}" font-size="${n(m * 0.026)}" letter-spacing="0.5" fill="${opt.stroke}">${opt.top}</text>` : "";
  const capB = opt.bottom ? `<text x="${n(box.x + br * 0.5)}" y="${n(box.y + box.h + m * 0.042)}" font-family="${GROT}" font-size="${n(m * 0.026)}" letter-spacing="0.5" fill="${opt.stroke}">${opt.bottom}</text>` : "";
  const lab = opt.label ? `
    <rect x="${n(cx - m * 0.20)}" y="${n(cy - m * 0.043)}" width="${n(m * 0.40)}" height="${n(m * 0.086)}" fill="${INK.paper}" stroke="${opt.stroke}" stroke-width="${n(opt.sw)}"/>
    <rect x="${n(cx - m * 0.222)}" y="${n(cy - m * 0.043)}" width="${n(m * 0.014)}" height="${n(m * 0.086)}" fill="${opt.stroke}"/>
    <rect x="${n(cx + m * 0.208)}" y="${n(cy - m * 0.043)}" width="${n(m * 0.014)}" height="${n(m * 0.086)}" fill="${opt.stroke}"/>
    <text x="${n(cx)}" y="${n(cy + m * 0.019)}" text-anchor="middle" font-family="${GROT}" font-weight="700" font-size="${n(m * 0.048)}" letter-spacing="1" fill="${opt.stroke}">${opt.label}</text>` : "";
  return `${opt.inner}
  <g stroke="${opt.stroke}" stroke-width="${n(opt.sw)}" fill="none">
    <line x1="${n(cx)}" y1="${n(cy - m * 0.47)}" x2="${n(cx)}" y2="${n(cy + m * 0.47)}"/>
    <line x1="${n(cx - m * 0.47)}" y1="${n(cy)}" x2="${n(cx + m * 0.47)}" y2="${n(cy)}"/>
    ${ticks.join("\n    ")}
    <ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(m * 0.31)}" ry="${n(m * 0.21)}"/>
    <rect x="${n(box.x)}" y="${n(box.y)}" width="${n(box.w)}" height="${n(box.h)}"/>
    ${corner(box.x - m * 0.03, box.y - m * 0.03, 1, 1)}
    ${corner(box.x + box.w + m * 0.03, box.y - m * 0.03, -1, 1)}
    ${corner(box.x - m * 0.03, box.y + box.h + m * 0.03, 1, -1)}
    ${corner(box.x + box.w + m * 0.03, box.y + box.h + m * 0.03, -1, -1)}
  </g>
  ${capT}${capB}${lab}`;
}

/* 27 — the mark, under the instrument */
write("27-reticle-mark.svg", svg(640, 640,
  reticle({
    top: "SMALL LANGUAGE MODELS",
    bottom: "COUNTER-ARCHIVE, COUNTER-GENERATION",
    inner: `<g transform="translate(158 158) scale(1.35)">${(() => {
      /* the dotted mark, dropped in at 240 */
      const r = rng(13), out = [];
      const k = 1, C = 120, S = segs(ARMS, true, k, C, 1);
      const cell = 4.4, a = (15 * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
      const N = Math.ceil(360 / cell);
      for (let i = -N; i <= N; i++) for (let j = -N; j <= N; j++) {
        const lx = i * cell, ly = j * cell;
        const x = 120 + lx * ca - ly * sa, y = 120 + lx * sa + ly * ca;
        if (x < -4 || x > 244 || y < -4 || y > 244) continue;
        let cov = Math.max(0, Math.min(1, 1 - sdf(x, y, S, k, C) / 9));
        cov += (r() - 0.5) * 0.2 * (cov > 0.02 ? 1 : 0.35);
        if (cov <= 0.015) continue;
        const rr = cell * 0.5 * Math.sqrt(cov);
        if (rr < 0.16) continue;
        out.push(`<circle cx="${n(x + (r() - 0.5) * 1.1)}" cy="${n(y + (r() - 0.5) * 1.1)}" r="${n(rr)}"/>`);
      }
      return `<g fill="${INK.toner}" opacity="0.9">${out.join("")}</g>`;
    })()}</g>`,
  }), INK.paper));

/* 28 — the label version: the instrument with the name in the slot */
write("28-reticle-label.svg", svg(640, 640,
  reticle({ label: "MINOR INDEX", top: "MODEL AUTOPHAGY DISORDER", bottom: "MINOR-INDEX · PLATE 01" }),
  INK.paper));

/* 29 — the eye, framed. The smallest instrument. */
write("29-reticle-eye.svg", svg(640, 400,
  reticle({
    w: 640, h: 400, top: "APERTURE", bottom: "FEED IT ONLY WHAT YOU LOVE",
    inner: `<g transform="translate(128 8) scale(1.6)">${(() => {
      const r = rng(29), out = [];
      const C = 120, cell = 4.0;
      const a = (15 * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
      const N = Math.ceil(360 / cell);
      for (let i = -N; i <= N; i++) for (let j = -N; j <= N; j++) {
        const lx = i * cell, ly = j * cell;
        const x = 120 + lx * ca - ly * sa, y = 120 + lx * sa + ly * ca;
        if (x < -4 || x > 244 || y < -4 || y > 244) continue;
        let d = Math.abs(Math.hypot(x - C, y - C) - 30) - 2.6;
        d = Math.min(d, (Math.hypot((x - C) / 26, (y - C) / 13) - 1) * 13);
        const pd = Math.hypot(x - C, y - C + 2);
        if (pd < 4.5) d = Math.max(d, 4.5 - pd);
        let cov = Math.max(0, Math.min(1, 1 - d / 11));
        cov += (r() - 0.5) * 0.2 * (cov > 0.02 ? 1 : 0.35);
        if (cov <= 0.015) continue;
        const rr = cell * 0.5 * Math.sqrt(cov);
        if (rr < 0.16) continue;
        out.push(`<circle cx="${n(x + (r() - 0.5) * 1.1)}" cy="${n(y + (r() - 0.5) * 1.1)}" r="${n(rr)}"/>`);
      }
      return `<g fill="${INK.toner}">${out.join("")}</g>`;
    })()}</g>`,
  }), INK.paper));

/* 30 — the cell, under the instrument: B inside C */
write("30-reticle-neural.svg", svg(640, 640,
  reticle({
    stroke: INK.stock, top: "SPECIMEN: THE OTHERS", bottom: "GROWN ON MY OUTPUTS",
    inner: `<g transform="translate(158 158) scale(1.35)">${neural({ seed: 47, sat: 5, color: INK.stock })}</g>`,
  }), INK.toner));

console.log("→ " + OUT);
