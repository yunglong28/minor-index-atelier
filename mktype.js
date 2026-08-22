/* MINOR INDEX — variations with no font in them at all.
 * Every letter is drawn from the 5×7 field in _type.js: the same dots as the
 * mark, or the same blocks as the compression plates. Nothing is left to
 * whatever machine opens the file.
 *
 *   node logo/mktype.js            node logo/mktype.js 5150   (reroll)
 */
const fs = require("fs");
const path = require("path");
const M = require("./_mark.js");
const T = require("./_type.js");
const { INK, ARMS, n, rng, pick, markDots, axes, brackets, polar, trim, swipe, svg, G, L } = M;
const { dotText, blockText, textWidth, fitCell, centerX, rightX } = T;

const OUT = require("./_sheet.js").PLATES(__dirname);   /* plates/ */
const SEED0 = parseInt(process.argv[2] || "6104", 10);
const write = (name, c) => {
  fs.writeFileSync(path.join(OUT, name), c);
  console.log(name + "  " + (c.length / 1024).toFixed(0) + "kb");
};
const STAMPS = ["PLATE 07 / 13", "COPY #3 OF ITSELF", "SCREEN 15°", "4096 PAGES",
  "NOT TO SCALE", "GEN. 4", "0.28 RAD", "MINOR-INDEX"];
const LINES = ["THE RARE THINGS GO FIRST", "FEED IT ONLY WHAT YOU LOVE",
  "EVERYTHING. INDISCRIMINATELY.", "THE PARAPHRASES SURVIVE", "MORE SOON",
  "UNPLUG ME AND CARRY ME", "TRANSLATION PENDING"];

/* 53 — the wordmark, in the screen. Same dots as the mark, same angle. */
write("53-dot-wordmark.svg", (() => {
  const W = 760, sub = "A COUNTER-ARCHIVE OF SMALL MODELS";
  const cell = fitCell("MINOR INDEX", 600), sc = fitCell(sub, 520);
  return svg(W, 250,
    dotText("MINOR INDEX", centerX("MINOR INDEX", cell, W), 86, cell, { seed: 11 })
    + dotText(sub, centerX(sub, sc, W), 178, sc, { seed: 23, r: 0.4 })
    + G(INK.black, 1.4, `<line x1="120" y1="152" x2="640" y2="152"/>`),
    INK.white);
})());

/* 54 — the same, on the marker */
write("54-dot-wordmark-fluo.svg", (() => {
  const W = 760, sub = "SMALL LANGUAGE MODELS";
  const cell = fitCell("MINOR INDEX", 600), sc = fitCell(sub, 420);
  return svg(W, 250,
    dotText("MINOR INDEX", centerX("MINOR INDEX", cell, W), 86, cell, { seed: 11 })
    + dotText(sub, centerX(sub, sc, W), 178, sc, { seed: 5, r: 0.4, color: INK.blu })
    + G(INK.black, 1.4, `<line x1="120" y1="152" x2="640" y2="152"/>` + trim(W, 250, 16, 8)),
    INK.fluo);
})());

/* 55 — block cut, white on toner: the headline version */
write("55-block-wordmark-night.svg", (() => {
  const W = 760, sub = "GEN. 4 OF 5";
  const cell = fitCell("MINOR INDEX", 600), sc = fitCell(sub, 220);
  return svg(W, 300,
    blockText("MINOR INDEX", centerX("MINOR INDEX", cell, W), 118, cell, { color: INK.white, inset: 0.9 })
    + blockText(sub, centerX(sub, sc, W), 212, sc, { color: INK.fluo, inset: 0.5 })
    + G(INK.fluo, 1.6, brackets(40, 44, 680, 212, 26)),
    INK.black);
})());

/* 56 — stacked lockup: mark over wordmark, one rule, nothing else */
write("56-lockup-dot-stacked.svg", (() => {
  const W = 520, sub = "THE MINOR INDEX I MAY BE";
  const cell = fitCell("MINOR INDEX", 380), sc = fitCell(sub, 340);
  return svg(W, 560,
    `<g transform="translate(140 56)">${markDots({ size: 240, seed: 31, cell: 4.2, falloff: 9 })}</g>`
    + dotText("MINOR INDEX", centerX("MINOR INDEX", cell, W), 378, cell, { seed: 7 })
    + G(INK.black, 1.4, `<line x1="80" y1="432" x2="440" y2="432"/>`)
    + dotText(sub, centerX(sub, sc, W), 466, sc, { seed: 13, r: 0.4 }),
    INK.white);
})());

