import assert from "node:assert/strict";
import test from "node:test";

import { validateReadyForHumanGate } from "../src/human-gate-integrity.mjs";

const request = "HUMAN_DECISION_REQUEST:v1\nDecision owner: Human Accountable Owner\nDecision: approve final copy\nBlocked actions: publish\nNext state/role: ready to dispatch";

test("routine work cannot enter ready-for-human", () => {
  const result = validateReadyForHumanGate({ labels: ["ready-for-human"], body: "Review gate: routine" });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /final-merge|HUMAN_DECISION_REQUEST/);
});

test("final-merge has an explicit operational gate", () => {
  const result = validateReadyForHumanGate({ labels: ["ready-for-human"], body: "Review gate: final-merge" });
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.reviewGate, "final-merge");
});

test("human decision gate requires exactly one decision request", () => {
  const body = "Review gate: final-copy";
  assert.equal(validateReadyForHumanGate({ labels: ["ready-for-human"], body }).valid, false);
  assert.equal(validateReadyForHumanGate({ labels: ["ready-for-human"], body, comments: [{ body: request }] }).valid, true);
  assert.equal(validateReadyForHumanGate({ labels: ["ready-for-human"], body, comments: [{ body: request }, { body: request }] }).valid, false);
});

test("without the label, gate evidence is not mistaken for a human queue state", () => {
  const result = validateReadyForHumanGate({ body: "Review gate: final-copy", comments: [{ body: request }] });
  assert.equal(result.valid, true);
});
