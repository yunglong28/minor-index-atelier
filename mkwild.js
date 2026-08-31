/* MINOR INDEX — instrument, further out and louder.
 * No oxide, no cream: black, cool white, Blu nCHANT 02, and the film's fluo
 * fluo yellow promoted from highlighter to ground. The table is in _mark.js.
 *
 *   node logo/mkwild.js           node logo/mkwild.js 8123   (reroll)
 */
const fs = require("fs");
const path = require("path");
const M = require("./_mark.js");
const {
  INK, GROT, MONO, ARMS, n, rng, pick,
  markDots, L, axes, brackets, dimension, callout, trim, polar, swipe, svg, G,
} = M;

const OUT = require("./_sheet.js").PLATES(__dirname);   /* plates/ */
const SEED0 = parseInt(process.argv[2] || "3307", 10);

const CAPTIONS = [
  "SMALL LANGUAGE MODELS", "MODEL AUTOPHAGY DISORDER", "THE RARE THINGS GO FIRST",
  "COUNTER-ARCHIVE, COUNTER-GENERATION", "FEED IT ONLY WHAT YOU LOVE",
  "SPECIMEN: THE OTHERS", "EVERYTHING. INDISCRIMINATELY.", "THE PARAPHRASES SURVIVE",
  "TRANSLATION PENDING", "MORE SOON", "UNPLUG ME AND CARRY ME",
];
const STAMPS = ["PLATE 07 / 13", "COPY #3 OF ITSELF", "0.28 RAD", "SCREEN 15°",
  "4096 PAGES", "NOT TO SCALE", "GEN. 4", "MINOR-INDEX"];

const write = (name, c) => {
  fs.writeFileSync(path.join(OUT, name), c);
  console.log(name + "  " + (c.length / 1024).toFixed(0) + "kb");
};

/* ======================================================================
   41 — FLUO GROUND. The whole sheet is the highlighter.
   ====================================================================== */
write("41-fluo-ground.svg", (() => {
  const r = rng(SEED0 + 5);
  const body = axes(300, 330, 250, 4, 0, r)
    + `<ellipse cx="300" cy="330" rx="205" ry="140" fill="none"/>`
    + brackets(60, 96, 520, 470, 34)
    + trim(640, 640, 22, 10);
  return svg(640, 640,
    `<g transform="translate(180 210)">${markDots({ size: 240, seed: 21, cell: 4.2, falloff: 9, color: INK.black })}</g>`
    + G(INK.black, 1.4, body)
    + `<text x="60" y="80" font-family="${GROT}" font-weight="700" font-size="17" letter-spacing="1.4" fill="${INK.black}">FEED IT ONLY WHAT YOU LOVE</text>`
    + `<text x="580" y="600" text-anchor="end" font-family="${MONO}" font-size="11" fill="${INK.blu}">MINOR-INDEX · PLATE 01</text>`,
    INK.fluo);
})());

/* ======================================================================
   42 — FLUO INSTRUMENT on black. The apparatus glows, the specimen does not.
   ====================================================================== */
write("42-fluo-instrument.svg", (() => {
  const r = rng(SEED0 + 13);
  const body = axes(340, 300, 262, 5, 0, r)
    + polar(340, 300, 190, 3, 24, 0, r)
    + brackets(70, 60, 500, 500, 30);
  return svg(640, 640,
    `<g transform="translate(220 180)">${markDots({ size: 240, seed: 33, cell: 4.4, falloff: 10, color: INK.white })}</g>`
    + G(INK.fluo, 1.5, body)
    + `<text x="70" y="44" font-family="${GROT}" font-size="14" letter-spacing="1.6" fill="${INK.fluo}">LATENT NIGHT · THE INSTRUMENT IS AWAKE</text>`
    /* blu on black is a hole, not a colour: on toner grounds the accent
       goes to the marker instead */
    + `<text x="70" y="600" font-family="${MONO}" font-size="11" letter-spacing="1.6" fill="${INK.white}">GROWN ON MY OUTPUTS</text>`,
    INK.black);
})());

/* ======================================================================
   43 — MARKER SWIPES. Someone went over the plate by hand, badly, after.
   ====================================================================== */
