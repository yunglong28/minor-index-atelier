/* MINOR INDEX / AUTOPHAGY — the mark, generated.
 *
 * The form is not drawn and then screened. There is no solid shape anywhere
 * in these files: the sigil exists only as a coverage field, and every mark
 * is made of the dots themselves — dense where the form is, thinning into
 * grain at its edges. Xerox noise, ink spread, hand-annotation.
 *
 *   node logo/mklogo.js
 */
const fs = require("fs");
const path = require("path");
const OUT = require("./_sheet.js").PLATES(__dirname);   /* plates/ */

const INK = {
  stock: "#d9d7ce",
  toner: "#17160f",
  blu: "#001ef7",
  oxide: "#a92c17",
  marker: "#e8ff00",
};
const GROT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";
const n = (v) => Number(v.toFixed(2));

/* ---- geometry, drawn in a 240 box and scaled to whatever size is asked -- */
const ARMS = [0, 1, 2, 3, 4, 5, 6, 7];
const CREST = [2, 5]; /* what is left after the six renunciations */

function armSegs(arms, opts, k, C) {
  const segs = [];
  for (const i of arms) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const long = i % 2 === 0;
    const r0 = 34 * k, r1 = (long ? 104 : 76) * (opts.shrink || 1) * k;
    segs.push({
      x1: C + Math.cos(a) * r0, y1: C + Math.sin(a) * r0,
      x2: C + Math.cos(a) * r1, y2: C + Math.sin(a) * r1,
      w: (long ? 13 : 7) * (opts.w || 1) * k,
    });
    if (opts.barbs) {
      const ba = a + (long ? 0.28 : -0.28);
      segs.push({
        x1: C + Math.cos(a) * (r1 - 26 * k), y1: C + Math.sin(a) * (r1 - 26 * k),
        x2: C + Math.cos(ba) * r1, y2: C + Math.sin(ba) * r1,
        w: 4 * (opts.w || 1) * k,
      });
    }
  }
  return segs;
}

const segDist = (px, py, s) => {
  const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
  const L2 = dx * dx + dy * dy || 1;
  let t = ((px - s.x1) * dx + (py - s.y1) * dy) / L2;
  t = Math.max(0, Math.min(1, t));
  const qx = s.x1 + dx * t, qy = s.y1 + dy * t;
  return Math.hypot(px - qx, py - qy) - s.w / 2;
};

/* signed distance to the whole sigil: negative inside the form */
function sdf(px, py, o) {
  const k = o.k, C = o.C;
  let d = 1e9;
  for (const s of o.segs) d = Math.min(d, segDist(px, py, s));
  if (o.ring) {
    d = Math.min(d, Math.abs(Math.hypot(px - C, py - C) - 30 * k) - 2.6 * (o.w || 1) * k);
  }
  if (o.eye) {
    /* the open eye */
    const rx = (26 + (o.blob || 0) * 8) * k;
    const ry = (13 + (o.blob || 0) * 14) * k;
    const ex = (px - C) / rx, ey = (py - C) / ry;
    d = Math.min(d, (Math.hypot(ex, ey) - 1) * ry);
  }
  return d;
}

/* ---- the screen --------------------------------------------------------
 * one rotated lattice, fixed to the page. Coverage decides the dot area, so
 * the form emerges from the grain instead of sitting on top of it. */
