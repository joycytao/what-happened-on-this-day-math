import assert from "node:assert/strict";
import test from "node:test";

import { findReleaseApproval, parseReleaseIdentity } from "../src/monthly-release-approval.mjs";

const approval = (identity) => `HUMAN_APPROVAL:v1\n\n- Issue: #247\n- Release identity: \`${identity}\`\n- Decision: Approve public publication of the exact release.`;

test("extracts the release identity from a human approval comment", () => {
  assert.equal(parseReleaseIdentity(approval("a".repeat(64))), "a".repeat(64));
});

test("accepts only an approval matching the current release identity", () => {
  const comments = [
    { body: approval("a".repeat(64)) },
    { body: approval("b".repeat(64)) },
  ];
  assert.equal(findReleaseApproval(comments, "b".repeat(64)).approved, true);
  assert.equal(findReleaseApproval(comments, "c".repeat(64)).approved, false);
});
