/* MINOR INDEX — the press, off the page's thread.
 *
 * A plate at the coarse end of the dial is tens of thousands of dots and a
 * second of arithmetic. Doing that where the panel lives means the panel
 * stops answering, so it is done here and handed back in strips as it
 * prints — which is also, plainly, what a press looks like.
 *
 * The vocabulary is the same file the page uses (`_bundle.js`), so nothing
 * about the plate depends on which side of the wire it was built on.
 *
 * There is no way to cancel a pull. A worker is one thread: while it is
 * building it cannot read its own inbox, so a message asking it to stop
 * could only arrive once it had already stopped. The page does the work
 * instead — it keeps one pull in the air and one waiting, drops everything
 * between them, and ignores anything that comes back for a pull it has
 * moved on from. Every plate carries the number it was asked for.
 */
/* eslint-env worker */
(function () {
  "use strict";
  var M = self.MINOR;

  function send(m, transfer) { self.postMessage(m, transfer || []); }

  self.onmessage = function (e) {
    var d = e.data;
    if (d.type === "image") {
      /* the pixels, once — a photograph is not a plate setting and does not
         travel with every pull */
      M.useImage(d.px ? { w: d.w, h: d.h, px: new Uint8Array(d.px) } : null);
      return;
    }
    if (d.type !== "pull") return;

    var id = d.id;
    var bands = 0, opened = false;
    var hooks = {
      open: function (head, w, h) {
        opened = true;
        send({ type: "open", id: id, head: head, w: w, h: h });
      },
      /* compacted here: a run of dots is one <path> by the time it lands, so
         the page never puts ninety thousand nodes in a document */
      band: function (chunk) {
        bands++;
        send({ type: "band", id: id, path: M.compactDots('<g fill="' + d.ink + '">' + chunk + "</g>") });
      },
      close: function (tail) { send({ type: "close", id: id, tail: tail }); },
    };
    try {
      var out = M.buildPlate(d.state, hooks);
      send({ type: "done", id: id, opened: opened, bands: bands,
             w: out.w, h: out.h, dots: out.dots, kb: out.kb, ms: out.ms,
             /* the canonical plate, for export — never for a proof */
             svg: d.draft ? null : out.svg,
             /* a flat cut has no long pass, so it arrives whole */
             whole: opened ? null : M.compactDots(out.svg),
             code: d.code ? M.emitPlate(d.state) : null });
    } catch (err) {
      send({ type: "fail", id: id, message: String((err && err.message) || err) });
    }
  };
  send({ type: "ready" });
})();
