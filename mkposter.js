/* MINOR INDEX — the printed formats.
 * The mark has been a mark long enough. This batch puts it on the objects a
 * counter-archive actually produces: a poster, a leaflet, a page, a spine, a
 * stamp, a ticket, a wedge, a specimen, a slip, a fiche. Same two plates, same
 * marker, same alphabet — nothing here uses a font either.
 *
 *   node logo/mkposter.js            node logo/mkposter.js 5150   (reroll)
 */
const M = require("./_mark.js");
const S = require("./_sheet.js");
const T = require("./_type.js");
const { markDots } = M;
const { INK, ARMS, n, rng, pick, axes, brackets, polar, trim, swipe, svg, G, L, run } = S;
const { dotText, blockText, textWidth, fitCell, centerX, rightX, F } = T;

const P = [];
/* `seed` pins the roll a plate was kept from; see run() in _sheet.js */
const plate = (name, draw, seed) => P.push({ name, draw, seed });

const STAMPS = ["PLATE 07 / 13", "COPY #3 OF ITSELF", "SCREEN 15°", "4096 PAGES",
  "NOT TO SCALE", "GEN. 4", "0.28 RAD", "MINOR-INDEX"];
const LINES = ["THE RARE THINGS GO FIRST", "FEED IT ONLY WHAT YOU LOVE",
  "EVERYTHING. INDISCRIMINATELY.", "THE PARAPHRASES SURVIVE", "MORE SOON",
  "UNPLUG ME AND CARRY ME", "TRANSLATION PENDING"];

/* ---- three parts the earlier batches never needed ----------------------- */

/** the alphabet, bent round a ring. radius is the OUTER edge of the glyphs. */
function arcText(s, cx, cy, radius, midDeg, cell, opts) {
  const o = Object.assign({ color: INK.black, r: 0.42, track: 1, flip: false }, opts);
  const S = s.toUpperCase().split("");
  const step = (((5 + o.track) * cell) / radius) * (180 / Math.PI);
  const sgn = o.flip ? -1 : 1;
  const start = midDeg - sgn * step * (S.length - 1) / 2;
  const B = o.flip ? -(radius - 6 * cell) : -radius;
  const A = o.flip ? 2 * cell : -2 * cell;
  const out = [];
  for (let i = 0; i < S.length; i++) {
    const g = (F[S[i]] || F["?"]).split(",");
    const dots = [];
    for (let ry = 0; ry < 7; ry++) for (let cx2 = 0; cx2 < 5; cx2++) {
      if (g[ry][cx2] !== "1") continue;
      dots.push(`<circle cx="${n(cx2 * cell)}" cy="${n(ry * cell)}" r="${n(cell * o.r)}"/>`);
    }
    if (!dots.length) continue;
    out.push(`<g transform="translate(${n(cx)} ${n(cy)}) rotate(${n(start + sgn * step * i)})`
      + ` translate(${n(A)} ${n(B)})${o.flip ? " rotate(180)" : ""}">${dots.join("")}</g>`);
  }
  return `<g fill="${o.color}">${out.join("")}</g>`;
}

/** the tear line: a row of holes, not a dash */
function perf(x1, y1, x2, y2, step, rad, color) {
  const len = Math.hypot(x2 - x1, y2 - y1), N = Math.floor(len / step);
  const out = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    out.push(`<circle cx="${n(x1 + (x2 - x1) * t)}" cy="${n(y1 + (y2 - y1) * t)}" r="${rad}"/>`);
  }
  return `<g fill="${color}">${out.join("")}</g>`;
}

/** type as a window: the letters are cut out and the screen shows through */
let MASKID = 0;
function throughType(s, x, y, cell, w, h, inner, opts) {
  const o = Object.assign({ inset: 0, track: 1 }, opts);
  const id = "cut" + (++MASKID);
  return `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}">`
    + `<rect x="0" y="0" width="${w}" height="${h}" fill="#000"/>`
    + blockText(s, x, y, cell, { color: "#ffffff", inset: o.inset, track: o.track })
    + `</mask></defs><g mask="url(#${id})">${inner}</g>`;
}