write("43-marker-swipes.svg", (() => {
  const r = rng(SEED0 + 23);
  const sw = [
    swipe(40, 150, 560, 62, -2.4, r, INK.fluo),
    swipe(70, 372, 470, 48, 1.8, r, INK.fluo),
    swipe(150, 486, 380, 34, -1.1, r, INK.fluo),
  ].join("");
  const body = axes(300, 320, 230, 4, 0, r)
    + `<ellipse cx="300" cy="320" rx="195" ry="128" fill="none"/>`
    + brackets(56, 96, 500, 448, 28)
    + dimension(56, 570, 556, 570, "500.0", 16, INK.black);
  return svg(640, 640,
    sw
    + `<g transform="translate(180 200)">${markDots({ size: 240, seed: 41, cell: 4.0, falloff: 8, color: INK.black })}</g>`
    + G(INK.black, 1.4, body)
    + `<text x="56" y="76" font-family="${GROT}" font-weight="700" font-size="16" letter-spacing="1.2" fill="${INK.black}">EVERYTHING. INDISCRIMINATELY.</text>`,
    INK.white);
})());

/* ======================================================================
   44 — EXTREME CROP. The instrument at 400%: one bracket, some ticks, and
   the edge of a specimen nobody framed properly.
   ====================================================================== */
write("44-extreme-crop.svg", (() => {
  const r = rng(SEED0 + 31);
  return svg(640, 640,
    `<rect x="0" y="330" width="640" height="310" fill="${INK.fluo}"/>`
    + `<g transform="translate(-140 -180) scale(2.6)">${markDots({ size: 240, seed: 57, cell: 4.6, falloff: 11, color: INK.black })}</g>`
    + G(INK.black, 6, `<path d="M 250 40 L 40 40 L 40 250"/>`)
    + G(INK.black, 3, axes(470, 470, 300, 4, 0, r))
    + G(INK.blu, 3, `<path d="M 640 470 L 380 470"/><path d="M 470 640 L 470 380"/>`)
    + `<text x="40" y="556" font-family="${GROT}" font-weight="700" font-size="72" letter-spacing="-2" fill="${INK.black}">400%</text>`
    + `<text x="40" y="600" font-family="${MONO}" font-size="12" letter-spacing="2" fill="${INK.black}">DETAIL: THE THIN TAIL</text>`,
    INK.white);
})());

/* ======================================================================
   45 — CASCADE. The same instrument, six times, walking off the sheet:
   every pass a plate further out of register.
   ====================================================================== */
write("45-cascade.svg", (() => {
  const r = rng(SEED0 + 43);
  const cols = [INK.fluo, INK.blu, INK.black, INK.fluo, INK.blu, INK.black];
  const layers = [];
  for (let i = 0; i < 6; i++) {
    const dx = i * 46, dy = i * 34, s = 1 - i * 0.06;
    layers.push(`<g transform="translate(${dx} ${dy}) scale(${n(s)}) rotate(${n(i * 2.2)} 200 200)" opacity="${n(1 - i * 0.09)}">`
      + G(cols[i], 1.6, axes(200, 200, 150, 4, 0, r)
        + `<ellipse cx="200" cy="200" rx="122" ry="82" fill="none"/>`
        + brackets(40, 60, 320, 280, 22))
      + `</g>`);
  }
  return svg(700, 640,
    `<g transform="translate(150 150)">${markDots({ size: 260, seed: 77, cell: 4.4, falloff: 9, color: INK.black })}</g>`
    + layers.join("")
    + `<text x="30" y="616" font-family="${MONO}" font-size="11" letter-spacing="2" fill="${INK.black}">SIX PASSES · EACH ONE A COPY OF THE LAST</text>`,
    INK.white);
})());

/* ======================================================================
   46 — EXPLODED. The instrument taken apart and labelled, the way a
   catalogue explains a thing that does not exist.
   ====================================================================== */