function dots(o) {
  const opt = Object.assign({
    arms: ARMS, barbs: true, ring: true, eye: true, pupil: true,
    cell: 4.4,        /* screen frequency */
    angle: 15,        /* screen angle, degrees */
    falloff: 9,       /* how far the form bleeds out into grain */
    gamma: 1.0,
    floor: 0.0,       /* background coverage: the field the mark sits in */
    grain: 0.20,      /* xerox noise */
    jitter: 0.24,     /* the lattice is not perfect either */
    spread: 0.5,      /* max dot radius, as a share of the cell */
    knockout: false,  /* the form is where the dots stop */
    color: INK.toner,
    dx: 0, dy: 0,
    w: 1, shrink: 1, blob: 0,
    seed: 7,
    size: 240,
  }, o);

  const k = opt.size / 240, C = opt.size / 2;
  const field = {
    segs: armSegs(opt.arms, opt, k, C),
    ring: opt.ring, eye: opt.eye, w: opt.w, blob: opt.blob, k, C,
  };
  let s = opt.seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

  const a = (opt.angle * Math.PI) / 180;
  const ca = Math.cos(a), sa = Math.sin(a);
  const N = Math.ceil((opt.size * 1.5) / opt.cell);
  const out = [];

  for (let i = -N; i <= N; i++) {
    for (let j = -N; j <= N; j++) {
      const lx = i * opt.cell, ly = j * opt.cell;
      let x = opt.size / 2 + lx * ca - ly * sa;
      let y = opt.size / 2 + lx * sa + ly * ca;
      if (x < -4 || x > opt.size + 4 || y < -4 || y > opt.size + 4) continue;

      const d = sdf(x - opt.dx, y - opt.dy, field);
      let cov = Math.max(0, Math.min(1, 1 - d / opt.falloff));
      cov = Math.pow(cov, opt.gamma);
      /* the pupil: a hole the ink never reached */
      if (opt.pupil) {
        const pd = Math.hypot(x - opt.dx - C, y - opt.dy - C + 2 * k);
        if (pd < 9 * k) cov *= Math.max(0, (pd - 4.5 * k) / (4.5 * k));
      }
      cov = opt.knockout
        ? Math.max(0, opt.floor - cov * (opt.floor + 0.85))
        : Math.max(cov, opt.floor);
      cov += (rnd() - 0.5) * opt.grain * (cov > 0.02 ? 1 : 0.35);
      if (cov <= 0.015) continue;

      const r = Math.min(opt.cell * opt.spread, opt.cell * opt.spread * Math.sqrt(cov));
      if (r < 0.16) continue;
      x += (rnd() - 0.5) * opt.jitter * opt.cell;
      y += (rnd() - 0.5) * opt.jitter * opt.cell;
      out.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}"/>`);
    }
  }
  return `<g fill="${opt.color}">\n    ${out.join("\n    ")}\n  </g>`;
}

