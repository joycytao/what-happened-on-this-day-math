import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  validateProductManagerDecision,
  validateProductManagerSkill,
} from "../src/product-manager-contract.mjs";

const skill = await readFile(new URL("../skills/product-manager/SKILL.md", import.meta.url), "utf8");

test("product-manager skill has the complete responsibility contract", () => {
  const result = validateProductManagerSkill(skill);
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("product-manager decision requires one owned, evidenced product question", () => {
  const result = validateProductManagerDecision({
    owner: "agent: product-manager",
    status: "state: decision-requested",
    decisionOwner: "product-manager",
    issueComplete: true,
    evidencePresent: true,
    questionIsProductOwned: true,
    humanDecisionRequired: false,
    labelMutationAttempted: false,
  });
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("product-manager fails closed on missing evidence and wrong ownership", () => {
  const result = validateProductManagerDecision({
    owner: "agent: product-manager",
    status: "state: decision-requested",
    decisionOwner: "architect",
    issueComplete: true,
    evidencePresent: false,
    questionIsProductOwned: false,
    humanDecisionRequired: false,
    labelMutationAttempted: true,
  });
  assert.deepEqual(result.errors, [
    "product-manager must own the decision row",
    "decision evidence is required",
    "question must be product-owned",
    "product-manager must not mutate workflow labels",
  ]);
});

test("human-only product gates require an explicit request", () => {
  const result = validateProductManagerDecision({
    owner: "agent: product-manager",
    status: "state: decision-requested",
    decisionOwner: "product-manager",
    issueComplete: true,
    evidencePresent: true,
    questionIsProductOwned: true,
    humanDecisionRequired: true,
    humanRequestRecorded: false,
    labelMutationAttempted: false,
  });
  assert.deepEqual(result.errors, ["human-only decision requires HUMAN_DECISION_REQUEST:v1"]);
});

test("product-manager returns routing and label authority to pm-triage", () => {
  assert.match(skill, /product-manager.*pm-triage/si);
  assert.match(skill, /does not mutate labels/i);
  assert.match(skill, /missing evidence.*pm-triage/si);
});
