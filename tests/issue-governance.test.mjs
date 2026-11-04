import test from "node:test";
import assert from "node:assert/strict";
import { dependencyReport, parseIssueContract, selectVerifiedQueue, validateGovernanceIssue } from "../src/issue-governance.mjs";

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