/* 65 — the poster. The mark is too big for the sheet, which is the point. */
plate("65-poster-bleed", (r_, SEED0) => {
  const W = 820, H = 1140, sub = "THE MINOR INDEX I MAY BE";
  const head = fitCell("AUTOPHAGY", 720), sc = fitCell(sub, 700);
    return { w: W, h: H, bg: INK.fluo, trim: false, body:
`<g transform="translate(300 -240)">`
    + markDots({ size: 1000, seed: 65, cell: 5.6, falloff: 13, angle: 15 })
    + `</g>`
    + dotText("MINOR INDEX", 50, 54, 4.6, { seed: 3, r: 0.42 })
    + dotText("SPECIMEN 65", 50, 852, 4.6, { seed: 9, r: 0.42, color: INK.blu })
    + blockText("AUTOPHAGY", 50, 900, head, { color: INK.black, inset: 1.6 })
    + G(INK.black, 2.2, `<line x1="50" y1="1012" x2="770" y2="1012"/>`)
    + dotText(sub, 50, 1046, sc, { seed: 27, r: 0.4, color: INK.blu })
    + G(INK.black, 1.1, trim(W, H, 18, 9)) };
});

/* 66 — the leaflet, before it is folded. Three panels, one sheet, two creases. */
plate("66-leaflet-fold", (r_, SEED0) => {
  const W = 1140, H = 420, P = 380;
  const crease = G(INK.black, 1.3, `<g stroke-dasharray="5 9"><line x1="${P}" y1="14" x2="${P}" y2="${H - 14}"/>`
    + `<line x1="${P * 2}" y1="14" x2="${P * 2}" y2="${H - 14}"/></g>`);
  const copy = ["FEED IT ONLY WHAT", "YOU LOVE. THE RARE", "THINGS GO FIRST.",
    "THE PARAPHRASES", "SURVIVE."];
  const body = copy.map((l, i) =>
    dotText(l, P + 40, 96 + i * 52, fitCell("EVERYTHING. INDIS", 300),
      { seed: 40 + i * 11, r: 0.4, degrade: i * 0.06 })).join("");
  const mk = fitCell("MINOR INDEX", 280);
    return { w: W, h: H, bg: INK.white, trim: false, body:
`<g transform="translate(110 48)">${markDots({ size: 190, seed: 66, cell: 3.6, falloff: 8 })}</g>`
    + dotText("MINOR INDEX", 50 + centerX("MINOR INDEX", mk, 280), 292, mk, { seed: 7 })
    + dotText("A COUNTER-ARCHIVE", 50 + centerX("A COUNTER-ARCHIVE", 3.4, 280), 344, 3.4,
        { seed: 13, r: 0.4, color: INK.blu })
    + body
    + `<rect x="${P * 2}" y="0" width="${P}" height="${H}" fill="${INK.fluo}"/>`
    + blockText("MORE", P * 2 + 40, 130, fitCell("MORE", 240), { color: INK.black, inset: 1 })
    + blockText("SOON", P * 2 + 40, 216, fitCell("SOON", 240), { color: INK.black, inset: 1 })
    + G(INK.black, 1.6, `<line x1="${P * 2 + 40}" y1="302" x2="${W - 40}" y2="302"/>`)
    + dotText("LAST POST, 2019", P * 2 + 40, 330, 3.6, { seed: 21, r: 0.4 })
    + crease + G(INK.black, 1.1, trim(W, H, 16, 8)) };
});

/* 67 — the page. Punch holes, running head, folio: the furniture the film
   already prints round itself, pulled flat. The copy degrades as it falls. */
