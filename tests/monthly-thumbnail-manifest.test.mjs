import assert from "node:assert/strict";
import test from "node:test";

import {
  loadMonthlyThumbnailManifest,
  validateMonthlyThumbnailManifest,
} from "../src/monthly-thumbnail-manifest.mjs";

const validManifest = {
  schema_version: "1.0.0",
  product: { id: "what-happened-on-this-day-math", month: "october", version: "v1.0" },
  pdf: {
    path: "output/pdf/october-worksheet-packet.pdf",
    sha256: "fe9d271700296c85cfb8b34bc08e54c4b808db2d4097d0d8db427ce05f0c3c20",
    page_count: 127,
  },
  doodle: { path: "assets/doodles/months/october.svg" },
  templates: {
    cover: { output: "output/thumbnails/october-v1.0-cover.png" },
    overview: { output: "output/thumbnails/october-v1.0-overview.png" },
    whats_included: {
      output: "output/thumbnails/october-v1.0-whats-included.png",
      source_pages: { story: 1, level1: 2, level2: 3, level3: 4, answer_key: 125 },
    },
    different_math: {
      output: "output/thumbnails/october-v1.0-different-math.png",
      source_pages: { level1: 2, level2: 3, level3: 4 },
    },
    daily_practice: {
      output: "output/thumbnails/october-v1.0-daily-practice.png",
      source_pages: { worksheet: 2 },
    },
  },
};

test("validates an October-shaped monthly thumbnail manifest", () => {
  const result = validateMonthlyThumbnailManifest(validManifest);

  assert.deepEqual(result, { valid: true, errors: [] });
});

test("reports the template and page when a source-page mapping is missing", () => {
  const broken = structuredClone(validManifest);
  delete broken.templates.whats_included.source_pages.answer_key;

  const result = validateMonthlyThumbnailManifest(broken);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /whats_included.*answer_key/i.test(error)));
});

test("rejects a source page outside the declared PDF page count", () => {
  const broken = structuredClone(validManifest);
  broken.templates.daily_practice.source_pages.worksheet = 128;

  const result = validateMonthlyThumbnailManifest(broken);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /daily_practice.*128.*127/i.test(error)));
});

test("loads a JSON manifest from disk", async () => {
  const loaded = await loadMonthlyThumbnailManifest("examples/monthly-thumbnail.example.json");

  assert.equal(loaded.product.month, "october");
  assert.equal(loaded.pdf.page_count, 127);
});
