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

test("requires an explicit owner waiver when the source gate is false", () => {
  const release = {
    manifestPath: "releases/october-v1.0.manifest.json",
    packageId: "october-morning-work-math",
    packageVersion: "v1.0",
    sourceCommit: "6adca38",
    releaseReady: false,
    stale: false,
    gates: { content: true, mathematics: true, source: false, layout: true, pdf: true, cover: true, derivedAssets: true },
    artifactChecksums: Object.fromEntries(["cover", "preview", "readingPassage", "level1", "level2", "level3"].map((key) => [key, "a".repeat(64)]))
  };
  const withoutWaiver = validateProductReelInput({ ...input, release });
  assert.equal(withoutWaiver.valid, false);
  assert.match(withoutWaiver.errors.join("\n"), /owner waiver/);

  const withWaiver = buildProductReelWorkstream({
    ...input,
    release: { ...release, sourceGateWaived: true, waiverReason: "Owner-approved October source-gate waiver for Product Reel manifest generation." }
  });
  assert.equal(withWaiver.valid, true, withWaiver.errors.join("\n"));
  assert.equal(withWaiver.sourceRelease.sourceGateWaived, true);
  assert.equal(withWaiver.sourceRelease.gates.source, false);
});

test("does not allow a stale or unreleased manifest to pass without the waiver", () => {
  const release = {
    manifestPath: "releases/october-v1.0.manifest.json",
    packageId: "october-morning-work-math",
    packageVersion: "v1.0",
    sourceCommit: "6adca38",
    releaseReady: false,
    stale: true,
    gates: { content: true, mathematics: true, source: true, layout: true, pdf: true, cover: true, derivedAssets: true },
    artifactChecksums: Object.fromEntries(["cover", "preview", "readingPassage", "level1", "level2", "level3"].map((key) => [key, "a".repeat(64)]))
  };
  const result = validateProductReelInput({ ...input, release });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /release-ready/);
  assert.match(result.errors.join("\n"), /non-stale/);
});

test("preserves a machine-readable paired Carousel workstream reference", () => {
  const result = buildProductReelWorkstream({
    ...input,
    pairedWorkstream: {
      type: "carousel",
      inputPath: "examples/october-carousel-workstream.input.json",
      generator: "scripts/generate-carousels.mjs",
      outputPath: "output/social/carousels/october-carousels/workstream.json"
    }
  });
  assert.equal(result.valid, true);
  assert.equal(result.pairedWorkstream.type, "carousel");
  assert.equal(result.pairedWorkstream.generator, "scripts/generate-carousels.mjs");
});
