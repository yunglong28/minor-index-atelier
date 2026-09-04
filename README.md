# MINOR INDEX

The visual identity of **AUTOPHAGIE**, a film about a body that consumes itself.
It is not a logo with variations. It is a small machine that prints plates.

**[The atelier](https://yunglong28.github.io/minor-index-atelier/)** — make a plate ·
**[The typeface](https://yunglong28.github.io/minor-index-atelier/specimen.html)** — see it, try it, install it

    npm test                               everything below, checked
    node mkautophagie.js                   print a batch
    node mkautophagie.js 5150              reroll it
    node mkautophagie.js --only 122,129    just these two
    open plates/index.html                 the contact sheet, all 124
    node mkfont.js                         the family: one variable file, three cut weights,
                                           three presses — screened, over-inked, knocked out
    node mkbundle.js                       rebuild docs/ — the whole site
    npm run build                          both of the last two

## What it is

Nothing here is drawn in an editor and nothing here contains a font. Every shape
is code: 124 numbered plates, each written by a generator script, each
reproducible byte for byte from its seed. If a plate is wrong you do not retouch
it — you change the number that made it and print it again. (The numbers run to
131; 13–19 were never printed.)

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
  them and stay that way. And what the press does to a word is a font too: the
  screen, the flood and the knock-out are three more files, not three filters.
  A word may also be given an ink of its own, and then it is honestly a plate of
  its own: it leaves the field and is pulled on a pass of its own, so the twist,
  the growth and the bites that take the body no longer take it.
* **Two plates, a marker and a stamp.** Toner at 15°, blu at 75°, fluo laid down
  as a swipe. Anything else is a fourth pass nobody paid for. The atelier now
  keeps a well beside the table, and a colour mixed in it prints and reproduces
  like any other — the emitted code names `INK.blu` where the table has it and
  writes the hex where it does not. It is still a fourth pass. It is simply one
  you can now decide to pay for.
* **`cell` is left exactly as it is.** Every plate cut from it since 23 has to
  keep reproducing byte for byte, so the field version (`cellSDF`, plate 122) is
  a second growth of the same organism rather than a refactor of the first.
* **Plates 01–40 keep their own palette.** Cream, oxide and toner were retired
  with the mark, but the plates printed in them are printed in them. Those three
  scripts are frozen, hexes and all.

## What a plate is made of

Ten batches were written by hand before it was clear that all of them only ever
do four things, in this order.

| | |
|---|---|
| **the body** | one of twelve: sun, corona, cell, network, seed head, lace, spiral, shell, rings, two bodies grown together, a field of small suns, or a plain disc. Geometry first, so the solid cut and the screened one are the same body. A thirteenth is not ours at all — an image, which skips the appetite because there is no field to bite, and goes straight to the press. And there is **none**: nothing is grown, and the plate is its ground, its furniture and its word — which is what a title card is. Where a word is set on one, the word is the field, so it can be twisted and bitten the way a body can. |
| **appetite** | what is done to it as a distance field: `sTwist` turn · `sGrow` spread and choke · `sWobble` tremble · `sMorph` one body arriving at another · `sSub` eclipse · `sBite` mouths taken at the contour. A flat cut has no field, so it takes only the twist — and the panel shows only that. |
| **the press** | `screen` — coverage becomes dot area on a rotated screen. Pitch, angle, dot, fringe, grain — and the grain can be kept off the empty sheet, so the dirt roughens the form without landing behind it. A second plate is the same field shifted (out of register) or let out (choke and spread), on either pass: a flat cut spreads by taking a pen of the second ink round its own edge, which is what `under` does. On a photograph there is a third: a **separation**, where the ink underneath carries the whole picture and the ink on top only the shadows — a duotone, and the black neither ink has alone. |
| **furniture** | what a press leaves that is not the image: trim marks, brackets, ticked axes, polar, a ring of ticks, a band at the foot, a marker swipe, registration crosses. |

## The repository

```
_mark.js        the ink table, the retired mark, the instrument, svg/G
_press.js       the copier: one rotated lattice, three things to put through it
_glyphs.js      the bodies, and everything that can be done to one
_letters.js     the drawn alphabet: skeletons, and the two ways to read them
_furniture.js   ticks, crosses, bands, mouths, the sheet — no disk, so both share it
_font.js        the alphabet as TrueType — cut, variable, and printed; tables by hand
_raster.js      a PNG decoded here rather than by a library, and read as light
_studio.js      the vocabulary declared once: PARAMS, buildPlate, emitPlate
_sheet.js       the CLI, the writer, the gallery — the parts that touch a disk
_type.js        the 5×7 dot alphabet — retired, kept because 53–76 used it
mk*.js          one generator per batch, plus mkbundle and mkfont
src/            the two pages and the press worker, hand-written
test/           what the paragraphs above are allowed to claim
plates/         the 124 printed plates and their contact sheet
docs/           the published site. Generated. Every file in it.
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

**A roll plate pins its seed.** A plate kept out of a pile of rolls carries the
pile it came from (`plate("88-rouleau", 820, 1140, draw, 88)`), so a bare run
prints it again rather than printing a different one. Passing a seed on the
command line still rerolls everything — that is what asking for a seed means.

## The atelier

A press console: the sheet on the left, the four moves on the right, the plate
redrawn as you pull anything. Dragging pulls a proof — a coarser screen at the
same everything else. Wheel to zoom, drag to pan, `0` to fit, ⌘Z to undo, `N` for
nine rolls to choose from.

**Every number is a number.** Each control has a field you can type into beside
the slider, its label is a dial you can drag sideways (shift for ten steps at a
time), and the arrow keys step it. A position is one control and not two: X and
Y together, six buttons that sit the thing against an edge or in the middle of
the sheet, and a box on the sheet itself — the body's and the word's — that can
be dragged to move it and taken by the corner to resize it. `Handles` turns
those boxes off. Every ink is the house table with a well beside it, and the
colour it mixes is written into the plate and into the code as a hex.

The panel opens on the choice that decides everything below it: **grow a body**,
or **use an image**. Drop one on the sheet — or paste it, or choose a file — and
it is screened by the same press: the pitch, the angle, the dot, the grain and
the second plate are the controls that were already there, and levels are added
under the body — floor, ceiling, curve, softness. Nothing is redrawn and nothing
is traced. The image is only ever asked how much ink it would hold, which is the
whole of `_raster.js` and the whole of plates 95–99. It is kept beside the plate
rather than inside it, because a photograph is not a setting.

**And it is asked in light.** An sRGB byte is not an amount of light: it is a
number a display raises to about 2.2, because eyes are not linear. Every dot on
a screened photograph is the average of a patch, and adding encoded bytes and
dividing gives something darker than the patch — most where the contrast inside
it is highest, which is to say at every edge in the picture. So the patch is
decoded to light, averaged there, weighted the way sRGB weights it
(0.2126/0.7152/0.0722, not broadcast luma), and comes back to the perceptual
scale only for the levels, which is the scale a hand adjusts on. The patch is
read off a summed-area table, so it is four lookups whatever the softness, and
the box sits where the dot actually fell rather than on the nearest whole pixel
— fine screens used to staircase along the image's own grid — and is clipped to
the picture rather than divided by pixels that were never there, which used to
cost an edge a third of its ink and a corner two thirds. The sums are integers,
because a plate has to reprint byte for byte and floating-point addition does
not care what order it is done in.

**The plate arrives the way a plate arrives.** The press runs in a worker, and
hands the sheet over in strips as the copier reaches them — so a coarse screen
on a large sheet never stops the panel answering, and a second of work reads as
printing rather than as a hang. The strips are only a matter of when: `buildPlate`
returns the same file whether or not anybody is watching it, and the tests say so.
If a worker cannot be started at all, the press runs on the page instead and the
plate simply appears whole.

What comes out of **Code** is a `plate(...)` block that can be pasted into the
next `mk*.js`, and it rebuilds the plate that was on screen **byte for byte**.
That is tested, not asserted: eighty-five plates — every body in both passes,
every appetite, both ways of setting a word, every second plate, fourteen ways of
printing a photograph, and two dozen rolls — are built both ways and compared.

## The typeface

**Minor Index** — 103 glyphs: caps, the same twenty-six and the accents cut
small, figures, the accents French needs, `&`, `?`, `Œ`. There is no lowercase
drawing and there is not going to be one — the film speaks in capitals — so a
lowercase letter is the capital cut small: 72% of the height, 7% wider than that
reduction, and 86% of the stem, because a capital merely photographed down
arrives thin and narrow beside the one it came from. The pen, the width and the slant were parameters of the plates long before
they were axes of a font, so the file that comes out is **variable**: `wght`
100–900, `wdth` 75–125, `slnt` −15–0, and seven named instances. The three cut
weights are the same three settings, for anywhere a variable font is not welcome.

The pen is not linear in `wght` — the three weights that were drawn sit at 0.075,
0.120 and 0.190 of the cap height, and 300 → 400 → 700 is not that shape. `gvar`
only interpolates straight lines, so the bend goes in `avar`, which is what avar
is for. Asked for 300 and for 700, the file gives the two weights that were
drawn, to under one unit in a thousand. That is measured, in `test/font.js`, by
interpolating the font with a reader written for the purpose — because a test
that only reads a table header is a test that a font is shaped like a font.

A font has no pen, only filled outlines, and the honest way to get an outline
wrong is to offset a stroke — on a tight curve the inner offset folds back and
eats a hole in the letter. So nothing is offset: every segment becomes a capsule
and every joint a disc, all wound the same way, and TrueType's non-zero fill
makes the pile of them into exactly the letter. A variable font needs one more
thing: every instance of a letter must have the same points in the same order, so
for the variable file no joint is ever dropped and every instance is wound the
way the default was.

## Working on it

* **`npm test` is the documentation that cannot go stale.** Six claims: the font
  tables read back the way a rasteriser reads them; every batch printing its
  committed plates; a streamed plate against a whole one; the arithmetic the
  image side of the press is built on; the emitted code against the plate it
  claims to rebuild; and `docs/` against what `mkbundle.js` writes.
  No dependencies — for the same reason there is no font library and no PNG
  library in here.
* **`docs/` is generated.** Edit `src/index.html`, `src/specimen.html` and
  `src/press.worker.js`, then `node mkbundle.js`. The ink table is written into
  the pages from `_mark.js` at build time, so a page cannot invent a palette.
  `mkbundle.js` also writes `docs/atelier.html` — one self-contained file, for
  the Claude artifact and for opening straight off the disk, which is why it
  carries the press worker inside it as text.
* **Keep `docs/.nojekyll`.** GitHub Pages runs Jekyll, Jekyll drops any path
  beginning with an underscore, and `_bundle.js` silently 404s — the pages still
  load, only the tester and the figures stop working. `mkbundle.js` writes it.
* **Preview with a real browser engine.** ImageMagick silently drops every stroke
  and every mask, so it lies about these files. Headless Chrome hangs on this
  machine; WebKit through QuickLook does not:
  `qlmanage -t -s 1400 -o /tmp/out plates/1*.svg`. It squares whatever it is
  given, so nest non-square plates in one square `<svg>` when framing matters.
* **A missing doctype is not cosmetic.** Without it browsers run quirks mode,
  where a `<table>` stops inheriting colour from its ancestors. That is how the
  specimen's metrics table came out white on white. There is a test for it now.
* **Anything that makes a plate faster has to leave the plate alone.** The copier
  skips asking a body about points that are certainly outside it, and it can hand
  the dots over in strips — and neither changes a single dot, because the round
  trip builds every plate twice, once with the shortcuts and once with the plain
  code the atelier emits, and compares the files.

Made with [Claude Code](https://claude.com/claude-code).
