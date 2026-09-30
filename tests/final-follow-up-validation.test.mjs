import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { PNG } from "pngjs";

import {
  buildFinalPacketContract,
  FOLLOW_UP_REFERENCE,
  validateFinalPacketManifest,
  verifyFollowUpReference,
} from "../src/final-follow-up-validation.mjs";
import { FOLLOW_UP_COPY_CONTRACT, validateFollowUpCopy, validateFollowUpVisual } from "../src/follow-up-visual-qa.mjs";

function pagesFor(dayCount, followUp = true) {
  const pages = [];
  pages.push({ role: "cover", asset: "monthly-cover" });
  for (let day = 1; day <= dayCount; day += 1) {
    for (const pageType of ["reading-passage", "level1", "level2", "level3"]) {
      pages.push({ role: "daily", day, pageType });
    }
  }
  for (const level of ["level1", "level2", "level3"]) pages.push({ role: "answer_key", level });
  if (followUp) pages.push({ role: "follow_up", asset: "follow-up-page-reference.png" });
  return pages;
}

test("adds exactly one final follow-up page to approved 30- and 31-day totals", () => {
  assert.deepEqual(buildFinalPacketContract(30), { dayCount: 30, basePages: 124, coverPages: 1, dailyPages: 120, answerKeyPages: 3, followUpPages: 1, totalPages: 125 });
  assert.deepEqual(buildFinalPacketContract(31), { dayCount: 31, basePages: 127, coverPages: 0, dailyPages: 124, answerKeyPages: 3, followUpPages: 1, totalPages: 128 });
});

test("accepts the follow-up page only after the complete Answer Key", () => {
  const result = validateFinalPacketManifest(pagesFor(30), 30);
  assert.equal(result.valid, true, result.errors.join("; "));
  assert.deepEqual(result.finalRoles, ["answer_key:level1", "answer_key:level2", "answer_key:level3", "follow_up"]);
});

test("rejects a missing, duplicated, or misplaced follow-up page", () => {
  assert.equal(validateFinalPacketManifest(pagesFor(30, false), 30).valid, false);
  const duplicate = pagesFor(30);
  duplicate.splice(duplicate.length - 1, 0, { role: "follow_up", asset: "follow-up-page-reference.png" });
  assert.equal(validateFinalPacketManifest(duplicate, 30).valid, false);
  const misplaced = pagesFor(30);
  misplaced.splice(120, 0, misplaced.pop());
  assert.equal(validateFinalPacketManifest(misplaced, 30).valid, false);
});

test("rejects unapproved February totals instead of inventing a contract", () => {
  assert.throws(() => buildFinalPacketContract(28), /no approved packet page count exists/);
});

test("pins the approved follow-up visual reference by checksum", async () => {
  const result = await verifyFollowUpReference(FOLLOW_UP_REFERENCE.asset);
  assert.equal(result.valid, true, `reference checksum changed: ${result.actualSha256}`);
});

test("visual QA emits side-by-side, overlay, heatmap, and passing metrics for the canonical asset", async () => {
  const outputDir = await mkdtemp(join("/private/tmp", "follow-up-visual-qa-"));
  try {
    const report = await validateFollowUpVisual({
      referencePath: FOLLOW_UP_REFERENCE.asset,
      candidatePath: FOLLOW_UP_REFERENCE.asset,
      outputDir,
      copy: FOLLOW_UP_COPY_CONTRACT,
    });
    assert.equal(report.passed, true, report.recoveryLoop);
    assert.equal(report.fixedRegionSimilarity, 1);
    assert.deepEqual(report.artifacts, ["side-by-side.png", "overlay.png", "pixel-diff-heatmap.png"]);
    for (const artifact of report.artifacts) assert.ok((await readFile(join(outputDir, artifact))).length > 100);
  } finally { await rm(outputDir, { recursive: true, force: true }); }
});

test("visual QA fails on a materially changed region and records the recovery loop", async () => {
  const outputDir = await mkdtemp(join("/private/tmp", "follow-up-visual-fail-qa-"));
  const candidatePath = join(outputDir, "candidate.png");
  try {
    const image = PNG.sync.read(await readFile(FOLLOW_UP_REFERENCE.asset));
    for (let y = 430; y < 690; y += 1) for (let x = 57; x < 967; x += 1) {
      const i = (y * image.width + x) * 4;
      image.data[i] = 255; image.data[i + 1] = 0; image.data[i + 2] = 0;
    }
    await writeFile(candidatePath, PNG.sync.write(image));
    const report = await validateFollowUpVisual({ referencePath: FOLLOW_UP_REFERENCE.asset, candidatePath, outputDir: join(outputDir, "report"), copy: FOLLOW_UP_COPY_CONTRACT });
    assert.equal(report.passed, false);
    assert.match(report.recoveryLoop, /optimize prompt\/layout/);
  } finally { await rm(outputDir, { recursive: true, force: true }); }
});

test("copy validation rejects unapproved follow-up text", () => {
  const result = validateFollowUpCopy({ ...FOLLOW_UP_COPY_CONTRACT, subtitle: "New resources" });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("; "), /subtitle copy/);
});
