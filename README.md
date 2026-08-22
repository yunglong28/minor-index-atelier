# MINOR INDEX

The visual identity of **AUTOPHAGIE**, a film about a body that consumes itself.
It is not a logo with variations. It is a small machine that prints plates.

**[The atelier](https://yunglong28.github.io/minor-index-atelier/)** — make a plate ·
**[The typeface](https://yunglong28.github.io/minor-index-atelier/specimen.html)** — see it, try it, install it

    node mkautophagie.js                   print a batch
    node mkautophagie.js 5150              reroll its seeded plates
    node mkautophagie.js --only 122,129    just these two
    open plates/index.html                 the contact sheet, all 131
    node mkfont.js                         three weights of the typeface
    node mkbundle.js --inline              rebuild the atelier and the site

Run a batch with `--only` unless you mean to rewrite all of it: the roll plates
are seeded, and a bare run resets one that was rolled on purpose.

## What it is

Nothing here is drawn in an editor and nothing here contains a font. Every shape
is code: 131 numbered plates, each written by a generator script, each
reproducible byte for byte from its seed. If a plate is wrong you do not retouch
it — you change the number that made it and print it again.

**A body is a distance field, not a shape.** Each form — the sun, the cell, the
seed head at 137.5°, the spiral — is a function that answers *how far outside am
I*. That one decision is what lets any form be cut into any other, lets the
halftone dots stop exactly at the join, and lets a word be eaten by the same
mouth that eats a sun. The press then does what a press does: coverage becomes
dot area on a screen at 15° for the toner and 75° for the blu, and the ink either
floods until the forms grow together or is choked back until only a kernel is
left.

## The rules this identity runs on

* **The eight-armed mark is retired.** Plates 01–12 and 65–76 keep it because
  they were printed with it; new work uses the **cell** (23–25) or the **sun**,
  and prints either the way 08 and 09 were printed — over-inked until the forms
  grow together, or knocked out of the toner.
* **Lettering is back, on one condition.** The 5×7 dot alphabet stays retired —
  it reads as a machine. The drawn alphabet is made of the same material as the
  bodies: a distance field, so a word goes through the press with everything else
  rather than sitting on top of it. Plates 77–131 were printed without a word on
  them and stay that way.
* **Two plates, a marker and a stamp.** Toner at 15°, blu at 75°, fluo laid down
  as a swipe. Anything else is a fourth pass nobody paid for.
* **`cell` is left exactly as it is.** Every plate cut from it since 23 has to
  keep reproducing byte for byte, so the field version (`cellSDF`, plate 122) is
  a second growth of the same organism rather than a refactor of the first.

## What a plate is made of

Ten batches were written by hand before it was clear that all of them only ever
do four things, in this order.

| | |
|---|---|
| **the body** | one of twelve: sun, corona, cell, network, seed head, lace, spiral, shell, rings, two bodies grown together, a field of small suns, or a plain disc. Geometry first, so the solid cut and the screened one are the same body. |
| **appetite** | what is done to it as a distance field: `sTwist` turn · `sGrow` spread and choke · `sWobble` tremble · `sMorph` one body arriving at another · `sSub` eclipse · `sBite` mouths taken at the contour |
| **the press** | `screen` — coverage becomes dot area on a rotated screen. Pitch, angle, dot, fringe, grain. A second plate is the same field shifted (out of register) or let out (choke and spread). |
| **furniture** | what a press leaves that is not the image: trim marks, brackets, ticked axes, polar, a ring of ticks, a band at the foot, a marker swipe, registration crosses. |

## The repository

```
_mark.js        the ink table, the retired mark, the instrument, svg/G
_glyphs.js      the bodies, and everything that can be done to one
_letters.js     the drawn alphabet: skeletons, and the two ways to read them
_font.js        the same letters as a TrueType binary, tables written by hand
_sheet.js       the sheet, the writer, the CLI, the gallery, shared furniture
_studio.js      the vocabulary declared once: PARAMS, buildPlate, emitPlate
_raster.js      a PNG decoded here rather than by a library, screened like the rest
_type.js        the 5×7 dot alphabet — retired, kept because 53–76 used it
mk*.js          one generator per batch, plus mkbundle and mkfont
plates/         the 131 printed plates and their contact sheet
docs/           the published site: the atelier, the specimen, the fonts
```

| batch | plates |
|---|---|
| `mklogo` `mkalt` `mkreticle` `mkwild` `mktype` | 01–12, 20–30, 31–40, 41–52, 53–64 |
| `mkposter` `mksol` `mkpoke` | 65–76, 77–94, 95–99 |
| `mkspiral` `mkautophagie` | 100–115, 116–131 |

Two generations of scaffolding are in here. Plates 01–64 come from scripts that
each write their own files; from 65 on a batch is a table of plates —
`{ name, w, h, draw(r, seed) }`, `draw` returning `{ bg, ink, body }` — and
`_sheet.js` does the rest. New work takes the second form.

## The atelier

A press console: the sheet on the left, the four moves on the right, the plate
redrawn as you pull anything. Dragging pulls a proof — a coarser screen at the
same everything else. Wheel to zoom, drag to pan, `0` to fit, ⌘Z to undo, `N` for
nine rolls to choose from.

What comes out of **Code** is a `plate(...)` block that can be pasted into the
next `mk*.js`, and it rebuilds the plate that was on screen **byte for byte**.
That is tested, not asserted: a round-trip check builds every body in both passes
plus a set of rolls, both ways, and compares the files.

## The typeface

**Minor Index** — 64 glyphs: caps, figures, the accents French needs, `&`, `?`,
`Œ`. Lowercase types the caps. Three weights, which are not three drawings: the
pen width was always a parameter of the plates, so Light, Regular and Bold are
the same skeleton with a different pen.

A font has no pen, only filled outlines, and the honest way to get an outline
wrong is to offset a stroke — on a tight curve the inner offset folds back and
eats a hole in the letter. So nothing is offset: every segment becomes a capsule
and every joint a disc, all wound the same way, and TrueType's non-zero fill
makes the pile of them into exactly the letter. `_font.js` writes the tables by
hand, and the same code runs in node and in the browser, byte for byte.

## Working on it

* **Preview with a real browser engine.** ImageMagick silently drops every stroke
  and every mask, so it lies about these files. Headless Chrome hangs on this
  machine; WebKit through QuickLook does not:
  `qlmanage -t -s 1400 -o /tmp/out plates/1*.svg`. It squares whatever it is
  given, so nest non-square plates in one square `<svg>` when framing matters.
* **The site serves `docs/` directly.** `docs/index.html` is the atelier itself,
  with `docs/_bundle.js` beside it — no build step to forget. `mkbundle.js
  --inline` additionally writes `docs/atelier.html`, one self-contained file for
  the Claude artifact, which wraps the page in a document of its own and so gets
  the copy without a doctype.
* **Keep `docs/.nojekyll`.** GitHub Pages runs Jekyll, Jekyll drops any path
  beginning with an underscore, and `_bundle.js` silently 404s — the pages still
  load, only the tester and the figures stop working.
* **A missing doctype is not cosmetic.** Without it browsers run quirks mode,
  where a `<table>` stops inheriting colour from its ancestors. That is how the
  specimen's metrics table came out white on white.

Made with [Claude Code](https://claude.com/claude-code).
