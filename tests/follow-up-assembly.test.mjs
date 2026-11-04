import assert from "node:assert/strict";
import test from "node:test";
import { buildFollowUpAssemblyContract, validateFollowUpArtifact } from "../src/follow-up-assembly.mjs";

const passing = { valid: true, pageCount: 1, position: "after-answer-key", asset: "follow-up-page-reference.png" };
const qa = { passed: true, artifacts: ["side-by-side.png", "overlay.png", "pixel-diff-heatmap.png"] };

test("derives approved 30-day and 31-day final contracts", () => {
  assert.equal(buildFollowUpAssemblyContract(30, 124, 1).finalPageCount, 125);
  assert.deepEqual(buildFollowUpAssemblyContract(30, 124, 1).mappings.followUp.finalPages, [125]);
  assert.equal(buildFollowUpAssemblyContract(31, 127, 0).finalPageCount, 128);
  assert.deepEqual(buildFollowUpAssemblyContract(31, 127, 0).mappings.answerKeys.finalPages, [125, 127]);
});

test("requires exactly one follow-up after Answer Key and preserves source mappings", () => {
  const result = validateFollowUpArtifact({ artifact: passing, visualQa: qa, sourcePageCount: 124, dayCount: 30, coverPages: 1, finalExists: false });
  assert.equal(result.valid, true, result.errors.join("; "));
  assert.deepEqual(result.contract.mappings.answerKeys, { sourcePages: [122, 124], finalPages: [122, 124], order: ["level1", "level2", "level3"] });
  assert.equal(result.contract.finalPageRole, "follow-up");
});

test("blocks missing, invalid, misplaced, failed, or duplicate follow-up output", () => {
  const result = validateFollowUpArtifact({ artifact: { ...passing, position: "before-answer-key", pageCount: 2 }, visualQa: { passed: false, artifacts: [] }, sourcePageCount: 124, dayCount: 30, coverPages: 1, finalExists: true });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /already exists/);
  assert.match(result.errors.join("\n"), /exactly one page/);
  assert.match(result.errors.join("\n"), /after-answer-key/);
  assert.match(result.errors.join("\n"), /visual QA must pass/);
  assert.match(result.recoveryLoop, /optimize prompt\/layout/);
});

test("rejects wrong base counts and unsupported month lengths", () => {
  assert.throws(() => buildFollowUpAssemblyContract(30, 123, 0), /source packet must contain 124/);
  assert.throws(() => buildFollowUpAssemblyContract(28, 115, 0), /no approved packet page count/);
});
