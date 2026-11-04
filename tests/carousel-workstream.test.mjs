import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { buildProductReelWorkstream } from "../src/product-reel-workstream.mjs";
import { buildCarouselWorkstream, validateCarouselInput } from "../src/carousel-workstream.mjs";

const input = {
  month: "November", productName: "November Morning Work", redirectUrl: "https://6pm-studio.com/go/november",
  assets: { cover: "cover.png", preview: "preview.png", readingPassage: "reading.png", level1: "l1.png", level2: "l2.png", level3: "l3.png" },
  packageFeatures: ["daily word problems", "three levels", "historical mini-stories"]
};
const reels = buildProductReelWorkstream({ ...input, productUrl: "https://www.teacherspayteachers.com/Product/november", numberOfDays: 30 }).records;

test("builds four deterministic 5–8 slide Carousels paired to Product Reels", () => {
  const first = buildCarouselWorkstream({ ...input, productReels: reels });
  const second = buildCarouselWorkstream({ ...input, productReels: reels });
  assert.equal(first.valid, true);
  assert.equal(first.records.length, 4);
  assert.deepEqual(first.records, second.records);
  for (const record of first.records) {
    assert.ok(record.slideCount >= 5 && record.slideCount <= 8);
    assert.equal(record.cta.redirectUrl, input.redirectUrl);
    assert.equal(record.qa.hookMatch, true);
    assert.equal(record.qa.answerKeyExposed, false);
    assert.ok(record.slides.every((slide) => slide.visual.asset));
  }
});

test("rejects missing weekly Reel, CTA mismatch, and answer-key exposure", () => {
  const broken = reels.slice(0, 3).concat({ ...reels[3], cta: { ...reels[3].cta, redirectUrl: "https://example.com/other" }, qa: { ...reels[3].qa, answerKeyExposed: true } });
  const result = validateCarouselInput({ ...input, productReels: broken });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /CTA|answer key/);
});

test("example input and generator command are part of the reusable contract", () => {
  assert.ok(fs.existsSync("examples/carousel-workstream.example.json"));
  assert.match(fs.readFileSync("package.json", "utf8"), /social:carousels/);
});