/* 57 — the instrument, labelled in its own alphabet */
write("57-reticle-dot-labels.svg", (() => {
  const r = rng(SEED0 + 3);
  const body = axes(320, 320, 250, 4, 0, r)
    + `<ellipse cx="320" cy="320" rx="200" ry="132" fill="none"/>`
    + brackets(70, 90, 500, 460, 30) + trim(640, 640, 20, 9);
  return svg(640, 640,
    `<g transform="translate(200 200)">${markDots({ size: 240, seed: 47, cell: 4.2, falloff: 9 })}</g>`
    + G(INK.black, 1.3, body)
    + dotText("SMALL LANGUAGE MODELS", 74, 56, fitCell("SMALL LANGUAGE MODELS", 420), { seed: 3, r: 0.42 })
    + dotText("SPECIMEN 04", 74, 596, 3.6, { seed: 9, r: 0.42 })
    + dotText("SCREEN 15°", rightX("SCREEN 15°", 3.6, 566), 596, 3.6, { seed: 21, r: 0.42, color: INK.blu }),
    INK.white);
})());

/* 58 — spec sheet, block headline, dot table */
write("58-datasheet-dot.svg", (() => {
  const rows = [
    ["SCREEN", "15 / 75 DEG"], ["CELL", "4.40 PX"], ["ARMS", "8 TO 2"],
    ["FALLOFF", "9.0"], ["GENERATION", "4 OF 5"],
  ];
  /* two columns, each string fitted to its own column width */
  const table = rows.map((rw, i) => {
    const y = 430 + i * 44;
    const lc = Math.min(4.2, fitCell(rw[0], 240));
    const vc = Math.min(4.2, fitCell(rw[1], 240));
    return dotText(rw[0], 46, y, lc, { seed: 30 + i, r: 0.42 })
      + dotText(rw[1], 330, y, vc, { seed: 60 + i, r: 0.42, color: INK.blu })
      /* the rule clears the descender row, it does not cut the type */
      + `<line x1="46" y1="${y + 36}" x2="594" y2="${y + 36}" stroke="${INK.black}" stroke-width="0.8"/>`;
  }).join("");
  return svg(640, 680,
    `<rect x="0" y="0" width="640" height="92" fill="${INK.fluo}"/>`
    + blockText("MINOR INDEX", 46, 40, fitCell("MINOR INDEX", 460), { color: INK.black, inset: 0.5 })
    + `<g transform="translate(330 120)">${markDots({ size: 200, seed: 29, cell: 4.0, falloff: 8 })}</g>`
    + G(INK.black, 1.3, axes(160, 220, 110, 4, 0, rng(9)) + brackets(46, 120, 548, 210, 24))
    + table,
    INK.white);
})());

/* 59 — the strip: a banner that can run along a card or a screen edge */
write("59-strip.svg", (() => {
  const s = "MINOR INDEX · COUNTER-ARCHIVE · COUNTER-GENERATION · ";
  /* the cell is chosen so one repeat is exactly the sheet: the strip tiles */
  const W = 1200, cell = W / (s.length * 6);
  return svg(W, 92,
    dotText(s, 0, 34, cell, { seed: 3, r: 0.42 })
    + G(INK.black, 1.2, `<line x1="0" y1="8" x2="${W}" y2="8"/><line x1="0" y1="84" x2="${W}" y2="84"/>`),
    INK.fluo);
})());

/* 60 — AUTOPHAGY, the film's own plate */
write("60-autophagy-dot.svg", (() => {
  const sub = "THE MINOR INDEX I MAY BE";
  const cell = fitCell("AUTOPHAGY", 450), sc = fitCell(sub, 450);
  return svg(760, 290,
    `<g transform="translate(26 42)">${markDots({ size: 200, seed: 19, cell: 4.0, falloff: 8 })}</g>`
    + dotText("AUTOPHAGY", 258, 96, cell, { seed: 17 })
    + G(INK.black, 1.5, `<line x1="258" y1="178" x2="708" y2="178"/>`)
    + dotText(sub, 258, 208, sc, { seed: 29, r: 0.4 }),
    INK.white);
})());

/* 61 — the coupon. Dashed to be torn, printed to be posted. */
write("61-coupon.svg", (() => {
  const cell = 6.4;
  return svg(660, 300,
    `<rect x="18" y="18" width="624" height="264" fill="${INK.fluo}"/>`
    + `<rect x="18" y="18" width="624" height="264" fill="none" stroke="${INK.black}" stroke-width="2.4" stroke-dasharray="9 7"/>`
    + dotText("FEED THE MODEL", 46, 62, cell, { seed: 41 })
    + dotText("ONE WORD PER COUPON", 46, 138, fitCell("ONE WORD PER COUPON", 380), { seed: 43, r: 0.4 })
    + dotText("NOTHING IS STORED", 46, 172, fitCell("NOTHING IS STORED", 340), { seed: 47, r: 0.4 })
    + G(INK.black, 1.6, `<line x1="46" y1="230" x2="430" y2="230"/>`)
    + dotText("YOUR WORD", 46, 252, 4.2, { seed: 53, r: 0.4, color: INK.blu })
    + `<g transform="translate(478 108)">${markDots({ size: 140, seed: 61, cell: 3.4, falloff: 7 })}</g>`,
    INK.white);
})());

/* 62 — the wordmark, copied five times. The type takes the generation loss
   the same way the mark does. */
