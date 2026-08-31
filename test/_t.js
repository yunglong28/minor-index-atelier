/* MINOR INDEX — the smallest test harness that says what broke.
 *
 * No dependencies, for the same reason there is no font library and no PNG
 * library: what this repository is made of should be in this repository.
 */
let file = "", pass = 0, fail = 0;
const fails = [];

const head = (name) => { file = name; process.stdout.write("\n" + name + "\n"); };
function ok(what, cond, detail) {
  if (cond) { pass++; process.stdout.write("  · " + what + "\n"); return true; }
  fail++; fails.push([file, what, detail || ""]);
  process.stdout.write("  ✗ " + what + (detail ? "\n      " + String(detail).replace(/\n/g, "\n      ") : "") + "\n");
  return false;
}
/* two strings that have to be the same file: say where they stop being one */
function same(what, a, b) {
  if (a === b) return ok(what, true);
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const cut = (s) => JSON.stringify(s.slice(Math.max(0, i - 50), i + 80));
  return ok(what, false, `differ at char ${i} of ${a.length} / ${b.length}\n`
    + `expected ${cut(a)}\n     got ${cut(b)}`);
}
const report = () => {
  process.stdout.write(`\n${pass} passed, ${fail} failed\n`);
  if (fail) {
    process.stdout.write("\n");
    for (const [f, w, d] of fails) process.stdout.write(`  ✗ ${f}: ${w}\n`);
  }
  return fail === 0;
};
const counts = () => ({ pass, fail });

module.exports = { head, ok, same, report, counts };
