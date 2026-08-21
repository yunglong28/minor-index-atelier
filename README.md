# MINOR INDEX

The visual identity of **AUTOPHAGIE**, a film about a body that consumes itself.
It is not a logo with variations. It is a small machine that prints plates.

**→ [The atelier](https://yunglong28.github.io/minor-index-atelier/)** — make a plate
**→ [The typeface](https://yunglong28.github.io/minor-index-atelier/specimen.html)** — see it, try it, install it

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
floods until the forms grow together or is choked back until only a kernel is left.

**The type is made of the same material.** The letters are skeletons of lines and
arcs with a wobble in the hand. Because they are distance fields like everything
else, a word can be over-inked, knocked out, twisted or bitten exactly like a
body. And because a font has no pen — only filled outlines — each stroke is
turned into overlapping capsules and discs whose union is the letter, then
written into TrueType tables by hand. No font editor, no font library:
[Light](fonts/MinorIndex-Light.ttf) · [Regular](fonts/MinorIndex-Regular.ttf) ·
[Bold](fonts/MinorIndex-Bold.ttf), 64 glyphs, French accents included.

**The atelier is the same machine with a handle on it.** Twelve bodies, four
operations, one screen, and the page furniture a press leaves behind. What comes
out of its *Code* button is the JavaScript that rebuilds the plate on screen,
byte for byte, ready to paste into the next batch script. The tool is not a
preview of the work; it is the work with the lid off.

## This repository

`index.html` is the atelier as one self-contained file, and `specimen.html` is
the typeface. Both are generated from the modules of the AUTOPHAGIE identity
repository by `mkbundle.js` and `mkfont.js` — the page and the command line run
the same code, so a plate made here is a plate the batch scripts make.

Made with [Claude Code](https://claude.com/claude-code).