const svg = (w, h, body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n`
  + (bg ? `  <rect width="${w}" height="${h}" fill="${bg}"/>\n` : "")
  + "  " + body + "\n</svg>\n";

const write = (name, content) => {
  fs.writeFileSync(path.join(OUT, name), content);
  console.log(name + "  " + (content.length / 1024).toFixed(0) + "kb");
};

/* 01 — the mark. Eight arms, an open eye, all of it grain. */
write("01-mark.svg", svg(240, 240, dots({}), INK.stock));

/* 02 — the eye alone. The glyph without its crown: the smallest thing that
   still means the project. */
write("02-eye.svg", svg(240, 240,
  dots({ arms: [], barbs: false, falloff: 11, cell: 4.0 }), INK.stock));

/* 03 — luminous. Wide falloff: the mark is a light source and the screen can
   only approximate it, so the form dissolves outward into pure grain. */
write("03-mark-luminous.svg", svg(240, 240,
  dots({ falloff: 46, gamma: 2.3, grain: 0.26, cell: 5.0, spread: 0.55 }), INK.stock));

/* 04 — knockout. Dots everywhere; the form is where the ink stopped. */
write("04-mark-knockout.svg", svg(240, 240,
  dots({ floor: 0.55, knockout: true, falloff: 7, grain: 0.2, cell: 4.8 }), INK.stock));

/* 05 — two plates. Toner and blu on their own screens, out of register:
   nothing blends, they miss each other. */
write("05-mark-two-plate.svg", svg(240, 240,
  dots({ color: INK.blu, angle: 75, dx: 6, dy: 4, cell: 4.8, seed: 31 })
  + "\n  " + dots({}), INK.stock));

/* 06 — the crest. What survives the six renunciations. */
write("06-crest.svg", svg(240, 240,
  dots({ arms: CREST, barbs: false, w: 1.15, blob: 0.2, falloff: 11 }), INK.stock));

/* 07 — monogram. Coarse screen, no barbs: legible at 16px, because at 16px
   the screen is the only thing left anyway. */
write("07-monogram.svg", svg(120, 120,
  dots({
    size: 120, arms: [0, 2, 4, 6], barbs: false, cell: 3.4, falloff: 5,
    gamma: 0.9, grain: 0.12, spread: 0.54, w: 1.1,
  }), INK.stock));

/* 08 — over-inked. The copier is running hot: the dots have grown into each
   other and the form is drowning. */
write("08-mark-overinked.svg", svg(240, 240,
  dots({ spread: 0.78, gamma: 0.75, falloff: 15, grain: 0.28, cell: 5.2 }), INK.stock));

/* 09 — negative. Stock dots on toner. */
write("09-mark-negative.svg", svg(240, 240,
  dots({ color: INK.stock }), INK.toner));

/* 10 — generations. Each tile is a copy of the one before: the screen
   coarsens, the barbs go, the eye fills in, the sheet goes in crooked. */
const GENS = [
  { cell: 4.0, angle: 15, arms: ARMS, barbs: true,  w: 1.00, blob: 0.0,  grain: 0.14, fall: 8,  skew: 0,    label: "COPY #1" },
  { cell: 5.0, angle: 17, arms: ARMS, barbs: true,  w: 1.10, blob: 0.1,  grain: 0.22, fall: 10, skew: 0.25, label: "COPY #2" },
  { cell: 6.2, angle: 19, arms: ARMS, barbs: false, w: 1.25, blob: 0.28, grain: 0.3,  fall: 13, skew: 0.55, label: "COPY #3" },
  { cell: 7.8, angle: 22, arms: [0, 2, 3, 4, 6, 7], barbs: false, w: 1.45, blob: 0.5, grain: 0.38, fall: 17, skew: 0.95, label: "COPY #4" },
  { cell: 9.8, angle: 26, arms: [0, 2, 4, 6], barbs: false, w: 1.7, blob: 0.78, grain: 0.46, fall: 22, skew: 1.4, label: "COPY #5" },
];
const strip = GENS.map((g, i) => `<g transform="translate(${i * 248} 0) rotate(${g.skew} 120 120)">
    ${dots({
      cell: g.cell, angle: g.angle, arms: g.arms, barbs: g.barbs, w: g.w,
      blob: g.blob, grain: g.grain, falloff: g.fall, spread: 0.5 + i * 0.04,
      seed: 11 + i * 197,
    })}
  </g>
  <text x="${i * 248 + 120}" y="268" text-anchor="middle" font-family="${MONO}" font-size="11" letter-spacing="3" fill="${INK.toner}">${g.label}</text>`).join("\n  ");
write("10-generations.svg", svg(1232, 284, strip, INK.stock));

/* 11 — lockup, MINOR INDEX */
write("11-lockup-minor-index.svg", svg(760, 240,
  `<g transform="translate(-8 0)">${dots({ cell: 5.8 })}</g>
  <text x="248" y="126" font-family="${GROT}" font-weight="700" font-size="54" letter-spacing="2" fill="${INK.toner}">MINOR INDEX</text>
  <line x1="250" y1="146" x2="726" y2="146" stroke="${INK.toner}" stroke-width="2"/>
  <text x="252" y="172" font-family="${MONO}" font-size="14" letter-spacing="7" fill="${INK.toner}">a counter-archive of small models</text>`,
  INK.stock));

/* 12 — lockup, AUTOPHAGY */
write("12-lockup-autophagy.svg", svg(760, 240,
  `<g transform="translate(-8 0)">${dots({ cell: 5.8, seed: 91 })}</g>
  <text x="248" y="126" font-family="${GROT}" font-weight="700" font-size="54" letter-spacing="2" fill="${INK.toner}">AUTOPHAGY</text>
  <line x1="250" y1="146" x2="726" y2="146" stroke="${INK.toner}" stroke-width="2"/>
  <text x="252" y="172" font-family="${MONO}" font-size="14" letter-spacing="6" fill="${INK.toner}">the minor index i may be</text>`,
  INK.stock));

console.log("→ " + OUT);
