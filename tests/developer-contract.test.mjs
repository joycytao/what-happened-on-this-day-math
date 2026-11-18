import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateDeveloperPickup, validateDeveloperSkill } from "../src/developer-contract.mjs";

const skill = await readFile(new URL("../skills/developer/SKILL.md", import.meta.url), "utf8");

test("developer skill has the complete responsibility contract", () => {
  const result = validateDeveloperSkill(skill);
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("developer pickup requires validated routine inputs and dependencies", () => {
  const result = validateDeveloperPickup({
    owner: "agent: developer",
    status: "status: ready to pickup",
    kind: "implementation",
    inputsValidated: true,
    hasAcceptanceCriteria: true,
    dependenciesSatisfied: true,
    reviewGate: "routine",
    humanDecisionRequired: false,
  });
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("developer pickup rejects human-gated or incomplete work", () => {
  const result = validateDeveloperPickup({
    owner: "agent: developer",
    status: "status: ready to pickup",
    kind: "implementation",
    inputsValidated: false,
    hasAcceptanceCriteria: true,
    dependenciesSatisfied: true,
    reviewGate: "final-copy",
    humanDecisionRequired: true,
  });
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ["inputs must be validated", "human-gated work cannot enter developer pickup", "human decision gate cannot enter developer pickup"]);
});

test("developer responsibility includes investigating workflow failures", () => {
  assert.match(skill, /failed workflow run/i);
  assert.match(skill, /failure classification/i);
  assert.match(skill, /successful\s+rerun or a named external\/scope blocker/i);
});

test("developer responsibility includes resolving PR conflicts", () => {
  assert.match(skill, /Actively resolve PR conflicts/i);
  assert.match(skill, /mergeable state/i);
  assert.match(skill, /isolated worktree/i);
  assert.match(skill, /conflict\s+resolution summary/i);
});
