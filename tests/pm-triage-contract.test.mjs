import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  LEGAL_DECISION_OWNERS,
  parseDecisionRegister,
  validateDecisionRegister,
  validatePmTriageSkill,
} from "../src/pm-triage-contract.mjs";

const validRegister = `
### Decision Register

| ID | Question | Type | Blocking | Decision Owner | Consulted | Status |
|---|---|---|---|---|---|---|
| Q1 | Which interface should be used? | architecture | yes | architect | developer | open |
| Q2 | Is the copy preference required? | product | no | product-manager | social-expert | open |
`;

test("parses one row per decision question", () => {
  const result = parseDecisionRegister(validRegister);
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.deepEqual(result.rows.map((row) => row.id), ["Q1", "Q2"]);
  assert.equal(result.rows[0].owner, "architect");
});

test("accepts only canonical decision owners", () => {
  const result = validateDecisionRegister(validRegister);
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.deepEqual([...LEGAL_DECISION_OWNERS].sort(), [
    "architect",
    "developer",
    "pm-triage",
    "product-manager",
    "quality-engineer",
    "social-expert",
  ]);
});

test("rejects duplicate IDs, missing owners, and non-canonical TPT owners", () => {
  const invalid = validRegister
    .replace("| Q2 | Is the copy preference required? | product | no | product-manager | social-expert | open |", "| Q1 | Duplicate question | product | yes | tpt-expert | none | open |");
  const result = validateDecisionRegister(invalid);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("duplicate decision id: Q1"));
  assert.ok(result.errors.includes("decision Q1 has a non-canonical owner: tpt-expert"));
});

test("rejects a ready-to-pickup recommendation with unresolved blocking work", () => {
  const result = validateDecisionRegister(validRegister, { recommendReadyToPickup: true });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("cannot recommend ready to pickup while blocking decisions are open"));
});

test("requires the pm-triage skill to state authority, outputs, and stop conditions", async () => {
  const skill = await readFile(new URL("../skills/pm-triage/SKILL.md", import.meta.url), "utf8");
  const result = validatePmTriageSkill(skill);
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("rejects a skill that names a removed or non-canonical owner", () => {
  const result = validatePmTriageSkill("# PM Triage\n\nDecision Owner: tpt-expert\n");
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("skill names non-canonical owner: tpt-expert"));
});
