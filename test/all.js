/* Everything, in the order that makes a failure legible: the format first,
 * then the plates, then the round trip, then the site.
 */
const T = require("./_t.js");
require("./lint.js");
require("./font.js");
require("./plates.js");
require("./press.js");
require("./raster.js");
require("./roundtrip.js");
require("./bundle.js");
require("./worker.js");
process.exit(T.report() ? 0 : 1);
