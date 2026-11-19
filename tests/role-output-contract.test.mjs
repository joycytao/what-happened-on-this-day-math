import assert from "node:assert/strict";
import test from "node:test";

import { AGENT_ROLES } from "../src/agent-handoff.mjs";
import { ROLE_OUTPUT_KINDS, roleOutputSchema, validateRoleOutput } from "../src/role-output-contract.mjs";

const base = (overrides = {}) => ({
  from: "developer",
  to: "quality-engineer",
  status: "completed",
  outputKind: "implementation",
  returnPath: "pm-triage",
  completed: ["implementation committed"],
  blockers: ["none"],
  prerequisitesSatisfied: ["inputs validated", "dependencies resolved"],
  prerequisitesMissing: [],
  ...overrides,
});

test("publishes exactly one output kind and legal routing contract per role", () => {
  const schema = roleOutputSchema();
  assert.deepEqual(Object.keys(schema.roles), AGENT_ROLES);
  for (const role of AGENT_ROLES) assert.equal(schema.roles[role].outputKind, ROLE_OUTPUT_KINDS[role]);
});

test("rejects an output kind or target that does not belong to the role", () => {
  assert.ok(validateRoleOutput(base({ outputKind: "qa-result" })).errors.includes("role_output_kind_invalid"));
  assert.ok(validateRoleOutput(base({ to: "architect" })).errors.includes("role_output_target_not_legal_for_role"));
  assert.ok(validateRoleOutput(base({ returnPath: "architect" })).errors.includes("role_output_return_path_invalid"));
});

test("rejects completed and blocked evidence in one output", () => {
  const result = validateRoleOutput(base({ blockers: ["failed check"] }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("completed_and_blocked_conflict"));
});

test("requires blocked outputs to carry blockers and no completed evidence", () => {
  const result = validateRoleOutput(base({ status: "blocked", to: "pm-triage", completed: [], blockers: ["missing source"], prerequisitesMissing: ["source data"] }));
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(validateRoleOutput(base({ status: "blocked", to: "pm-triage", blockers: ["missing source"] })).valid, false);
});

test("prevents crossing an unsatisfied prerequisite", () => {
  const result = validateRoleOutput(base({ prerequisitesMissing: ["dependency #42"] }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("unsatisfied_prerequisite_cannot_be_crossed"));
  const blocked = validateRoleOutput(base({ status: "blocked", to: "pm-triage", completed: [], blockers: ["dependency #42"], prerequisitesMissing: ["dependency #42"] }));
  assert.equal(blocked.valid, true, blocked.errors.join("\n"));
});

test("allows only the explicit QE rejection return to developer", () => {
  const result = validateRoleOutput(base({ from: "quality-engineer", to: "developer", status: "rejected", outputKind: "qa-result", returnPath: "developer", completed: [], blockers: ["failed visual check"] }));
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(validateRoleOutput(base({ from: "developer", to: "pm-triage", status: "rejected", completed: [], blockers: ["failed test"] })).valid, false);
});
