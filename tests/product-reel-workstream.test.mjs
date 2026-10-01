import test from "node:test";
import assert from "node:assert/strict";
import { buildProductReelWorkstream, validateProductReelInput } from "../src/product-reel-workstream.mjs";

const input = {
  month: "November",
  productName: "November Morning Work",
  redirectUrl: "https://6pm-studio.com/go/november",
  productUrl: "https://www.teacherspayteachers.com/Product/november",
  primaryAudience: "elementary teachers and homeschool families",
  numberOfDays: 30,
  packageFeatures: ["daily word problems", "three levels", "historical mini-stories"],
  assets: {
    cover: "assets/november-product-cover.png",
    preview: "assets/november-preview.png",
    readingPassage: "assets/november-reading-passage.svg",
    level1: "assets/november-level1.svg",
    level2: "assets/november-level2.svg",
    level3: "assets/november-level3.svg"
  }
};

test("validates the reusable monthly Product Reel input contract", () => {
  const result = validateProductReelInput(input);
  assert.equal(result.valid, true);
  assert.deepEqual(result.normalized.month, "November");
  assert.equal(result.normalized.redirectUrl, input.redirectUrl);
});

test("builds exactly four deterministic Reel records with product evidence and CTA", () => {
  const first = buildProductReelWorkstream(input);
  const second = buildProductReelWorkstream(input);
  assert.equal(first.valid, true);
  assert.equal(first.records.length, 4);
  assert.deepEqual(first.records, second.records);
  for (const record of first.records) {
    assert.match(record.id, /^november-week-[1-4]$/);
    assert.equal(record.canvas, "1080x1920");
    assert.equal(record.fps, 30);
    assert.equal(record.durationSeconds, 10);
    assert.equal(record.audio, "silent-by-default");
    assert.ok(record.evidenceAssets.length >= 1);
    assert.equal(record.cta.redirectUrl, input.redirectUrl);
    assert.equal(record.qa.humanReviewRequired, true);
    assert.equal(record.qa.answerKeyExposed, false);
  }
});

test("blocks missing product evidence, redirect mismatch, and answer-key assets", () => {
  const result = buildProductReelWorkstream({
    ...input,
    redirectUrl: "https://example.com/other-month",
    assets: { ...input.assets, level2: "", answerKey: "assets/answer-key.pdf" }
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /redirectUrl/);
  assert.match(result.errors.join("\n"), /level2/);
  assert.match(result.errors.join("\n"), /answer-key/);
});