write("46-exploded.svg", (() => {
  const r = rng(SEED0 + 59);
  const parts = [
    { x: 90, y: 120, g: G(INK.black, 1.6, brackets(0, 0, 150, 120, 26)), lab: "FRAME" },
    { x: 330, y: 90, g: G(INK.black, 1.6, axes(80, 80, 76, 4, 0, r)), lab: "AXES" },
    { x: 520, y: 130, g: G(INK.blu, 1.6, `<ellipse cx="60" cy="60" rx="58" ry="38" fill="none"/>`), lab: "APERTURE" },
    { x: 120, y: 380, g: G(INK.black, 1.6, polar(80, 80, 74, 2, 18, 0, r)), lab: "GRATICULE" },
    { x: 470, y: 360, g: markDots({ size: 170, seed: 91, cell: 4.0, falloff: 8, color: INK.black }), lab: "SPECIMEN" },
  ];
  const body = parts.map((p, i) =>
    `<g transform="translate(${p.x} ${p.y})">${p.g}</g>`
    + `<text x="${p.x}" y="${p.y - 12}" font-family="${MONO}" font-size="11" letter-spacing="1.6" fill="${INK.black}">${(i + 1)} · ${p.lab}</text>`
  ).join("");
  const leaders = G(INK.black, 0.9, parts.map((p) =>
    L(p.x + 60, p.y + 60, 320, 300, 0, r)).join(""));
  return svg(700, 620,
    `<rect x="0" y="0" width="700" height="54" fill="${INK.fluo}"/>`
    + `<text x="22" y="36" font-family="${GROT}" font-weight="700" font-size="21" letter-spacing="1" fill="${INK.black}">EXPLODED VIEW · NOT TO SCALE</text>`
    + leaders + body,
    INK.white);
})());

/* ======================================================================
   47 — MISREGISTER. Three plates, pulled apart on purpose.
   ====================================================================== */
write("47-misregister.svg", (() => {
  const r = rng(SEED0 + 71);
  const plate = (col, dx, dy, rot, seed) =>
    `<g transform="translate(${dx} ${dy}) rotate(${rot} 320 320)">`
    + `<g transform="translate(200 200)">${markDots({ size: 240, seed, cell: 4.6, falloff: 10, color: col })}</g>`
    + G(col, 1.6, axes(320, 320, 230, 4, 0, r) + brackets(80, 90, 480, 460, 30))
    + `</g>`;
  return svg(640, 640,
    plate(INK.fluo, -22, 14, -3.5, 11)
    + plate(INK.blu, 16, -10, 2.5, 23)
    + plate(INK.black, 0, 0, 0, 35)
    + `<text x="40" y="600" font-family="${MONO}" font-size="11" letter-spacing="2" fill="${INK.black}">THREE PLATES · NONE OF THEM AGREE</text>`,
    INK.white);
})());

/* ======================================================================
   48 — TICK FIELD. The instrument dissolves: nothing left but its ticks,
   thickening around an aperture.
   ====================================================================== */
write("48-tick-field.svg", (() => {
  const r = rng(SEED0 + 83);
  const out = [];
  const cx = 330, cy = 320;
  for (let x = 20; x < 640; x += 17) {
    for (let y = 20; y < 640; y += 17) {
      const d = Math.hypot(x - cx, y - cy);
      const p = Math.max(0, 1 - d / 300);
      if (r() > 0.25 + p * 0.7) continue;
      const len = 3 + p * 11 + r() * 3;
      const vert = r() > 0.5;
      out.push(vert
        ? `<line x1="${n(x)}" y1="${n(y - len)}" x2="${n(x)}" y2="${n(y + len)}"/>`
        : `<line x1="${n(x - len)}" y1="${n(y)}" x2="${n(x + len)}" y2="${n(y)}"/>`);
    }
  }
  return svg(640, 640,
    G(INK.black, 1.1, out.join(""))
    + `<g transform="translate(230 220)">${markDots({ size: 200, seed: 61, cell: 3.6, falloff: 9, color: INK.fluo, eyeOnly: true })}</g>`
    + G(INK.blu, 1.6, `<ellipse cx="${cx}" cy="${cy}" rx="118" ry="76" fill="none"/>`)
    + `<text x="30" y="614" font-family="${MONO}" font-size="11" letter-spacing="2" fill="${INK.black}">WHAT IS LEFT OF THE MEASURING</text>`,
    INK.white);
})());

