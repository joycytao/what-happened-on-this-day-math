import assert from "node:assert/strict";
import test from "node:test";
import {
  NOVEMBER_FINAL_PAGE_COUNT,
  NOVEMBER_SOURCE_PAGE_COUNT,
  buildNovemberPageMappings,
  parseNovemberArguments,
  validateNovemberInputs,
} from "../src/november-orchestration.mjs";

function passingInputs(overrides = {}) {
  return {
    contentReport: { valid: true },
    mathematicsReport: { valid: true },
    sourceReport: { valid: true },
    worksheetManifest: { month: 11, pageCount: 120, pages: Array(120).fill({}) },
    answerKeyManifest: { month: 11, pageCount: 3, pages: Array(3).fill({}) },
    coverManifest: { month: "November", cover_pages: 1, checks: { reviewGate: "approved" } },
    coverReport: { approval: "approved" },
    coverVisualQa: { passed: true, artifacts: ["side-by-side.png", "overlay.png", "pixel-diff-heatmap.png"] },
    sourcePdfPageCount: NOVEMBER_SOURCE_PAGE_COUNT,
    finalPdfExists: false,
    ...overrides,
  };
}

test("November arguments require month 11 and the approved template version", () => {
  assert.deepEqual(parseNovemberArguments(["--month", "11", "--template-version", "1.0.0"]), { month: 11, templateVersion: "1.0.0" });
  assert.throws(() => parseNovemberArguments(["--month", "10"]), /requires --month 11/);
  assert.throws(() => parseNovemberArguments(["--month", "11", "--template-version", "9.0.0"]), /unsupported template version/);
});

test("approved November input produces the 123-to-125 page mapping", () => {
  const result = validateNovemberInputs(passingInputs());
  assert.equal(result.valid, true);
  assert.equal(result.sourcePageCount, NOVEMBER_SOURCE_PAGE_COUNT);
  assert.equal(result.finalPageCount, NOVEMBER_FINAL_PAGE_COUNT);
  assert.deepEqual(result.mappings, buildNovemberPageMappings());
  assert.deepEqual(result.mappings.dailyWorksheets, { sourcePages: [1, 120], finalPages: [2, 121] });
  assert.deepEqual(result.mappings.followUp, { sourcePages: [], finalPages: [125], asset: "references /worksheet-assets/follow-up-page-reference.png" });
  assert.equal(result.pageOneRole, "worksheet-coversheet");
});

test("draft or failed cover evidence blocks release and records the recovery loop", () => {
  const result = validateNovemberInputs(passingInputs({
    coverReport: { approval: "draft" },
    coverManifest: { month: "November", cover_pages: 1, checks: { reviewGate: "draft" } },
    coverVisualQa: { passed: false, artifacts: ["pixel-diff-heatmap.png"] },
  }));
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /approval gate is not approved/);
  assert.match(result.errors.join("\n"), /visual QA must pass/);
  assert.equal(result.failureLoop, "optimize prompt\/layout -> regenerate -> rerun complete QA");
});

test("rerunning with a final PDF present blocks duplicate cover insertion", () => {
  const result = validateNovemberInputs(passingInputs({ finalPdfExists: true }));
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /already exists/);
});
