import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMonthlyContextIssue,
  isThirdMondayAt0900Central,
} from "../scripts/build-monthly-context-issue.mjs";

test("accepts the third Monday at 09:00 Central across DST", () => {
  assert.equal(isThirdMondayAt0900Central("2026-11-16T15:00:00Z"), true);
  assert.equal(isThirdMondayAt0900Central("2027-03-15T14:00:00Z"), true);
});

test("rejects Mondays outside the third-Monday window and wrong hours", () => {
  assert.equal(isThirdMondayAt0900Central("2026-11-09T15:00:00Z"), false);
  assert.equal(isThirdMondayAt0900Central("2026-11-23T15:00:00Z"), false);
  assert.equal(isThirdMondayAt0900Central("2026-11-16T16:00:00Z"), false);
});

test("builds a deterministic January context issue after a November run", () => {
  const plan = buildMonthlyContextIssue({
    now: "2026-11-16T15:00:00Z",
    repository: "joycytao/what-happened-on-this-day-math",
    runUrl: "https://github.com/joycytao/what-happened-on-this-day-math/actions/runs/123",
  });

  assert.equal(plan.targetMonth, "2027-01");
  assert.equal(plan.marker, "<!-- monthly-context: 2027-01 -->");
  assert.equal(plan.title, "[Monthly context] 2027-01");
  assert.deepEqual(plan.labels, ["type: feature", "content:monthly", "status: pending review"]);
  assert.match(plan.body, /```json/);
  assert.match(plan.body, /status: ready to pickup/);
  assert.match(plan.body, /Expected calendar days: 31/);
  assert.match(plan.body, /actions\/runs\/123/);
});
