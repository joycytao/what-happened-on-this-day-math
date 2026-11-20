import assert from "node:assert/strict";
import test from "node:test";
import { dependencyRecoveryPlan, parseDependencyEvent, renderDependencyRecoveryComment, validateDependencyEvent } from "../src/dependency-recovery.mjs";

const dependency = { number: 10, state: "closed", body: "# Source\n", labels: ["status: done"] };
const issue = (overrides = {}) => ({
  number: 11,
  state: "open",
  body: "# Child\nCODEX_WORK_ITEM_KIND: implementation\nCODEX_DEPENDS_ON: joycytao/what-happened-on-this-day-math#10\nCODEX_INPUTS_VALIDATED: true\nCODEX_RECONCILE_TO: developer\n## Acceptance Criteria\n- complete the work",
  labels: ["agent: pm-triage", "status: blocked"],
  ...overrides,
});

test("validates machine-readable dependency events", () => {
  assert.equal(validateDependencyEvent({ schema: "CODEX_DEPENDENCY_EVENT:v1", eventId: "dep:10", kind: "dependency-closed", dependencyIssue: 10 }).valid, true);
  assert.equal(validateDependencyEvent({ schema: "CODEX_DEPENDENCY_EVENT:v1", eventId: "asset:1", kind: "source-asset-available", dependencyId: "cover" }).valid, true);
  assert.equal(validateDependencyEvent({ kind: "dependency-closed" }).valid, false);
});

test("parses issue closure and source push events into one contract", () => {
  assert.equal(parseDependencyEvent({ eventName: "issues", payload: { action: "closed", issue: { id: 10, number: 10, updated_at: "now" } } }).kind, "dependency-closed");
  assert.equal(parseDependencyEvent({ eventName: "push", payload: { after: "abc", commits: [{ added: ["assets/cover.png"], modified: [] }] } }).kind, "source-asset-available");
});

test("moves a resolved blocked implementation atomically to developer pickup", () => {
  const event = { schema: "CODEX_DEPENDENCY_EVENT:v1", eventId: "dep:10", kind: "dependency-closed", dependencyIssue: 10 };
  const plan = dependencyRecoveryPlan(issue(), [dependency, issue()], event);
  assert.equal(plan.action, "transition");
  assert.equal(plan.target, "ready to pickup");
  assert.deepEqual(plan.labels, ["agent: developer", "status: ready to pickup"]);
});

test("moves resolved but incomplete blocked work to PM pending review", () => {
  const event = { schema: "CODEX_DEPENDENCY_EVENT:v1", eventId: "dep:10", kind: "dependency-closed", dependencyIssue: 10 };
  const plan = dependencyRecoveryPlan(issue({ body: "# Child\nCODEX_DEPENDS_ON: joycytao/what-happened-on-this-day-math#10" }), [dependency], event);
  assert.equal(plan.action, "transition");
  assert.equal(plan.target, "pending review");
  assert.deepEqual(plan.labels, ["agent: pm-triage", "status: pending review"]);
});

test("does not unblock when an unrelated dependency closes", () => {
  const event = { schema: "CODEX_DEPENDENCY_EVENT:v1", eventId: "dep:99", kind: "dependency-closed", dependencyIssue: 99 };
  assert.equal(dependencyRecoveryPlan(issue(), [dependency, issue()], event).action, "none");
});

test("renders an idempotent recovery fingerprint", () => {
  const comment = renderDependencyRecoveryComment({ issue: 11, event: { eventId: "dep:10", kind: "dependency-closed" }, target: "ready to pickup", reason: "closed", report: { dependencies: [{ dependency: "#10", satisfied: true }], sourceAssets: [] } });
  assert.match(comment, /CODEX_DEPENDENCY_RECOVERY:11:dep:10:ready to pickup/);
});