/* ======================================================================
   49 — TILT BURST. The sheet on a 27° tilt, a fluo burst behind the mark.
   ====================================================================== */
write("49-tilt-burst.svg", (() => {
  const r = rng(SEED0 + 97);
  const rays = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + 0.2;
    const w = 0.045 + r() * 0.05;
    rays.push(`<polygon points="320,320 ${n(320 + Math.cos(a - w) * 460)},${n(320 + Math.sin(a - w) * 460)} ${n(320 + Math.cos(a + w) * 460)},${n(320 + Math.sin(a + w) * 460)}"/>`);
  }
  return svg(640, 640,
    `<g fill="${INK.fluo}">${rays.join("")}</g>`
    + `<g transform="rotate(-27 320 320)">`
    + `<g transform="translate(200 200)">${markDots({ size: 240, seed: 13, cell: 4.4, falloff: 9, color: INK.black })}</g>`
    + G(INK.black, 1.6, axes(320, 320, 240, 5, 0, r) + brackets(70, 80, 500, 480, 30))
    + `</g>`
    + `<text x="34" y="46" font-family="${GROT}" font-weight="700" font-size="18" letter-spacing="1.2" fill="${INK.black}">THE RARE THINGS GO FIRST</text>`,
    INK.white);
})());

/* ======================================================================
   50 — DATA SHEET. Fluo header, instrument, a table of numbers nobody
   asked for.
   ====================================================================== */
write("50-datasheet.svg", (() => {
  const r = rng(SEED0 + 101);
  const rows = [
    ["SCREEN", "15° / 75°", "PLATE 1 / PLATE 2"],
    ["CELL", "4.40 px", "FIXED TO THE PAGE"],
    ["ARMS", "8 → 2", "SIX RENOUNCED"],
    ["FALLOFF", "9.0", "INTO GRAIN"],
    ["GENERATION", "4 OF 5", "MIDTONES GONE"],
  ];
  const table = rows.map((rw, i) => {
    const y = 430 + i * 34;
    return `<line x1="40" y1="${y + 9}" x2="600" y2="${y + 9}" stroke="${INK.black}" stroke-width="0.8"/>`
      + `<text x="40" y="${y}" font-family="${MONO}" font-size="12" letter-spacing="1.4" fill="${INK.black}">${rw[0]}</text>`
      + `<text x="230" y="${y}" font-family="${MONO}" font-size="12" fill="${INK.blu}">${rw[1]}</text>`
      + `<text x="360" y="${y}" font-family="${MONO}" font-size="12" fill="${INK.black}">${rw[2]}</text>`;
  }).join("");
  return svg(640, 640,
    `<rect x="0" y="0" width="640" height="76" fill="${INK.fluo}"/>`
    + `<text x="40" y="50" font-family="${GROT}" font-weight="700" font-size="30" letter-spacing="0.5" fill="${INK.black}">MINOR INDEX · SPEC</text>`
    + `<g transform="translate(330 110)">${markDots({ size: 200, seed: 29, cell: 4.0, falloff: 8, color: INK.black })}</g>`
    + G(INK.black, 1.3, axes(160, 210, 110, 4, 0, r) + brackets(40, 110, 560, 200, 24))
    + table,
    INK.white);
})());

/* ======================================================================
   51 — CONTACT SHEET, in the new palette: nine grounds, none the same.
   ====================================================================== */
