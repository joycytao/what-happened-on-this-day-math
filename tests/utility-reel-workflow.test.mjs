import test from "node:test";
import assert from "node:assert/strict";
import { buildUtilityReelCycle, validateUtilityReelIntake } from "../src/utility-reel-workflow.mjs";

const intake = {
  cycleId: "student-test-2026-10-01",
  sourceFile: "/private/input/completed-test.pdf",
  sourceSha256: "a".repeat(64),
  permissionConfirmed: true,
  privacyRedactionConfirmed: true,
  consentVersion: "2026-10-06",
  consentText: "I confirm that I have permission to submit this student work for internal processing. I confirm that the submission contains no unnecessary names, faces, or private information. The original file may be reviewed internally, retained for up to 90 days, and deleted afterward. Only the approved clean copy may be used for downstream rendering or release.",
  retentionDays: 90,
  redactionReport: "intake/redaction-report.json",
  sourcePageCount: 3,
  cleanReviewCopyPath: "output/utility/student-test-2026-10-01/clean-review-copy.pdf",
  highConfidenceCategories: ["computation", "word_problem"]
};

test("validates explicit permission, privacy, and original-preservation intake", () => {
  const result = validateUtilityReelIntake(intake);
  assert.equal(result.valid, true);
  assert.equal(result.normalized.sourceFile, intake.sourceFile);
  assert.equal(result.normalized.originalMustRemainUntouched, true);
});

test("requires the approved consent version and ninety-day retention", () => {
  const result = validateUtilityReelIntake({ ...intake, consentVersion: "old", retentionDays: 30 });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /consentVersion/);
  assert.match(result.errors.join("\n"), /retentionDays/);
});

test("builds Recover, Understand, and Practice records in order", () => {
  const first = buildUtilityReelCycle(intake);
  const second = buildUtilityReelCycle(intake);
  assert.equal(first.valid, true);
  assert.deepEqual(first, second);
  assert.deepEqual(first.records.map((record) => record.stage), ["Recover", "Understand", "Practice"]);
  assert.equal(first.records.length, 3);
  assert.equal(first.records[0].sourceAsset, intake.cleanReviewCopyPath);
  assert.deepEqual(first.records[1].categories, intake.highConfidenceCategories);
  assert.equal(first.records[2].answerKeyExposed, false);
  assert.equal(first.qa.humanReviewRequired, true);
});

test("blocks missing permission, unredacted source, uncertain categories, and source reuse", () => {
  const result = buildUtilityReelCycle({
    ...intake,
    permissionConfirmed: false,
    privacyRedactionConfirmed: false,
    highConfidenceCategories: ["uncertain", "computation"],
    sourceSha256: "not-a-sha",
    cleanReviewCopyPath: intake.sourceFile
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /permission/);
  assert.match(result.errors.join("\n"), /privacy/);
  assert.match(result.errors.join("\n"), /uncertain/);
  assert.match(result.errors.join("\n"), /original source/);
});
