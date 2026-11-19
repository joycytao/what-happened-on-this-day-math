import assert from "node:assert/strict";
import test from "node:test";

import { routeHandoff } from "../src/agent-handoff-routing.mjs";

const outputKinds = { "pm-triage": "triage-decision", "product-manager": "product-decision", architect: "architecture-decision", "social-expert": "social-decision", developer: "implementation", "quality-engineer": "qa-result" };
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
  outputKind: outputKinds[overrides.from || "architect"],
  returnPath: "pm-triage",
  prerequisitesSatisfied: ["scope is defined"],
  prerequisitesMissing: [],
  ...overrides,
});

const context = (overrides = {}) => ({
  labels: [],
  seenHandoffIds: [],
  isPullRequest: false,
  ...overrides,
});

test("routes a completed architect decision to pm-triage", () => {
  const result = routeHandoff(handoff(), context({ labels: ["agent-requested", "status:pending review"] }));

  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.nextRole, "pm-triage");
  assert.equal(result.nextState, "pending review");
  assert.deepEqual(result.addLabels, ["agent: pm-triage", "status: pending review"]);
  assert.deepEqual(result.removeLabels, ["agent-requested", "status:pending review"]);
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
    outputKind: "implementation",
    workItem: "joycytao/what-happened-on-this-day-math#203",
  }), context({ isPullRequest: true }));

  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.nextRole, "quality-engineer");
  assert.equal(result.nextState, "qa");
});

test("marks routine PR completion as an operational merge gate, not content review", () => {
  const result = routeHandoff(handoff({ from: "quality-engineer", to: "ready-for-human", outputKind: "qa-result" }), context({ isPullRequest: true, reviewGate: "final-merge" }));

  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.reviewGate, "final-merge");
  assert.equal(result.humanDecisionRequired, false);
});

test("rejects a routine review gate at the human workflow terminal", () => {
  const result = routeHandoff(handoff({ from: "quality-engineer", to: "ready-for-human", outputKind: "qa-result", status: "completed" }), {
    isPullRequest: true,
    reviewGate: "routine",
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /routine work cannot enter ready-for-human/);
});

test("marks explicit final-copy completion as requiring human judgment", () => {
  const result = routeHandoff(handoff({ from: "quality-engineer", to: "ready-for-human", outputKind: "qa-result" }), context({ isPullRequest: true, reviewGate: "final-copy", humanDecisionRequestCount: 1 }));

  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.reviewGate, "final-copy");
  assert.equal(result.humanDecisionRequired, true);
});

test("routes a rejected QA handoff back to developer", () => {
  const result = routeHandoff(handoff({
    from: "quality-engineer",
    to: "developer",
    status: "rejected",
    outputKind: "qa-result",
    completed: [],
    blockers: ["failed QA check"],
    returnPath: "developer",
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

test("handoff routing never emits deprecated or duplicate derived labels", () => {
  const result = routeHandoff(handoff({ from: "developer", to: "quality-engineer" }), context({
    isPullRequest: true,
    labels: ["agent: developer", "agent-requested", "status:ready to pickup"],
  }));
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.deepEqual(result.addLabels, ["agent: quality-engineer", "status: qa"]);
  assert.deepEqual(result.removeLabels, ["agent: developer", "agent-requested", "status:ready to pickup"]);
  assert.equal(result.addLabels.some((label) => label === "agent-requested" || label === "status:ready to pickup"), false);
});
