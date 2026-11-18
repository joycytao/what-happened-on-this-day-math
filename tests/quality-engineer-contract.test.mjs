import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateQualityEngineerPickup, validateQualityEngineerSkill } from "../src/quality-engineer-contract.mjs";

const skill = await readFile(new URL("../skills/quality-engineer/SKILL.md", import.meta.url), "utf8");

test("quality-engineer skill has the complete responsibility contract", () => {
  const result = validateQualityEngineerSkill(skill);
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("quality-engineer pickup requires a complete linked implementation", () => {
  const result = validateQualityEngineerPickup({
    owner: "agent: quality-engineer", status: "status: qa", kind: "implementation",
    issueComplete: true, prLinked: true, acceptanceCriteria: true,
    dependenciesSatisfied: true, humanDecisionRequired: false,
  });
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("quality-engineer pickup fails closed on incomplete or unapproved gates", () => {
  const result = validateQualityEngineerPickup({
    owner: "agent: quality-engineer", status: "status: qa", kind: "implementation",
    issueComplete: false, prLinked: false, acceptanceCriteria: true,
    dependenciesSatisfied: false, humanDecisionRequired: true, humanDecisionRecorded: false,
  });
  assert.deepEqual(result.errors, [
    "complete Issue is required", "linked PR is required",
    "dependencies must be resolved", "human decision must be recorded before gated QA",
  ]);
});

test("quality-engineer separates independent QA gates", () => {
  assert.match(skill, /content, mathematics, source, layout\/PDF, visual, and deterministic checks\s+separately/i);
  assert.match(skill, /first failing job\/step/i);
  assert.match(skill, /PR mergeable-state evidence/i);
});

test("quality-engineer has explicit return routes", () => {
  assert.match(skill, /quality-engineer → developer.*rejected/si);
  assert.match(skill, /quality-engineer → pm-triage.*blocked/si);
  assert.match(skill, /quality-engineer → ready-for-human.*completed/si);
});