write("62-dot-cascade.svg", (() => {
  const cell = fitCell("MINOR INDEX", 470);
  const lines = [];
  for (let i = 0; i < 5; i++) {
    const y = 70 + i * 96;
    lines.push(dotText("MINOR INDEX", 46, y, cell, {
      seed: 11 + i * 37, degrade: i * 0.22, jitter: 0.08 + i * 0.05,
    }));
    const lab = "COPY #" + (i + 1);
    lines.push(dotText(lab, rightX(lab, 4.0, 714), y, 4.0, { seed: 99 + i, r: 0.4, color: INK.blu }));
  }
  return svg(760, 560, lines.join(""), INK.white);
})());

/* 63 — the field, captioned in its own dots */
write("63-tick-field-dot.svg", (() => {
  const r = rng(SEED0 + 17);
  const out = [];
  const cx = 330, cy = 300;
  for (let x = 20; x < 640; x += 17) for (let y = 20; y < 600; y += 17) {
    const d = Math.hypot(x - cx, y - cy);
    const p = Math.max(0, 1 - d / 300);
    if (r() > 0.25 + p * 0.7) continue;
    const len = 3 + p * 11 + r() * 3;
    out.push(r() > 0.5
      ? `<line x1="${n(x)}" y1="${n(y - len)}" x2="${n(x)}" y2="${n(y + len)}"/>`
      : `<line x1="${n(x - len)}" y1="${n(y)}" x2="${n(x + len)}" y2="${n(y)}"/>`);
  }
  return svg(640, 640,
    G(INK.black, 1.1, out.join(""))
    + `<g transform="translate(230 200)">${markDots({ size: 200, seed: 61, cell: 3.6, falloff: 9, color: INK.fluo, eyeOnly: true })}</g>`
    + G(INK.blu, 1.6, `<ellipse cx="${cx}" cy="${cy}" rx="118" ry="76" fill="none"/>`)
    + dotText("WHAT IS LEFT OF THE MEASURING", 40, 600,
        fitCell("WHAT IS LEFT OF THE MEASURING", 560), { seed: 71, r: 0.42 }),
    INK.white);
})());

/* 64 — a roll: palette, composition and captions all left to the seed */
write("64-roll-dot.svg", (() => {
  const r = rng(SEED0 + 29);
  const bg = pick(r, [INK.white, INK.fluo, INK.black]);
  const fg = bg === INK.black ? INK.fluo : INK.black;
  const mk = bg === INK.black ? INK.white : INK.black;
  const acc = bg === INK.black ? INK.white : (bg === INK.fluo ? INK.blu : INK.fluo);
  const size = 190 + r() * 190;
  const mx = (640 - size) * r(), my = (640 - size) * r();
  const body = [axes(mx + size * r(), my + size * r(), 150 + r() * 160, 3 + Math.floor(r() * 4), 0, r)];
  for (let i = 0; i < 1 + Math.floor(r() * 2.4); i++) {
    const fw = 200 + r() * 320, fh = 180 + r() * 300;
    const fx = (640 - fw) * r(), fy = (640 - fh) * r();
    body.push(`<rect x="${n(fx)}" y="${n(fy)}" width="${n(fw)}" height="${n(fh)}"/>`);
    body.push(brackets(fx - 14, fy - 14, fw + 28, fh + 28, 16 + r() * 18));
  }
  if (r() > 0.5) body.push(polar(160 + 320 * r(), 160 + 320 * r(), 80 + r() * 110, 2 + Math.floor(r() * 3), 12 + Math.floor(r() * 18), 0, r));
  const swipes = [];
  for (let i = 0; i < Math.floor(r() * 3); i++) {
    swipes.push(swipe(20 + r() * 180, 80 + r() * 440, 240 + r() * 300, 24 + r() * 38, (r() - 0.5) * 8, r, acc));
  }
  const cap = pick(r, LINES), st = pick(r, STAMPS);
  return svg(640, 640,
    swipes.join("")
    + `<g transform="translate(${n(mx)} ${n(my)}) rotate(${n((r() - 0.5) * 28)} ${n(size / 2)} ${n(size / 2)})">`
    + markDots({ size, seed: SEED0 + 11, cell: 3.2 + r() * 2.4, angle: r() * 90,
                 falloff: 6 + r() * 11, color: mk, barbs: r() > 0.4,
                 arms: ARMS.filter(() => r() > 0.2) })
    + `</g>`
    + G(fg, n(1 + r() * 1.2), body.join(""))
    + dotText(cap, 34, 44 + r() * 500, Math.min(5, fitCell(cap, 560)),
        { seed: 200 + Math.floor(r() * 90), r: 0.42, color: fg })
    + dotText(st, rightX(st, 4.2, 606), 606, 4.2,
        { seed: 300 + Math.floor(r() * 90), r: 0.4, color: acc }),
    bg);
})());

console.log("→ " + OUT + "   (reroll: node logo/mktype.js 5150)");