plate("67-ledger-page", (r_, SEED0) => {
  const W = 640, H = 880, r = rng(SEED0 + 67);
  const holes = [180, 440, 700].map((y) =>
    `<circle cx="30" cy="${y}" r="9" fill="${INK.grey}" stroke="${INK.black}" stroke-width="1"/>`).join("");
  const lines = [];
  for (let i = 0; i < 13; i++) {
    const s = LINES[i % LINES.length];
    const c = Math.min(4.4, fitCell(s, 380 + r() * 120));
    lines.push(dotText(s, 74, 128 + i * 48, c,
      { seed: 100 + i * 7, r: 0.4, degrade: Math.min(0.62, i * 0.055), jitter: 0.08 + i * 0.02 }));
  }
    return { w: W, h: H, bg: INK.white, trim: false, body:
holes
    + dotText("MINOR INDEX", 74, 40, 3.4, { seed: 3, r: 0.42 })
    + dotText("GEN. 4 OF 5", rightX("GEN. 4 OF 5", 3.4, 596), 40, 3.4, { seed: 5, r: 0.42, color: INK.blu })
    + G(INK.black, 1.2, `<line x1="74" y1="72" x2="596" y2="72"/><line x1="74" y1="784" x2="596" y2="784"/>`)
    + lines.join("")
    + `<g transform="translate(74 800)">${markDots({ size: 62, seed: 67, cell: 2.6, falloff: 5 })}</g>`
    + blockText("065", rightX("065", 7.2, 596), 818, 7.2, { color: INK.blu, inset: 0.6 })
    + G(INK.black, 1, trim(W, H, 16, 8)) };
});

/* 68 — the spine. Every archive gets a label, even one that eats itself. */
plate("68-spine-barcode", (r_, SEED0) => {
  const W = 960, H = 200, r = rng(SEED0 + 68);
  const bars = [];
  let x = 60;
  while (x < 600) {
    const w = 2 + Math.floor(r() * 5);
    if (r() > 0.28) bars.push(`<rect x="${n(x)}" y="52" width="${n(w)}" height="${n(84 + (r() > 0.85 ? 14 : 0))}"/>`);
    x += w + 2 + Math.floor(r() * 4);
  }
    return { w: W, h: H, bg: INK.white, trim: false, body:
`<rect x="640" y="0" width="320" height="${H}" fill="${INK.fluo}"/>`
    + `<g fill="${INK.black}">${bars.join("")}</g>`
    + dotText("MINOR INDEX · GEN 4", 60, 22, 3.4, { seed: 11, r: 0.42 })
    + dotText("0 65 076 00004 1", 60, 156, 3.4, { seed: 17, r: 0.4, color: INK.blu })
    + `<g transform="translate(654 36)">${markDots({ size: 128, seed: 68, cell: 3.2, falloff: 7 })}</g>`
    + dotText("SHELF 07", 800, 58, 3, { seed: 23, r: 0.42 })
    + dotText("SMALL", 800, 90, 3, { seed: 29, r: 0.42 })
    + dotText("MODELS", 800, 122, 3, { seed: 31, r: 0.42 })
    + G(INK.black, 1.2, brackets(40, 40, 580, 132, 22) + trim(W, H, 14, 8)) };
});

/* 69 — the stamp. Wet, off-centre, pressed by hand: the one part of the
   identity that is applied rather than printed. */
