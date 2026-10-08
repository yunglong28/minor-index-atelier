/* Frank's marks are read off his drawings by make/mkmarks.js. The fields in
 * lib/_marks.data.js are a build product, so they are checked rather than
 * trusted: the drawings in assets/frank/ must still make exactly this file.
 */
const fs = require("fs");
const path = require("path");
const T = require("./_t.js");
const ROOT = path.join(__dirname, "..");
const MK = require(path.join(ROOT, "make", "mkmarks.js"));
const K = require(path.join(ROOT, "lib", "_marks.js"));

T.head("the marks — Frank's drawings, as distance fields");

const want = MK.write(MK.build());
const have = fs.readFileSync(path.join(ROOT, "lib", "_marks.data.js"), "utf8");
T.ok("lib/_marks.data.js is what assets/frank/ makes", want === have, "run `node make/mkmarks.js`");

/* a field is negative inside, positive outside, and keeps growing past the grid */
for (const name of ["scrawl", "stroke", "figure"]) {
  const f = K.markSDF(name, 0, 0, 400), b = K.markBox(name, 0, 0, 400);
  let inside = 0;
  for (let y = b.y; y < b.y + b.h; y += 4) for (let x = b.x; x < b.x + b.w; x += 4) if (f(x, y) < 0) inside++;
  T.ok(name + " has ink inside its box", inside > 50, inside + " samples");
  T.ok(name + " is paper far away, and further is further",
    f(-300, -300) > 50 && f(-600, -600) > f(-300, -300));
}
/* the cuts are things done to a field, so they only ever take ink away */
const solid = K.markSDF("figure", 0, 0, 400), rim = K.markSDF("figure", 0, 0, 400, { cut: "contour", line: 10 });
let ok = true;
for (let y = 0; y < 400; y += 7) for (let x = 0; x < 400; x += 7) if (rim(x, y) < 0 && solid(x, y) >= 0) ok = false;
T.ok("a contour never prints where the solid figure would not", ok);

module.exports = T.counts;
if (require.main === module) process.exit(T.report() ? 0 : 1);
