import test from "node:test";
import assert from "node:assert/strict";

import { buildDispositionReport, classifyIssue } from "../src/issue-triage.mjs";

test("stable marker evidence classifies a duplicate with replacement", () => {
  const result = classifyIssue({ number: 12, title: "Duplicate", state: "OPEN", body: "<!-- monthly-production:2027-01:tpt -->", labels: [] }, {
    markerOwners: { "monthly-production:2027-01:tpt": 7 },
  });
  assert.equal(result.disposition, "close_duplicate");
  assert.equal(result.replacement.issueNumber, 7);
  assert.match(result.reason, /stable marker/);
});

test("explicit backlog evidence allows backlog classification", () => {
  const result = classifyIssue({ number: 14, title: "Deferred idea", state: "OPEN", body: "Needs later review", labels: [] }, { backlogNumbers: [14] });
  assert.equal(result.disposition, "backlog");
  assert.deepEqual(result.evidence, ["context.backlogNumbers includes issue #14"]);
});

test("blocked dependency is never downgraded to backlog", () => {
  const result = classifyIssue({ number: 15, title: "Blocked", state: "OPEN", body: "CODEX_DEPENDS_ON_WEEK:1", labels: ["status: blocked"] }, { backlogNumbers: [15] });
  assert.equal(result.disposition, "blocked");
  assert.match(result.reason, /dependency/);
});

test("closed historical issues are preserved", () => {
  const result = classifyIssue({ number: 16, title: "Historical", state: "CLOSED", body: "Completed", labels: [] }, {});
  assert.equal(result.disposition, "preserve_closed");
  assert.match(result.reason, /closed/);
});

test("ambiguous open issues require review and age is not evidence", () => {
  const result = classifyIssue({ number: 17, title: "Old issue", state: "OPEN", body: "No disposition evidence", labels: [], updatedAt: "2020-01-01T00:00:00Z" }, { now: "2026-10-27T00:00:00Z" });
  assert.equal(result.disposition, "review_required");
  assert.doesNotMatch(result.reason, /old|age/i);
});

test("disposition report is explicit and human-reviewable", () => {
  const report = buildDispositionReport([{ number: 1, title: "One", state: "CLOSED", body: "", labels: [] }], {});
  assert.equal(report.requiresHumanReview, true);
  assert.equal(report.dispositions[0].disposition, "preserve_closed");
  assert.equal(report.dispositions[0].issue.number, 1);
});