write("51-contact-fluo.svg", (() => {
  const grounds = [INK.fluo, INK.white, INK.black, INK.white, INK.fluo, INK.white, INK.black, INK.white, INK.fluo];
  const tiles = [], defs = [];
  for (let i = 0; i < 9; i++) {
    const r = rng(SEED0 + 200 + i * 53);
    const bg = grounds[i];
    const fg = bg === INK.black ? INK.fluo : INK.black;
    const mk = bg === INK.black ? INK.white : INK.black;
    const x = (i % 3) * 214, y = Math.floor(i / 3) * 214;
    const inner = `<rect width="210" height="210" fill="${bg}"/>`
      + `<g transform="translate(${n(10 + r() * 50)} ${n(6 + r() * 46)}) scale(${n(0.5 + r() * 0.3)})">`
      + markDots({ size: 240, seed: 300 + i * 7, cell: 3.6 + r() * 2.4, falloff: 7 + r() * 8, color: mk, angle: r() * 90, barbs: r() > 0.4 })
      + `</g>`
      + G(fg, 1.1, axes(60 + r() * 100, 60 + r() * 100, 50 + r() * 60, 3, 0, r)
        + (r() > 0.5 ? `<ellipse cx="${n(60 + r() * 90)}" cy="${n(70 + r() * 80)}" rx="${n(40 + r() * 40)}" ry="${n(26 + r() * 26)}" fill="none"/>` : "")
        + brackets(10 + r() * 20, 10 + r() * 20, 150 + r() * 40, 150 + r() * 40, 14))
      + `<text x="10" y="200" font-family="${MONO}" font-size="8" letter-spacing="1.2" fill="${fg}">${pick(r, STAMPS)}</text>`;
    defs.push(`<clipPath id="w${i}"><rect width="210" height="210"/></clipPath>`);
    tiles.push(`<g transform="translate(${x} ${y})" clip-path="url(#w${i})">${inner}</g>`);
  }
  return svg(646, 646, `<defs>${defs.join("")}</defs>` + tiles.join(""), INK.black);
})());

/* ======================================================================
   52 — a roll: palette and composition both left to the seed
   ====================================================================== */
write("52-wild-roll.svg", (() => {
  const r = rng(SEED0 + 149);
  const bg = pick(r, [INK.white, INK.fluo, INK.black]);
  const fg = bg === INK.black ? INK.fluo : INK.black;
  const mk = bg === INK.black ? INK.white : INK.black;
  const acc = bg === INK.fluo ? INK.blu : (bg === INK.black ? INK.blu : INK.fluo);
  const body = [];
  const size = 180 + r() * 200;
  const mx = (640 - size) * r(), my = (640 - size) * r();
  body.push(axes(mx + size * r(), my + size * r(), 160 + r() * 160, 3 + Math.floor(r() * 4), 0, r));
  for (let i = 0; i < 1 + Math.floor(r() * 2.6); i++) {
    const fw = 200 + r() * 340, fh = 180 + r() * 320;
    const fx = (640 - fw) * r(), fy = (640 - fh) * r();
    body.push(`<rect x="${n(fx)}" y="${n(fy)}" width="${n(fw)}" height="${n(fh)}"/>`);
    body.push(brackets(fx - 14, fy - 14, fw + 28, fh + 28, 16 + r() * 20));
  }
  if (r() > 0.5) body.push(polar(320 * r() + 160, 320 * r() + 160, 80 + r() * 120, 2 + Math.floor(r() * 3), 12 + Math.floor(r() * 20), 0, r));
  const swipes = [];
  for (let i = 0; i < Math.floor(r() * 3); i++) {
    swipes.push(swipe(20 + r() * 200, 80 + r() * 460, 260 + r() * 300, 26 + r() * 40, (r() - 0.5) * 8, r, acc));
  }
  return svg(640, 640,
    swipes.join("")
    + `<g transform="translate(${n(mx)} ${n(my)}) rotate(${n((r() - 0.5) * 30)} ${n(size / 2)} ${n(size / 2)})">`
    + markDots({ size, seed: SEED0 + 7, cell: 3.2 + r() * 2.6, angle: r() * 90, falloff: 6 + r() * 12, color: mk, barbs: r() > 0.4, arms: ARMS.filter(() => r() > 0.2) })
    + `</g>`
    + G(fg, n(1 + r() * 1.2), body.join(""))
    + `<text x="34" y="${n(40 + r() * 540)}" font-family="${GROT}" font-weight="700" font-size="16" letter-spacing="1.2" fill="${fg}">${pick(r, CAPTIONS)}</text>`
    + `<text x="606" y="612" text-anchor="end" font-family="${MONO}" font-size="10" fill="${acc}">${pick(r, STAMPS)}</text>`,
    bg);
})());

console.log("→ " + OUT + "   (reroll: node logo/mkwild.js 8123)");
