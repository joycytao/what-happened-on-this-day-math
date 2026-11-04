import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { routeHandoff } from "../src/agent-handoff-routing.mjs";
import { listEligibleWork } from "../src/agent-pickup.mjs";

const fixture = JSON.parse(await readFile(new URL("./fixtures/agent-handoff-issues.json", import.meta.url)));
const handoff = (overrides = {}) => ({
  handoffId: "repo:191:architect:pm-triage:1",
  from: "architect", to: "pm-triage", workItem: "joycytao/what-happened-on-this-day-math#191",
  status: "completed", completed: ["decision recorded"], requiredNextAction: ["record decision"],
  evidence: ["fixture evidence"], constraints: ["preserve readiness gate"], blockers: ["none"], expectedOutput: ["triage update"],
  ...overrides,
});

test("offline fixture proves the complete handoff route", () => {
  const decisionRequest = listEligibleWork([fixture.issue], { role: "architect", connectivityValid: true });
  assert.deepEqual(decisionRequest.items.map(item => item.number), [191]);

  const decision = routeHandoff(handoff(), { labels: fixture.issue.labels });
  assert.equal(decision.nextRole, "pm-triage");
  assert.equal(decision.nextState, "decision-complete");

  const withoutApproval = routeHandoff(handoff({ from: "pm-triage", to: "developer" }), { labels: [] });
  assert.equal(withoutApproval.valid, false);
  assert.ok(withoutApproval.errors.includes("developer_gate_missing"));

  const approved = routeHandoff(handoff({ from: "pm-triage", to: "developer" }), { labels: ["status: ready to pickup"] });
  assert.equal(approved.nextRole, "developer");

  const qa = routeHandoff(handoff({ from: "developer", to: "quality-engineer", workItem: "joycytao/what-happened-on-this-day-math#203" }), { isPullRequest: true });
  assert.equal(qa.nextRole, "quality-engineer");
  assert.equal(qa.nextState, "qa");

  const failed = routeHandoff(handoff({ from: "quality-engineer", to: "developer", status: "rejected" }), { isPullRequest: true });
  assert.equal(failed.nextState, "changes-requested");

  const passed = routeHandoff(handoff({ from: "quality-engineer", to: "developer", status: "completed" }), { isPullRequest: true });
  assert.equal(passed.nextRole, null);
  assert.equal(passed.nextState, "human-review");
});

test("offline recovery rules do not claim unsafe work", () => {
  const duplicate = routeHandoff(handoff(), { seenHandoffIds: [handoff().handoffId] });
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.shouldComment, false);

  const blocked = routeHandoff(handoff({ status: "blocked", blockers: ["missing evidence"] }), {});
  assert.equal(blocked.nextRole, "pm-triage");
  assert.equal(blocked.nextState, "blocked");

  const connectivity = listEligibleWork([], { role: "developer", connectivityValid: false, connectivityMessage: "offline fixture connectivity failure" });
  assert.equal(connectivity.valid, false);
  assert.deepEqual(connectivity.blockers, ["offline fixture connectivity failure"]);
});
