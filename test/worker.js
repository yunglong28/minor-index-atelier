/* The press worker, run without a browser.
 *
 * A worker is a file, a `self` and two message queues. All three can be had
 * in node, so the wire between the page and the press is tested here rather
 * than trusted: the plate the worker hands back has to be the plate, the
 * strips have to arrive in an order a page can assemble, and the sheet the
 * page opens has to be the sheet.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const T = require("./_t.js");
const ROOT = path.join(__dirname, "..");
const ST = require(path.join(ROOT, "_studio.js"));

T.head("the press worker — the wire between the panel and the plate");

function boot() {
  const sent = [];
  const self = { postMessage: (m) => sent.push(m), onmessage: null };
  const ctx = vm.createContext({ self, Uint8Array, Math, Object, Array, JSON, String,
    Number, Date, RegExp, Error, console, isFinite, parseInt, parseFloat, Infinity });
  ctx.window = undefined;
  vm.runInContext(fs.readFileSync(path.join(ROOT, "docs", "_bundle.js"), "utf8"), ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "src", "press.worker.js"), "utf8"), ctx);
  return { self, sent, ctx };
}

const w = boot();
T.ok("the bundle installs the vocabulary on self", !!w.ctx.self.MINOR,
  "MINOR is " + typeof w.ctx.self.MINOR);
T.ok("the worker announces itself", w.sent.length === 1 && w.sent[0].type === "ready",
  JSON.stringify(w.sent[0]));

function pull(state, draft) {
  w.sent.length = 0;
  w.self.onmessage({ data: { type: "pull", id: 7, state: state, draft: !!draft,
    code: !draft, ink: ST.INK ? ST.INK[state.ink] : "#141410" } });
  const by = (t) => w.sent.filter((m) => m.type === t);
  return { all: w.sent.slice(), open: by("open")[0], bands: by("band"),
           close: by("close")[0], done: by("done")[0], fail: by("fail")[0] };
}

/* a plain plate: every dot on it belongs to the one pass being watched */
const plain = Object.assign({}, ST.DEFAULTS, { num: 500, name: "t" });
const r = pull(plain);
T.ok("a pull opens, prints and closes, in that order",
  r.all.map((m) => m.type).join(" ").replace(/(band )+/, "band… ") === "open band… close done",
  r.all.map((m) => m.type).join(" ").slice(0, 90));
T.ok("it prints in more than one strip (" + r.bands.length + ")", r.bands.length > 4);
T.ok("the sheet it opens ends with the group the strips go into",
  /<g fill="[^"]*">$/.test(r.open.head), JSON.stringify(r.open.head.slice(-40)));
T.ok("the sheet it opens starts a real svg", r.open.head.indexOf("<svg") === 0);
T.ok("what it closes with shuts that group and the sheet",
  r.close.tail.indexOf("</g>") === 0 && /<\/svg>\s*$/.test(r.close.tail));
T.same("the plate it hands back is the plate", ST.buildPlate(plain).svg, r.done.svg);
T.ok("and it says how big, how many and how long",
  r.done.w === 640 && r.done.h === 640 && r.done.dots > 1000 && r.done.ms >= 0,
  JSON.stringify({ w: r.done.w, dots: r.done.dots, kb: r.done.kb }));

/* the strips are compacted before they cross the wire: one path per strip,
   and between them exactly as many dots as the plate says it has */
const moves = r.bands.reduce((t, b) => t + (b.path.match(/M/g) || []).length, 0);
T.ok("every dot on the plate arrives in a strip (" + moves + ")", moves === r.done.dots,
  moves + " vs " + r.done.dots);
T.ok("a strip is one path, not a thousand circles",
  r.bands.every((b) => b.path.indexOf("<circle") < 0 && b.path.indexOf("<path") === 0));

/* the page rebuilds the sheet out of those three things */
const page = r.open.head.replace(/<g fill="([^"]*)">$/, '<g id="livedots" fill="$1">')
  + "</g></svg>";
T.ok("the sheet the page puts up is closed and complete",
  /<svg[^>]*>/.test(page) && /<\/svg>$/.test(page) && page.indexOf('id="livedots"') > 0);

/* a proof, pulled while dragging: no canonical file, no code */
const d = pull(Object.assign({}, plain, { pitch: 8 }), true);
T.ok("a proof carries no file to export and no code", d.done.svg === null && d.done.code === null);
const c = pull(plain);
T.ok("a finished pull carries the code that rebuilds it",
  typeof c.done.code === "string" && c.done.code.indexOf("plate(") >= 0);

/* a flat cut has no long pass — it arrives whole */
const f = pull(Object.assign({}, plain, { mode: "plein" }));
T.ok("a flat cut opens no stream and arrives whole",
  !f.open && f.bands.length === 0 && typeof f.done.whole === "string"
  && f.done.whole.indexOf("<svg") === 0);

/* an image that was never sent is a failure the page can explain */
const bad = pull(Object.assign({}, plain, { sym: "image" }));
T.ok("asking for an image nobody sent fails by name",
  bad.fail && bad.fail.message === "no image yet", bad.fail && bad.fail.message);

/* pixels cross once, then plates are pulled against them */
const px = new Uint8Array(8 * 8 * 4);
for (let i = 0; i < px.length; i += 4) { px[i] = px[i + 1] = px[i + 2] = (i / 4) % 256; px[i + 3] = 255; }
w.self.onmessage({ data: { type: "image", w: 8, h: 8, px: px.buffer } });
const im = pull(Object.assign({}, plain, { sym: "image" }));
T.ok("once the pixels are over, an image prints", !im.fail && im.done && im.done.dots > 0,
  im.fail ? im.fail.message : im.done && im.done.dots);

/* every message carries the pull it belongs to, which is the only way the
   page can tell a plate it still wants from one it has moved on from */
w.sent.length = 0;
w.self.onmessage({ data: { type: "pull", id: 5, state: plain, draft: false, code: false, ink: "#141410" } });
T.ok("every message carries its pull number",
  w.sent.length > 4 && w.sent.every((m) => m.id === 5), w.sent.length + " messages");

T.head("the pages — every control the script reaches for is on the page");

/* There is no browser here to open them in, so the two things that break a
   page silently are checked instead: a script that does not parse, and a
   script asking for an element that the markup does not have. */
for (const file of ["index.html", "specimen.html"]) {
  const src = fs.readFileSync(path.join(ROOT, "src", file), "utf8");
  const blocks = (src.match(/<script>([\s\S]*?)<\/script>/g) || [])
    .map((b) => b.replace(/^<script>/, "").replace(/<\/script>$/, ""));
  let bad = 0;
  for (const b of blocks) {
    try { new Function(b); } catch (e) { bad++; T.ok(file + " parses", false, e.message); }
  }
  if (!bad) T.ok(file + " parses (" + blocks.length + " block(s))", blocks.length > 0);

  const ids = new Set();
  src.replace(/\bid="([^"]+)"/g, (m, id) => { ids.add(id); return m; });
  const wanted = new Set();
  for (const b of blocks) {
    b.replace(/getElementById\((["'])([^"']+)\1\)/g, (m, q, id) => { wanted.add(id); return m; });
  }
  /* ids the script makes itself as it builds the panel */
  const made = ["livedots", "invite", "c_", "l_"];
  const missing = [...wanted].filter((id) => !ids.has(id) && !made.some((p) => id.startsWith(p)));
  T.ok(file + " asks for " + wanted.size + " elements and the markup has them all",
    missing.length === 0, "missing: " + missing.join(" "));
}

module.exports = T.counts;
if (require.main === module) process.exit(T.report() ? 0 : 1);