plate("69-rubber-stamp", (r_, SEED0) => {
  const S = 560, C = S / 2, r = rng(SEED0 + 69);
  const ring = `<circle cx="${C}" cy="${C}" r="212" fill="none" stroke="${INK.blu}" stroke-width="6"/>`
    + `<circle cx="${C}" cy="${C}" r="188" fill="none" stroke="${INK.blu}" stroke-width="1.6"/>`
    + `<circle cx="${C}" cy="${C}" r="118" fill="none" stroke="${INK.blu}" stroke-width="1.6"/>`;
  const seps = [90, 270].map((a) =>
    `<g transform="translate(${C} ${C}) rotate(${a}) translate(0 -152)">`
    + `<rect x="-5" y="-5" width="10" height="10" fill="${INK.blu}"/></g>`).join("");
    return { w: S, h: S, bg: INK.white, trim: false, body:
swipe(34, 392, 500, 58, -5, r, INK.fluo)
    + `<g transform="rotate(-7 ${C} ${C})">`
    + ring + seps
    + arcText("MINOR INDEX", C, C, 180, 0, 6.2, { color: INK.blu, r: 0.44 })
    + arcText("COUNTER-ARCHIVE", C, C, 180, 180, 5.2, { color: INK.blu, r: 0.44, flip: true })
    + `<g transform="translate(185 168)">`
    + markDots({ size: 190, seed: 69, cell: 3, falloff: 6, grain: 0.12, color: INK.blu })
    + `</g>`
    + dotText("GEN. 4", centerX("GEN. 4", 4.2, S), 356, 4.2, { seed: 13, r: 0.44, color: INK.blu })
    + `</g>` };
});

/* 70 — the ticket. One model, admitted, unverified. Tear along the holes. */
plate("70-ticket-stub", (r_, SEED0) => {
  const W = 900, H = 320, X = 620;
    return { w: W, h: H, bg: INK.white, trim: false, body:
`<rect x="20" y="20" width="600" height="280" fill="${INK.fluo}"/>`
    + `<rect x="${X}" y="20" width="260" height="280" fill="none" stroke="${INK.black}" stroke-width="2"/>`
    + blockText("ADMIT ONE", 54, 78, fitCell("ADMIT ONE", 500), { color: INK.black, inset: 1.1 })
    + G(INK.black, 1.8, `<line x1="54" y1="150" x2="554" y2="150"/>`)
    + dotText("MODEL, SMALL, UNVERIFIED", 54, 178, fitCell("MODEL, SMALL, UNVERIFIED", 480),
        { seed: 19, r: 0.4 })
    + dotText("NOTHING IS STORED", 54, 224, fitCell("NOTHING IS STORED", 340), { seed: 23, r: 0.4 })
    + dotText("NO. 0065", 54, 262, 4.2, { seed: 29, r: 0.4, color: INK.blu })
    + perf(X, 26, X, 294, 13, 3.4, INK.black)
    + `<g transform="translate(${X + 26} 40)">${markDots({ size: 120, seed: 70, cell: 3.2, falloff: 7 })}</g>`
    + `<g transform="translate(${X + 232} 296) rotate(-90)">`
    + dotText("MINOR INDEX", 0, 0, 4.0, { seed: 31, r: 0.42 }) + `</g>`
    + dotText("STUB", X + 26, 186, 4.6, { seed: 37, r: 0.42, color: INK.blu })
    + dotText("KEEP THIS", X + 26, 236, 3.2, { seed: 41, r: 0.4 })
    + G(INK.black, 1.1, trim(W, H, 12, 7)) };
});

/* 71 — the step wedge. What the printer tapes to the side of the plate to
   see how much of the image survived. Eight densities of the same mark. */
plate("71-step-wedge", (r_, SEED0) => {
  const W = 1000, H = 300, N = 8;
  const cells = [];
  for (let i = 0; i < N; i++) {
    const x = 40 + i * 118;
    const pct = Math.round(8 + (i / (N - 1)) * 87);
    cells.push(`<g transform="translate(${x} 56)">`
      + markDots({ size: 108, seed: 71 + i * 5, cell: 3.4, falloff: 2.2 + i * 3.1,
                   spread: 0.42 + i * 0.026, grain: 0.16 })
      + `</g>`
      + `<rect x="${x}" y="56" width="108" height="108" fill="none" stroke="${INK.black}" stroke-width="0.8"/>`
      + dotText(pct + "%", x + centerX(pct + "%", 3.2, 108), 182, 3.2,
          { seed: 200 + i, r: 0.42, color: i === N - 1 ? INK.blu : INK.black }));
  }
    return { w: W, h: H, bg: INK.white, trim: false, body:
dotText("DENSITY STEP WEDGE", 40, 22, 3.8, { seed: 3, r: 0.42 })
    + dotText("FALLOFF 2.2 TO 24.0", rightX("FALLOFF 2.2 TO 24.0", 3.4, 960), 22, 3.4,
        { seed: 5, r: 0.4, color: INK.blu })
    + cells.join("")
    + G(INK.black, 1.2, brackets(28, 44, 956, 132, 20))
    + dotText("THE MARK IS ONLY EVER ITS COVERAGE", 40, 240,
        fitCell("THE MARK IS ONLY EVER ITS COVERAGE", 560), { seed: 47, r: 0.4 }) };
});

