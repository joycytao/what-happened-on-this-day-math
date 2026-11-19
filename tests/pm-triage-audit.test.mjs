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

test("PM triage atomically assigns developer only with explicit routing evidence", () => {
  const body = [
    "# Work",
    "CODEX_WORK_ITEM_KIND: implementation",
    "CODEX_RECONCILE_TO: developer",
    "CODEX_INPUTS_VALIDATED: true",
    "",
    "## Acceptance Criteria",
    "- test",
  ].join("\n");
  const result = auditIssue(issue(8, ["status: ready to pickup"], body));
  assert.equal(result.category, "routine-metadata-repair");
  assert.equal(result.eligible, false);
  assert.deepEqual(result.repair.labels, ["agent: developer", "status: ready to pickup"]);
  assert.deepEqual(result.repair.add, ["agent: developer"]);
  assert.match(result.nextAction, /atomic/i);
});

test("ownerless ready pickup fails closed into PM triage blocked state", () => {
  const result = auditIssue(issue(9, ["status: ready to pickup"], "# Work\n\n## Acceptance Criteria\n- test"));
  assert.equal(result.category, "metadata-repair-required");
  assert.equal(result.eligible, false);
  assert.deepEqual(result.repair.labels, ["agent: pm-triage", "status: blocked"]);
  assert.deepEqual(result.repair.add, ["agent: pm-triage", "status: blocked"]);
  assert.match(result.nextAction, /missing owner/i);
});

test("audit queue exposes ownerless ready metadata as repairable instead of empty work", () => {
  const result = auditQueue([issue(10, ["status: ready to pickup"], "# Work\n\n## Acceptance Criteria\n- test")]);
  assert.equal(result.noPickup, true);
  assert.equal(result.repairable.length, 1);
  assert.match(result.nextAction, /repair/i);
  assert.match(renderAuditComment(result), /metadata-repair-required/);
});

test("owner repair is idempotent after the canonical label replacement", () => {
  const body = [
    "# Work",
    "CODEX_WORK_ITEM_KIND: implementation",
    "CODEX_RECONCILE_TO: developer",
    "CODEX_INPUTS_VALIDATED: true",
    "",
    "## Acceptance Criteria",
    "- test",
  ].join("\n");
  const first = auditIssue(issue(11, ["status: ready to pickup"], body));
  const second = auditIssue(issue(11, first.repair.labels, body));
  assert.equal(first.repair.changed, true);
  assert.equal(second.category, "developer-ready");
  assert.equal(second.repair.changed, false);
});

test("ownerless ready items with missing evidence are repaired to PM blocked", () => {
  const body = [
    "# Social reel",
    "- Dependency: none",
    "- Asset resources: prose only",
  ].join("\n");
  const result = auditIssue(issue(12, ["status: ready to pickup", "social: product-reel"], body));
  assert.equal(result.category, "source-asset-blocked");
  assert.deepEqual(result.repair.labels, ["social: product-reel", "agent: pm-triage", "status: blocked"]);
  assert.match(result.reasons.join("\n"), /source asset/i);
});
