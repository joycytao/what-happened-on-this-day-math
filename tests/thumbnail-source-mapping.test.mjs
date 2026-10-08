import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  resolveThumbnailSourcePages,
  validateThumbnailSourceMapping,
} from "../src/thumbnail-source-mapping.mjs";

const november = JSON.parse(await readFile("examples/november-thumbnail-manifest.json", "utf8"));

test("validates the November real-PDF source mapping", () => {
  assert.deepEqual(validateThumbnailSourceMapping(november), []);
  assert.deepEqual(resolveThumbnailSourcePages(november, "different_math"), {
    story: 2,
    level1: 3,
    level2: 4,
    level3: 5,
  });
});

test("reports a missing required source page through the manifest validator", () => {
  const broken = structuredClone(november);
  delete broken.templates.whats_included.source_pages.answer_key;
  assert.ok(validateThumbnailSourceMapping(broken).some((error) => /whats_included.*answer_key/.test(error)));
});

test("rejects a source page outside the PDF page count", () => {
  const broken = structuredClone(november);
  broken.templates.daily_practice.source_pages.worksheet = 126;
  assert.ok(validateThumbnailSourceMapping(broken).some((error) => /126.*125/.test(error)));
});
