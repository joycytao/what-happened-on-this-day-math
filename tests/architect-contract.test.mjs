import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateArchitectDecision, validateArchitectSkill } from "../src/architect-contract.mjs";

const skill = await readFile(new URL("../skills/architect/SKILL.md", import.meta.url), "utf8");

test("architect skill has the complete responsibility contract", () => {
  const result = validateArchitectSkill(skill);
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("architect decision requires one owned, evidenced technical question", () => {
  const result = validateArchitectDecision({
    owner: "agent: architect", status: "state: decision-requested",
    decisionOwner: "architect", issueComplete: true, evidencePresent: true,
    questionIsArchitectureOwned: true, interfaceImpactRecorded: true,
    verificationRecorded: true, labelMutationAttempted: false,
  });
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("architect fails closed on missing evidence and incomplete technical impact", () => {
  const result = validateArchitectDecision({
    owner: "agent: architect", status: "state: decision-requested",
    decisionOwner: "product-manager", issueComplete: true, evidencePresent: false,
    questionIsArchitectureOwned: false, interfaceImpactRecorded: false,
    verificationRecorded: false, labelMutationAttempted: true,
  });
  assert.deepEqual(result.errors, [
    "architect must own the decision row", "technical evidence is required",
    "question must be architecture-owned", "interface or behavior impact is required",
    "verification implications are required", "architect must not mutate workflow labels",
  ]);
});

test("architect preserves routing authority with pm-triage", () => {
  assert.match(skill, /architect.*pm-triage/si);
  assert.match(skill, /pm-triage owns labels/i);
  assert.match(skill, /missing technical evidence.*blocker/si);
});
