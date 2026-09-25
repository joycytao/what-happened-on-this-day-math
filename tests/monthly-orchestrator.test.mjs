import assert from "node:assert/strict";
import test from "node:test";

import { buildMonthlyContract, parseMonthlyArguments } from "../src/monthly-orchestrator.mjs";

test("month-only orchestration derives the October 127-page contract", () => {
  const args = parseMonthlyArguments(["--month", "10"]);
  assert.equal(args.month, 10);
  assert.deepEqual(buildMonthlyContract(10), {
    month: 10,
    dayCount: 31,
    dailyPagesPerDay: 4,
    answerKeyPages: 3,
    totalPages: 127,
  });
});

test("month-only orchestration rejects a missing month argument", () => {
  assert.throws(() => parseMonthlyArguments([]), /--month must be an integer from 1 through 12/);
});

test("the same calendar contract predicts November's 124-page packet", () => {
  assert.deepEqual(buildMonthlyContract(11), {
    month: 11,
    dayCount: 30,
    dailyPagesPerDay: 4,
    answerKeyPages: 3,
    totalPages: 124,
  });
});