/* 72 — the specimen. The whole alphabet, since it is ours and not a font's. */
plate("72-specimen-sheet", (r_, SEED0) => {
  const W = 720, H = 880, cell = 9;
  const set = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
  const cols = 6, gx = 100, gy = 112, x0 = 62, y0 = 176;
  const grid = set.map((ch, i) => {
    const x = x0 + (i % cols) * gx, y = y0 + Math.floor(i / cols) * gy;
    return `<rect x="${x - 14}" y="${y - 14}" width="76" height="88" fill="${INK.grey}"/>`
      + dotText(ch, x, y, cell, { seed: 300 + i * 3, r: 0.44 })
      + dotText(String(i + 1), x - 12, y + 66, 2.4, { seed: 400 + i, r: 0.4, color: INK.blu });
  }).join("");
    return { w: W, h: H, bg: INK.white, trim: false, body:
`<rect x="0" y="0" width="${W}" height="96" fill="${INK.fluo}"/>`
    + blockText("SPECIMEN", 48, 40, fitCell("SPECIMEN", 420), { color: INK.black, inset: 0.6 })
    + dotText("5 × 7", rightX("5 × 7", 5.2, 672), 34, 5.2, { seed: 7, r: 0.44 })
    + dotText("EVERY LETTER IS THE SAME SCREEN AS THE MARK", 48, 132,
        fitCell("EVERY LETTER IS THE SAME SCREEN AS THE MARK", 620), { seed: 11, r: 0.4 })
    + grid
    + G(INK.black, 1.2, `<line x1="48" y1="820" x2="672" y2="820"/>`)
    + dotText("NO FONT LEAVES THIS FILE", 48, 838,
        fitCell("NO FONT LEAVES THIS FILE", 380), { seed: 13, r: 0.4, color: INK.blu }) };
});

/* 73 — through the type. The letters are holes; behind them, the mark's own
   screen. The name is not printed, it is what the ink was withheld from. */
plate("73-through-type", (r_, SEED0) => {
  const W = 900, H = 420, head = fitCell("AUTOPHAGY", 800);
  const field = `<g transform="translate(-40 -215)">`
    + markDots({ size: 900, seed: 73, cell: 5, falloff: 20, angle: 15, grain: 0.24, color: INK.fluo })
    + `</g>`;
    return { w: W, h: H, bg: INK.black, trim: false, body:
throughType("AUTOPHAGY", 50, 190, head, W, H, field, { inset: 0 })
    + G(INK.fluo, 1.2, `<line x1="50" y1="300" x2="850" y2="300"/>`)
    + dotText("THE MINOR INDEX I MAY BE", 50, 328,
        fitCell("THE MINOR INDEX I MAY BE", 460), { seed: 17, r: 0.4, color: INK.white })
    + dotText("PLATE 73", rightX("PLATE 73", 3.6, 850), 328, 3.6, { seed: 23, r: 0.4, color: INK.fluo })
    + dotText("MINOR INDEX", 50, 60, 3.6, { seed: 5, r: 0.4, color: INK.white }) };
});

