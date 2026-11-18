import assert from "node:assert/strict";
import test from "node:test";

import { classifyHumanReview } from "../src/human-review-policy.mjs";

test("routine work has no human decision gate", () => {
  assert.deepEqual(classifyHumanReview(), {
    reviewGate: "routine",
    humanDecisionRequired: false,
    humanActionRequired: false,
    reason: "routine work proceeds from deterministic validation and QA without content review",
  });
});

test("only explicit adoption, copy, product, security, or dispatch gates require a human decision", () => {
  for (const reviewGate of ["ui-design", "final-copy", "final-product", "credentials", "public-dispatch"]) {
    assert.equal(classifyHumanReview({ reviewGate }).humanDecisionRequired, true);
  }
});

test("final merge is an operational human action, not a content review", () => {
  assert.deepEqual(classifyHumanReview({ reviewGate: "final-merge" }), {
    reviewGate: "final-merge",
    humanDecisionRequired: false,
    humanActionRequired: true,
    reason: "explicit final-merge action required",
  });
});

test("unknown review gates fail closed", () => {
  assert.throws(() => classifyHumanReview({ reviewGate: "ordinary-code-review" }), /unsupported review gate/);
});
