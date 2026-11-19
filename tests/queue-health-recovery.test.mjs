import assert from "node:assert/strict";
import test from "node:test";

import { auditQueueHealth, auditQueueHealthBatch } from "../src/queue-health-recovery.mjs";

const issue = (labels, overrides = {}) => ({
  number: 302,
  state: "open",
  labels,
  body: "# Work\n\n## Acceptance Criteria\n- test",
  ...overrides,
});

test("stale role claims are released only with explicit claim evidence", () => {
  const result = auditQueueHealth(issue(["agent: developer", "status: ready to pickup", "state: claimed"], {
    claim: { role: "developer", claimedAt: "2026-11-18T00:00:00Z", handoffId: "claim-1" },
  }), { now: "2026-11-19T00:00:00Z", staleAfterMs: 60 * 60 * 1000 });
  assert.equal(result.category, "stale-role-claim");
  assert.deepEqual(result.repair, { add: [], remove: ["state: claimed"] });
  assert.equal(result.nextRole, "developer");
});

test("claim without timestamp fails closed instead of guessing stale", () => {
  const result = auditQueueHealth(issue(["agent: developer", "status: ready to pickup", "state: claimed"]));
  assert.equal(result.category, "claim-age-unknown");
  assert.deepEqual(result.repair, { add: [], remove: [] });
  assert.ok(result.blockers.includes("claim_timestamp_missing"));
});

test("closed Issues lose active owners and receive terminal status", () => {
  const result = auditQueueHealth(issue(["agent: developer", "state: implementation"], { state: "closed" }));
  assert.equal(result.category, "closed-active-owner");
  assert.deepEqual(result.repair, { add: ["status: done"], remove: ["agent: developer", "state: implementation"] });
  assert.equal(result.nextRole, null);
});

test("merged PRs reconcile an open Issue to terminal labels without closing it", () => {
  const result = auditQueueHealth(issue(["agent: quality-engineer", "status: qa"], {
    pullRequests: [{ number: 303, state: "closed", merged_at: "2026-11-19T00:00:00Z", url: "https://github.com/example/repo/pull/303" }],
    body: "# Work\n\nFixes #303\n\n## Acceptance Criteria\n- test",
  }));
  assert.equal(result.category, "merged-pr-terminal-drift");
  assert.deepEqual(result.repair, { add: ["status: done"], remove: ["agent: quality-engineer", "status: qa"] });
  assert.equal(result.nextRole, null);
});

test("failed workflow returns to the explicitly declared owning role", () => {
  const result = auditQueueHealth(issue(["agent: developer", "state: implementation"], {
    workflowRun: { id: 444, conclusion: "failure", role: "developer", url: "https://github.com/example/actions/runs/444" },
  }));
  assert.equal(result.category, "workflow-run-failed-recovery");
  assert.deepEqual(result.repair, { add: [], remove: [] });
  assert.equal(result.nextRole, "developer");
});

test("workflow failure without an explicit role is a PM blocker", () => {
  const result = auditQueueHealth(issue(["agent: developer", "state: implementation"], {
    workflowRun: { id: 445, conclusion: "failure", url: "https://github.com/example/actions/runs/445" },
  }));
  assert.equal(result.category, "workflow-failure-owner-unknown");
  assert.equal(result.repair.add.length, 0);
  assert.ok(result.blockers.includes("failed_workflow_role_missing"));
});

test("batch audit exposes all queue health categories and repairable items", () => {
  const result = auditQueueHealthBatch([
    issue(["agent: developer", "status: ready to pickup", "state: claimed"], { claim: { role: "developer", claimedAt: "2026-11-18T00:00:00Z" } }),
    issue(["agent: developer"], { number: 303, state: "closed" }),
  ], { now: "2026-11-19T00:00:00Z", staleAfterMs: 60 * 60 * 1000 });
  assert.equal(result.entries.length, 2);
  assert.equal(result.repairable.length, 2);
});
