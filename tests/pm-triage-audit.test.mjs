import assert from "node:assert/strict";
import test from "node:test";

import { auditIssue, auditQueue, reconcileRoutineLabels, renderAuditComment } from "../src/pm-triage-audit.mjs";

const issue = (number, labels, body = "# Work\n\n## Acceptance Criteria\n- test", state = "open") => ({ number, labels, body, state, html_url: `https://github.com/example/repo/issues/${number}` });

test("routine status aliases are reconciled without guessing owner or state", () => {
  assert.deepEqual(reconcileRoutineLabels(issue(1, ["status:ready to pickup"])), {
    add: ["status: ready to pickup"], remove: ["status:ready to pickup"], changed: true,
  });
});

test("queue audit identifies owner/status conflicts instead of guessing", () => {
  const result = auditIssue(issue(2, ["agent: developer", "agent: quality-engineer", "status: qa"]));
  assert.equal(result.category, "owner-or-status-conflict");
  assert.equal(result.eligible, false);
  assert.match(result.nextAction, /must reconcile/i);
});

test("queue audit explains why no Issue is eligible for pickup", () => {
  const result = auditQueue([
    issue(3, ["status: blocked"]),
    issue(4, ["status: paused"]),
    issue(5, ["ready-for-human"]),
  ]);
  assert.equal(result.noPickup, true);
  assert.equal(result.eligible.length, 0);
  assert.equal(result.byCategory.blocked, 1);
  assert.equal(result.byCategory.paused, 1);
  assert.equal(result.byCategory["human-gated"], 1);
  assert.match(renderAuditComment(result), /No-pickup diagnosis: yes/);
});

test("readable pending review with no owner is an eligible PM intake", () => {
  const result = auditIssue(issue(6, ["status: pending review"]));
  assert.equal(result.category, "pm-triage-intake");
  assert.equal(result.eligible, true);
});

test("open PR representation blocks duplicate pickup", () => {
  const result = auditIssue(issue(7, ["status: ready to pickup", "agent: developer"], "# Work\n\n## Acceptance Criteria\n- test\nFixes #99"), [], [{ number: 99, url: "https://github.com/example/repo/pull/99" }]);
  assert.equal(result.category, "represented-by-open-pr");
  assert.equal(result.eligible, false);
});
