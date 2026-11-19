import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateSocialExpertDecision, validateSocialExpertSkill } from "../src/social-expert-contract.mjs";

const skill = await readFile(new URL("../skills/social-expert/SKILL.md", import.meta.url), "utf8");

test("social expert skill has the complete responsibility contract", () => {
  const result = validateSocialExpertSkill(skill);
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("social decision requires one owned, evidenced channel and asset question", () => {
  const result = validateSocialExpertDecision({
    owner: "agent: social-expert", status: "state: decision-requested",
    decisionOwner: "social-expert", issueComplete: true, evidencePresent: true,
    questionIsSocialOwned: true, channelConstraintRecorded: true,
    assetContractRecorded: true, verificationRecorded: true,
    labelMutationAttempted: false,
  });
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("social expert fails closed on missing evidence, scope, asset, or verification", () => {
  const result = validateSocialExpertDecision({
    owner: "agent: architect", status: "status: ready to pickup",
    decisionOwner: "product-manager", issueComplete: true, evidencePresent: false,
    questionIsSocialOwned: false, channelConstraintRecorded: false,
    assetContractRecorded: false, verificationRecorded: false,
    labelMutationAttempted: true,
  });
  assert.deepEqual(result.errors, [
    "social-expert owner is required", "state: decision-requested is required",
    "social-expert must own the decision row", "social evidence is required",
    "question must be social-owned", "channel or format constraint is required",
    "social asset contract is required", "social verification is required",
    "social-expert must not mutate workflow labels",
  ]);
});

test("human-only social gates require an explicit request", () => {
  const result = validateSocialExpertDecision({
    owner: "agent: social-expert", status: "state: decision-requested",
    decisionOwner: "social-expert", issueComplete: true, evidencePresent: true,
    questionIsSocialOwned: true, channelConstraintRecorded: true,
    assetContractRecorded: true, verificationRecorded: true,
    humanDecisionRequired: true, humanRequestRecorded: false,
  });
  assert.deepEqual(result.errors, ["explicit human decision request is required"]);
});

test("routing authority stays with pm-triage and missing evidence is a blocker", () => {
  assert.match(skill, /social-expert.*pm-triage/si);
  assert.match(skill, /pm-triage owns (workflow )?labels/i);
  assert.match(skill, /missing (platform|source|asset) evidence.*blocker/si);
});
