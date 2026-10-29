import test from "node:test";
import assert from "node:assert/strict";

import { buildScheduledDispatchPlan, isScheduledEligible } from "../src/scheduled-agent-dispatch.mjs";

function issue(number, labels, overrides = {}) {
  return { number, title: `Issue ${number}`, url: `https://github.com/example/issues/${number}`, createdAt: `2026-10-${String(number).padStart(2, "0")}T00:00:00Z`, labels: labels.map((name) => ({ name })), ...overrides };
}

test("dispatches at most one eligible Issue per role with the correct skill and next role", () => {
  const plan = buildScheduledDispatchPlan([
    issue(187, ["status: ready to pickup", "agent: developer"]),
    issue(188, ["agent: quality-engineer", "state: qa"]),
    issue(189, ["agent: architect", "state: decision-requested"])
  ], { generatedAt: "2026-10-28T15:00:00Z" });
  assert.deepEqual(plan.assignments.map((item) => [item.role, item.issueNumber]), [["architect", 189], ["developer", 187], ["quality-engineer", 188]]);
  assert.equal(plan.assignments.find((item) => item.role === "developer").nextRole, "quality-engineer");
  assert.match(plan.assignments[0].body, /CODEX_SCHEDULED_AGENT_DISPATCH/);
});

test("does not dispatch paused, blocked, claimed, or ambiguous work", () => {
  const issues = [
    issue(1, ["status: ready to pickup", "agent: developer", "state: paused"]),
    issue(2, ["status: ready to pickup", "agent: developer", "state: claimed"]),
    issue(3, ["status: ready to pickup", "agent: developer", "status: blocked"]),
    issue(4, ["status: ready to pickup", "agent: developer", "agent: architect"])
  ];
  assert.equal(buildScheduledDispatchPlan(issues).assignments.length, 0);
});

test("requires a decision state for decision-owner roles", () => {
  assert.equal(isScheduledEligible(issue(10, ["agent: architect"]), "architect"), false);
  assert.equal(isScheduledEligible(issue(10, ["agent: architect", "state: decision-requested"]), "architect"), true);
});
