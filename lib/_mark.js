/* shared: the mark as a coverage field, and the instrument vocabulary.
 * required by mkwild.js — the older scripts keep their own copies. */

const INK = {
  black: "#141410",
  white: "#f4f4f2",   /* cool, not cream — no brown in this set */
  grey:  "#e4e4e0",
  fluo:  "#e8ff00",
  blu:   "#001ef7",
};
const GROT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";
const n = (v) => Number(v.toFixed(2));
const rng = (s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];

const ARMS = [0, 1, 2, 3, 4, 5, 6, 7];
const segDist = (px, py, s) => {
  const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
  const L2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - s.x1) * dx + (py - s.y1) * dy) / L2));
  return Math.hypot(px - (s.x1 + dx * t), py - (s.y1 + dy * t)) - s.w / 2;
};

/* the mark: never a solid shape, only dots whose area is the coverage */
function markDots(o) {
  const opt = Object.assign({
    size: 240, arms: ARMS, barbs: true, cell: 4.4, angle: 15,
    falloff: 9, grain: 0.2, spread: 0.5, color: INK.black, seed: 3, eyeOnly: false,
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
  /* the same press everything else goes through, over a square sheet the
     size of the mark. The lattice reaches further than it needs to, which is
     how it was printed and so how it stays. */
  return require("./_press.js").halftone({
    x: 0, y: 0, w: opt.size, h: opt.size, cell: opt.cell, angle: opt.angle,
    grain: opt.grain, spread: opt.spread, color: opt.color, seed: opt.seed,
    N: Math.ceil((opt.size * 1.5) / opt.cell),
    cover: (x, y) => Math.max(0, Math.min(1, 1 - sdf(x, y) / opt.falloff)),
  });
}

/* ---- instrument parts -------------------------------------------------- */
function L(x1, y1, x2, y2, hand, r) {
  if (!hand) return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"/>`;
  const N = 4, pts = [`M ${n(x1)} ${n(y1)}`];
  for (let i = 1; i <= N; i++) {
    const t = i / N;
    pts.push(`L ${n(x1 + (x2 - x1) * t + (r() - 0.5) * hand)} ${n(y1 + (y2 - y1) * t + (r() - 0.5) * hand)}`);
  }
  return `<path d="${pts.join(" ")}"/>`;
}
function axes(cx, cy, len, count, hand, r) {
  const out = [L(cx, cy - len, cx, cy + len, hand, r), L(cx - len, cy, cx + len, cy, hand, r)];
  for (let i = -count; i <= count; i++) {
    if (!i) continue;
    const t = (i / count) * len * 0.92;
    const s = len * 0.035;
    out.push(L(cx + t, cy - s, cx + t, cy + s, hand, r));
    out.push(L(cx - s, cy + t, cx + s, cy + t, hand, r));
  }
  return out.join("");
}
function brackets(x, y, w, h, br) {
  const c = (px, py, sx, sy) =>
    `<path d="M ${n(px + sx * br)} ${n(py)} L ${n(px)} ${n(py)} L ${n(px)} ${n(py + sy * br)}"/>`;
  return c(x, y, 1, 1) + c(x + w, y, -1, 1) + c(x, y + h, 1, -1) + c(x + w, y + h, -1, -1);
}
function dimension(x1, y1, x2, y2, label, off, stroke) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const ox = Math.cos(a + Math.PI / 2) * off, oy = Math.sin(a + Math.PI / 2) * off;
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

/* a highlighter swipe: uneven ends, a hand pulling a marker across the page */
function swipe(x, y, len, h, ang, r, color) {
  const wob = (i) => (r() - 0.5) * h * 0.22;
  const pts = [];
  const N = 6;
  for (let i = 0; i <= N; i++) pts.push([x + (len * i) / N, y + wob(i)]);
  const back = [];
  for (let i = N; i >= 0; i--) back.push([x + (len * i) / N, y + h + wob(i)]);
  const d = [...pts, ...back].map((p, i) => `${i ? "L" : "M"} ${n(p[0])} ${n(p[1])}`).join(" ") + " Z";
  return `<path d="${d}" fill="${color}" transform="rotate(${n(ang)} ${n(x)} ${n(y)})"/>`;
}

/* a body cut solid, put down again underneath itself in another ink.
 *
 * This is the second plate for a pass that is not screened. A printer spreads
 * a plate by making it fatter, and the way to fatten an outline is a pen of
 * its own colour laid round the edge — so a filled body gets a stroke, and a
 * body that was already a line just gets a wider pen. Same geometry, one ink
 * lower and a little larger: the rim between the two is the whole of it.
 */
const under = (body, color, grow) => {
  const g = grow || 0;
  return String(body).replace(/<g ([^>]*?)(\/?)>/g, (m, attrs, close) => {
    if (!/fill="|stroke="/.test(attrs)) return m;          /* a transform, nothing to ink */
    if (/fill="none"/.test(attrs)) {
      const w = /stroke-width="([\d.]+)"/.exec(attrs);
      return `<g ${attrs.replace(/stroke="[^"]*"/, `stroke="${color}"`)
        .replace(/stroke-width="[\d.]+"/, `stroke-width="${n((w ? +w[1] : 1) + g * 2)}"`)}${close}>`;
    }
    return `<g ${attrs.replace(/fill="[^"]*"/, `fill="${color}"`)}`
      + (g ? ` stroke="${color}" stroke-width="${n(g * 2)}" stroke-linejoin="round" stroke-linecap="round"` : "")
      + `${close}>`;
  });
};

/* the sheet, in two halves — so a plate can be handed over as it prints and
   still be exactly the file it would have been if it had arrived at once */
const svgOpen = (w, h, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n`
  + (bg ? `  <rect width="${w}" height="${h}" fill="${bg}"/>\n` : "")
  + "  ";
const SVG_CLOSE = "\n</svg>\n";
const svg = (w, h, body, bg) => svgOpen(w, h, bg) + body + SVG_CLOSE;
const G = (stroke, sw, body) => `<g stroke="${stroke}" stroke-width="${sw}" fill="none">${body}</g>`;

module.exports = {
  INK, GROT, MONO, ARMS, n, rng, pick, segDist,
  markDots, L, axes, brackets, dimension, callout, trim, polar, swipe, under,
  svg, svgOpen, SVG_CLOSE, G,
};