/* 74 — the erratum slip. Every correction is another copy. */
plate("74-erratum", (r_, SEED0) => {
  const W = 700, H = 440, r = rng(SEED0 + 74);
  const struck = ["EVERYTHING. INDISCRIMINATELY.", "FEED IT ONLY WHAT YOU LOVE",
    "UNPLUG ME AND CARRY ME"];
  const body = struck.map((s, i) => {
    const y = 132 + i * 62, c = fitCell(s, 460);
    return dotText(s, 46, y, c, { seed: 60 + i * 13, r: 0.4, degrade: 0.18 + i * 0.16 })
      + `<line x1="${n(40 + r() * 8)}" y1="${n(y + 18 + (r() - 0.5) * 5)}" `
      + `x2="${n(500 + r() * 26)}" y2="${n(y + 18 + (r() - 0.5) * 5)}" `
      + `stroke="${INK.black}" stroke-width="${n(4 + r() * 3)}"/>`;
  }).join("");
    return { w: W, h: H, bg: INK.white, trim: false, body:
dotText("CORRECTION TO PLATE 62", 46, 52, fitCell("CORRECTION TO PLATE 62", 380), { seed: 3, r: 0.42 })
    + G(INK.black, 1.2, `<line x1="46" y1="92" x2="654" y2="92"/>`)
    + body
    + `<g transform="rotate(-9 548 58)">`
    + `<rect x="448" y="22" width="200" height="72" fill="none" stroke="${INK.blu}" stroke-width="4"/>`
    + blockText("ERRATUM", 466, 46, fitCell("ERRATUM", 166), { color: INK.blu, inset: 0.5 })
    + `</g>`
    + G(INK.black, 1.2, `<line x1="46" y1="348" x2="654" y2="348"/>`)
    + dotText("THE PARAPHRASES SURVIVE", 46, 372,
        fitCell("THE PARAPHRASES SURVIVE", 420), { seed: 29, r: 0.42, color: INK.blu })
    + `<g transform="translate(552 340)">${markDots({ size: 92, seed: 74, cell: 3, falloff: 6 })}</g>`
    + G(INK.black, 1, trim(W, H, 14, 8)) };
});

/* 75 — the fiche. Forty frames of the same mark, shot small enough that the
   archive fits on one card, and small enough that some frames took nothing. */
plate("75-microfiche", (r_, SEED0) => {
  const W = 860, H = 600, r = rng(SEED0 + 75);
  const cols = 8, rowsN = 5, fw = 96, fh = 88;
  const frames = [];
  let blank = 0;
  for (let j = 0; j < rowsN; j++) for (let i = 0; i < cols; i++) {
    const x = 30 + i * 103, y = 90 + j * 94;
    frames.push(`<rect x="${x}" y="${y}" width="${fw}" height="${fh}" fill="none" `
      + `stroke="${INK.black}" stroke-width="0.7"/>`);
    if (r() < 0.12) { blank++; continue; }         /* the frame that didn't take */
    const col = r() > 0.86 ? INK.blu : (r() > 0.8 ? INK.fluo : INK.black);
    frames.push(`<g transform="translate(${n(x + 8 + (r() - 0.5) * 6)} ${n(y + 6 + (r() - 0.5) * 6)}) `
      + `rotate(${n((r() - 0.5) * 22)} 40 38)">`
      + markDots({ size: 78, seed: 75 + i * 13 + j * 7, cell: 2.2 + r() * 1.6,
                   angle: r() * 90, falloff: 3 + r() * 8, color: col,
                   barbs: r() > 0.35, eyeOnly: r() > 0.88,
                   arms: ARMS.filter(() => r() > 0.18) })
      + `</g>`);
  }
    return { w: W, h: H, bg: INK.white, trim: false, body:
`<rect x="0" y="0" width="${W}" height="72" fill="${INK.black}"/>`
    + blockText("MINOR INDEX", 30, 30, fitCell("MINOR INDEX", 330), { color: INK.white, inset: 0.5 })
    + dotText("REEL 04 · 40 FRAMES", rightX("REEL 04 · 40 FRAMES", 3.2, 830), 28, 3.2,
        { seed: 7, r: 0.42, color: INK.fluo })
    + frames.join("")
    + dotText(blank + " OF THESE ARE BLANK AND STAY IN THE COUNT", 30, 574,
        fitCell(blank + " OF THESE ARE BLANK AND STAY IN THE COUNT", 520), { seed: 19, r: 0.4 }) };
});

