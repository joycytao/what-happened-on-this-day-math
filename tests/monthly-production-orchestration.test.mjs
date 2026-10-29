import test from "node:test";
import assert from "node:assert/strict";

import { buildMonthlyProductionPlan } from "../src/monthly-production-orchestration.mjs";

const input = {
  month: "2027-01",
  inputIssue: 201,
  inputArtifact: "issue-comment:201:comment-9",
  runUrl: "https://github.com/joycytao/what-happened-on-this-day-math/actions/runs/9",
  project: { owner: "joycytao", number: 2 },
};

test("monthly production plan creates one parent and nine ordered workstreams", () => {
  const plan = buildMonthlyProductionPlan(input);

  assert.equal(plan.valid, true);
  assert.equal(plan.parent.key, "monthly-parent");
  assert.deepEqual(plan.issues.map((issue) => issue.key), [
    "context-source",
    "content-conversion",
    "math-validation",
    "worksheet-answer-key",
    "cover",
    "follow-up-pages",
    "release-qa",
    "landing-page",
    "tpt",
  ]);
  assert.equal(plan.issues.length, 9);
});

test("production dependencies gate release and run landing/TPT in parallel", () => {
  const plan = buildMonthlyProductionPlan(input);
  const byKey = Object.fromEntries(plan.issues.map((issue) => [issue.key, issue]));

  assert.deepEqual(byKey["content-conversion"].blockedBy, ["context-source"]);
  assert.deepEqual(byKey["math-validation"].blockedBy, ["content-conversion"]);
  assert.deepEqual(byKey["worksheet-answer-key"].blockedBy, ["math-validation"]);
  assert.deepEqual(byKey.cover.blockedBy, ["math-validation"]);
  assert.deepEqual(byKey["follow-up-pages"].blockedBy, ["math-validation"]);
  assert.deepEqual(byKey["release-qa"].blockedBy, ["worksheet-answer-key", "cover", "follow-up-pages"]);
  assert.deepEqual(byKey["landing-page"].blockedBy, ["release-qa"]);
  assert.deepEqual(byKey.tpt.blockedBy, ["release-qa"]);
  assert.deepEqual(plan.dependencies, [
    ["context-source", "content-conversion"],
    ["content-conversion", "math-validation"],
    ["math-validation", "worksheet-answer-key"],
    ["math-validation", "cover"],
    ["math-validation", "follow-up-pages"],
    ["worksheet-answer-key", "release-qa"],
    ["cover", "release-qa"],
    ["follow-up-pages", "release-qa"],
    ["release-qa", "landing-page"],
    ["release-qa", "tpt"],
  ]);
});

test("plan markers and issue bodies are deterministic", () => {
  const first = buildMonthlyProductionPlan(input);
  const second = buildMonthlyProductionPlan(input);
  assert.deepEqual(first, second);
  assert.match(first.parent.marker, /monthly-production:2027-01:parent/);
  assert.match(first.issues[0].body, /Source context Issue: #201/);
  assert.ok(first.issues[0].labels.includes("status: ready to pickup"));
  assert.ok(first.issues[1].labels.includes("status: blocked"));
});

test("rejects incomplete production identity", () => {
  const result = buildMonthlyProductionPlan({ month: "2027-01" });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /inputIssue is required/);
});
