import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(new URL("..", import.meta.url).pathname);

test("November Product Carousel output contains two four-slide variants", async () => {
  const base = path.join(root, "output", "social", "product-carousels", "november");
  for (const variant of ["evergreen", "campaign-aligned"]) {
    const dir = path.join(base, variant);
    const files = await fs.readdir(dir);
    assert.deepEqual(files.filter((file) => /^0[1-4]\.png$/.test(file)).sort(), ["01.png", "02.png", "03.png", "04.png"]);
    const manifest = JSON.parse(await fs.readFile(path.join(dir, "manifest.json"), "utf8"));
    assert.equal(manifest.schemaVersion, "product-carousel/v1");
    assert.equal(manifest.canvas, "1080x1350");
    assert.equal(manifest.slideCount, 4);
    assert.equal(manifest.readingPassageCount, 30);
    assert.equal(manifest.readingSampleCount, 6);
    assert.equal(manifest.sourceAssets.slide3.length, 6);
    assert.equal(manifest.qa.answerKeyExposed, false);
    assert.equal(manifest.qa.worksheetContentCropped, false);
  }
});
