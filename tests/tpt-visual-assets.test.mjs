import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PNG } from "pngjs";

const handoffPath = "output/tpt/november-morning-work-math/visual-assets/landing-page-handoff.json";

test("November TPT handoff contains five generated assets and a landing-page image", async () => {
  const handoff = JSON.parse(await readFile(handoffPath, "utf8"));
  assert.deepEqual(handoff.assets.map((asset) => asset.id), ["cover", "whats-included", "different-math", "daily-practice", "landing-page"]);
  assert.equal(handoff.sourcePdf.pageCount, 125);
  assert.equal(handoff.doodle.path, "references /worksheet-assets/november-turkey-doodle.png");
  assert.equal(handoff.landingPageImage.id, "landing-page");
  assert.equal(handoff.qa.deterministic, true);
  assert.equal(handoff.qa.dimensions, true);
  assert.equal(handoff.qa.status, "review");
  for (const asset of handoff.assets) {
    const image = PNG.sync.read(await readFile(asset.path));
    assert.deepEqual([image.width, image.height], [1260, 1260]);
  }
});
