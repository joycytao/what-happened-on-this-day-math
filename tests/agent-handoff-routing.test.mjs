import assert from "node:assert/strict";
import test from "node:test";

import { routeHandoff } from "../src/agent-handoff-routing.mjs";

const handoff = (overrides = {}) => ({
  handoffId: "repo:187:architect:developer:1",
  from: "architect",
  to: "pm-triage",
  workItem: "joycytao/what-happened-on-this-day-math#187",
  status: "completed",
  completed: ["decision recorded"],
  requiredNextAction: ["update the Decision Register"],
  evidence: ["#187"],
  constraints: ["do not change readiness"],
  blockers: ["none"],
  expectedOutput: ["triage update"],
  ...overrides,
});

const context = (overrides = {}) => ({
  labels: [],
  seenHandoffIds: [],
  isPullRequest: false,
  ...overrides,
});

test("routes a completed architect decision to pm-triage", () => {
  const result = routeHandoff(handoff(), context());

  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.nextRole, "pm-triage");
  assert.equal(result.nextState, "decision-complete");
  assert.deepEqual(result.addLabels, ["agent: pm-triage", "state: decision-complete"]);
});

test("routes a human-approved ready Issue to developer", () => {
  const result = routeHandoff(handoff({ from: "pm-triage", to: "developer" }), context({ labels: ["status: ready to pickup"] }));

  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.nextRole, "developer");
  assert.equal(result.nextState, "implementation");
});

test("rejects a developer route without the human readiness label", () => {
  const result = routeHandoff(handoff({ from: "pm-triage", to: "developer" }), context());

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("developer_gate_missing"));
});

test("routes a completed developer PR to quality-engineer", () => {
  const result = routeHandoff(handoff({
    from: "developer",
    to: "quality-engineer",
    workItem: "joycytao/what-happened-on-this-day-math#203",
  }), context({ isPullRequest: true }));

  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.nextRole, "quality-engineer");
  assert.equal(result.nextState, "qa");
});

test("routes a rejected QA handoff back to developer", () => {
  const result = routeHandoff(handoff({
    from: "quality-engineer",
    to: "developer",
    status: "rejected",
    requiredNextAction: ["fix the failed QA check"],
  }), context({ isPullRequest: true }));

  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.nextRole, "developer");
  assert.equal(result.nextState, "changes-requested");
});

test("does not route duplicate handoff IDs twice", () => {
  const result = routeHandoff(handoff(), context({ seenHandoffIds: ["repo:187:architect:developer:1"] }));

  assert.equal(result.valid, true);
  assert.equal(result.duplicate, true);
  assert.deepEqual(result.addLabels, []);
  assert.equal(result.shouldComment, false);
});
