import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFinalPacketContract,
  FOLLOW_UP_REFERENCE,
  validateFinalPacketManifest,
  verifyFollowUpReference,
} from "../src/final-follow-up-validation.mjs";

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
