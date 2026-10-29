import test from "node:test";
import assert from "node:assert/strict";

import { buildMonthlyProductionQueuePlan, isMonthlyContextReadyIssue } from "../scripts/build-monthly-production-plan.mjs";

const validInput = { month: "2027-01", days: Array.from({ length: 31 }, (_, index) => ({ date: `1/${index + 1}`, title: `Title ${index + 1}`, context: `Context ${index + 1}`, questions: { level1: { prompt: "p", answer: "a" }, level2: { prompt: "p", answer: "a" }, level3: { prompt: "p", answer: "a" } } })) };
const issue = { number: 201, state: "open", body: "<!-- monthly-context: 2027-01 -->", labels: [{ name: "status: ready to pickup" }] };
const comments = [{ id: 9, body: `<!-- monthly-content-input: 2027-01 -->\n\`\`\`json\n${JSON.stringify(validInput)}\n\`\`\`` }];
const identity = { runUrl: "https://github.com/example/actions/runs/1", project: { owner: "joycytao", number: 2 } };

test("only a ready monthly context Issue is actionable", () => {
  assert.equal(isMonthlyContextReadyIssue(issue), true);
  assert.equal(isMonthlyContextReadyIssue({ ...issue, labels: [{ name: "status: pending review" }] }), false);
  assert.equal(isMonthlyContextReadyIssue({ ...issue, body: "unrelated" }), false);
});

test("valid ready input produces parent and nine child Issues", () => {
  const result = buildMonthlyProductionQueuePlan({ issue, comments, ...identity });
  assert.equal(result.actionable, true);
  assert.equal(result.valid, true);
  assert.equal(result.plan.parent.key, "monthly-parent");
  assert.equal(result.plan.issues.length, 9);
  assert.match(result.plan.parent.body, /Context input Issue: #201/);
});

test("invalid input is actionable but creates no children", () => {
  const result = buildMonthlyProductionQueuePlan({ issue, comments: [{ id: 10, body: "<!-- monthly-content-input: 2027-01 -->\nnot json" }], ...identity });
  assert.equal(result.actionable, true);
  assert.equal(result.valid, false);
  assert.equal(result.plan, null);
  assert.match(result.errors.join("\n"), /fenced block/);
});

test("unrelated ready Issue is a no-op", () => {
  const result = buildMonthlyProductionQueuePlan({ issue: { ...issue, body: "<!-- other: marker -->" }, comments, ...identity });
  assert.deepEqual(result, { actionable: false, valid: false, errors: [], plan: null });
});
