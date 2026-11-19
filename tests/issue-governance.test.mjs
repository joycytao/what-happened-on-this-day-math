import test from "node:test";
import assert from "node:assert/strict";
import {
  dependencyReport,
  parseIssueContract,
  selectVerifiedQueue,
  validateGovernanceIssue,
  validateGovernanceTransition,
} from "../src/issue-governance.mjs";

const base = (overrides = {}) => ({ state: "open", body: "# Work\n\n## Acceptance Criteria\n- test", labels: [], ...overrides });

test("parses machine-readable parent, dependency, and input markers", () => {
  const contract = parseIssueContract(base({ body: "<!-- monthly-production:2027-01:content-conversion -->\nCODEX_WORK_ITEM_KIND: implementation\nCODEX_PARENT_KEY: monthly-production:2027-01:parent\nCODEX_DEPENDS_ON_KEY: context-source\nCODEX_INPUTS_VALIDATED: true\nCODEX_RECONCILE_TO: developer" }));
  assert.equal(contract.kind, "implementation");
  assert.equal(contract.parentKey, "monthly-production:2027-01:parent");
  assert.deepEqual(contract.keyDependencies, ["context-source"]);
  assert.equal(contract.inputsValidated, true);
  assert.equal(contract.reconcileTo, "developer");
});

test("parent Issues are never verified developer pickup candidates", () => {
  const parent = base({ body: "<!-- monthly-production:2027-01:parent -->\nCODEX_WORK_ITEM_KIND: parent\n## Acceptance Criteria", labels: ["status: ready to pickup", "agent: developer"] });
  const queue = selectVerifiedQueue([parent]);
  assert.deepEqual(queue.developerPickup, []);
  assert.match(validateGovernanceIssue(parent, [parent]).errors.join("\n"), /parent Issues/);
});

test("ready pickup requires closed dependencies, one developer owner, inputs, and acceptance", () => {
  const dependency = base({ number: 10, state: "closed", body: "<!-- monthly-production:2027-01:context-source -->", labels: ["status: done", "agent: developer"] });
  const child = base({ number: 11, body: "<!-- monthly-production:2027-01:content-conversion -->\nCODEX_WORK_ITEM_KIND: implementation\nCODEX_DEPENDS_ON: owner/repo#10\nCODEX_INPUTS_VALIDATED: true\n## Acceptance Criteria\n- English output", labels: ["status: ready to pickup", "agent: developer"] });
  assert.equal(validateGovernanceIssue(child, [dependency, child]).valid, true);
  assert.equal(selectVerifiedQueue([dependency, child]).developerPickup[0].number, 11);
  dependency.state = "open";
  assert.equal(dependencyReport(child, [dependency, child]).satisfied, false);
  assert.deepEqual(selectVerifiedQueue([dependency, child]).developerPickup, []);
});

test("pending review intake is separated from developer pickup", () => {
  const intake = base({ number: 12, body: "# New request\n\n## Acceptance Criteria\n- clarify", labels: ["status: pending review"] });
  const queue = selectVerifiedQueue([intake]);
  assert.equal(queue.pmIntake[0].number, 12);
  assert.deepEqual(queue.developerPickup, []);
});

test("release transitions distinguish approval from dispatch readiness", () => {
  assert.equal(validateGovernanceTransition("status: qa", "ready-for-human").valid, true);
  assert.equal(validateGovernanceTransition("ready-for-human", "status: ready to dispatch").valid, true);
  assert.equal(validateGovernanceTransition("status: ready to dispatch", "status: done").valid, true);
  assert.equal(validateGovernanceTransition("status: qa", "status: ready to dispatch").valid, false);
});

test("routine work cannot accidentally enter the human gate", () => {
  const routine = base({ labels: ["ready-for-human"] });
  const result = validateGovernanceIssue(routine, [routine]);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /HUMAN_DECISION_REQUEST|final-merge/.test(error)));
});

test("explicit final-copy work must use the human gate", () => {
  const copy = base({ body: "# Copy\n\nReview gate: final-copy\n\n## Acceptance Criteria\n- exact final copy", labels: ["status: ready to pickup", "agent: developer"] });
  const result = validateGovernanceIssue(copy, [copy]);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("human review gates cannot be routed to routine pickup"));
});

test("final merge remains an operational human action", () => {
  const merge = base({ body: "# Merge\n\nReview gate: final-merge\n", labels: ["ready-for-human"] });
  assert.equal(validateGovernanceIssue(merge, [merge]).valid, true);
});