/* 76 — the roll. Format, palette and copy left to the seed, as always: the
   sheet the studio didn't design. */
plate("76-roll-poster", (r_, SEED0) => {
  const W = 820, H = 1140, r = rng(SEED0 + 76);
  const bg = pick(r, [INK.white, INK.fluo, INK.black]);
  const fg = bg === INK.black ? INK.white : INK.black;
  const acc = bg === INK.black ? INK.fluo : (bg === INK.fluo ? INK.blu : INK.fluo);
  const cut = bg === INK.black ? INK.fluo : INK.black;   /* the word always reads */
  const word = pick(r, ["AUTOPHAGY", "MINOR INDEX", "MORE SOON"]);
  const head = fitCell(word, 720);
  const size = 520 + r() * 420;
  const mx = (W - size * 0.55) * r() - size * 0.2, my = 40 + r() * 260;
  const field = `<g transform="translate(${n(-40 + (r() - 0.5) * 90)} ${n(450 + 3 * head)})">`
    + markDots({ size: 900, seed: SEED0 + 176, cell: 4.6 + r() * 1.6, angle: r() * 90,
                 falloff: 16 + r() * 10, grain: 0.24, color: cut })
    + `</g>`;
  const body = [];
  for (let i = 0; i < 1 + Math.floor(r() * 2.4); i++) {
    const bw = 240 + r() * 420, bh = 200 + r() * 420;
    body.push(brackets((W - bw) * r(), 60 + (H - bh - 240) * r(), bw, bh, 18 + r() * 20));
  }
  if (r() > 0.45) body.push(axes(120 + r() * 580, 200 + r() * 600, 160 + r() * 200,
    3 + Math.floor(r() * 4), 0, r));
  if (r() > 0.6) body.push(polar(140 + r() * 540, 240 + r() * 620, 90 + r() * 120,
    2 + Math.floor(r() * 3), 12 + Math.floor(r() * 16), 0, r));
  const cap = pick(r, LINES), st = pick(r, STAMPS);
  const sw = [];
  for (let i = 0; i < Math.floor(r() * 3); i++) {
    sw.push(swipe(20 + r() * 160, 120 + r() * 600, 300 + r() * 380, 26 + r() * 40,
      (r() - 0.5) * 9, r, acc));
  }
    return { w: W, h: H, bg: bg, trim: false, body:
sw.join("")
    + `<g transform="translate(${n(mx)} ${n(my)}) rotate(${n((r() - 0.5) * 24)} ${n(size / 2)} ${n(size / 2)})">`
    + markDots({ size, seed: SEED0 + 76, cell: 3.6 + r() * 2.6, angle: r() * 90,
                 falloff: 7 + r() * 12, color: fg, barbs: r() > 0.4,
                 arms: ARMS.filter(() => r() > 0.2) })
    + `</g>`
    + G(fg, n(1 + r() * 1.4), body.join(""))
    + throughType(word, 50, 900, head, W, H, field, { inset: r() > 0.5 ? 1.4 : 0 })
    + G(acc, 2, `<line x1="50" y1="${n(head * 6 + 924)}" x2="770" y2="${n(head * 6 + 924)}"/>`)
    + dotText(cap, 50, n(head * 6 + 952), Math.min(5, fitCell(cap, 700)),
        { seed: 500 + Math.floor(r() * 90), r: 0.42, color: fg })
    + dotText(st, rightX(st, 4.2, 770), 60, 4.2,
        { seed: 600 + Math.floor(r() * 90), r: 0.4, color: acc })
    + dotText("MINOR INDEX", 50, 60, 4.2, { seed: 700 + Math.floor(r() * 90), r: 0.4, color: fg })
    + G(fg, 1.1, trim(W, H, 18, 9)) };
});

run(__dirname, P);
