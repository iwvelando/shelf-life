import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
await import("../public/wasm_exec.js");
const go = new globalThis.Go();
const { instance } = await WebAssembly.instantiate(
  readFileSync("public/engine.wasm"),
  go.importObject,
);
void go.run(instance);
const call = (request) =>
  JSON.parse(globalThis.shelfLife(JSON.stringify(request)));

// The build-time constants and the engine agree.
assert.deepEqual(
  call({ action: "constants" }),
  JSON.parse(readFileSync("web/generated/constants.json", "utf8")),
);

// A random page, then the same page asked for by its address.
const page = call({ action: "page" });
assert.equal(page.lines.length, 40);
assert.ok(page.lines.every((line) => line.length === 80));
assert.ok(page.location.hexagon.length > 4000);
assert.deepEqual(
  call({ action: "page", location: page.location }).lines,
  page.lines,
);

// A located text sits where it says, on the page its address holds.
const found = call({ action: "locate", text: "Wyatt Earp", mode: "noise" });
assert.equal(found.spelling.text, "uuiatt earp");
assert.equal(
  found.lines.join("").slice(found.offset, found.offset + found.length),
  "uuiatt earp",
);
assert.deepEqual(
  call({ action: "page", location: found.location }).lines,
  found.lines,
);

// Teaser lines are written in the Library's own alphabet and fit on a line.
for (const teaser of JSON.parse(readFileSync("web/teasers.json", "utf8"))) {
  const t = call({ action: "locate", text: teaser, mode: "line" });
  assert.equal(t.spelling.changes, null, `teaser needs respelling: ${teaser}`);
  assert.ok(teaser.length <= 80, `teaser longer than a line: ${teaser}`);
}

assert.equal(
  call({
    action: "reckon",
    effort: { searchersLog: 9, rateLog: 9, yearsLog: 2 },
  }).digitsRemoved,
  18,
);
assert.equal(call({ action: "fall", deaths: 1 }).galleriesText, "4,752,000");
assert.ok(call({ action: "search", examined: 0 }).error);
assert.ok(JSON.parse(globalThis.shelfLife("{")).error);
assert.ok(JSON.parse(globalThis.shelfLife()).error);
console.log("WASM bridge: pages, addresses, located text, and teasers passed.");
process.exit(0);
