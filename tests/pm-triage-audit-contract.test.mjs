import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validatePmTriageAuditSkill } from "../src/pm-triage-audit-contract.mjs";

const skill = await readFile(new URL("../skills/pm-triage/SKILL.md", import.meta.url), "utf8");

test("pm-triage skill defines proactive audit and safe reconciliation", () => {
  const result = validatePmTriageAuditSkill(skill);
  assert.equal(result.valid, true, result.errors.join("\n"));
});
