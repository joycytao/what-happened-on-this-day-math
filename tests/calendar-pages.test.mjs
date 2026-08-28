import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculateMonthlyPageCount,
  generateMonthDates,
} from "../src/calendar-pages.mjs";

describe("generateMonthDates", () => {
  it("returns every date in chronological order for a 31-day month", () => {
    const dates = generateMonthDates(2026, 8);

    assert.equal(dates.length, 31);
    assert.equal(dates[0], "2026-08-01");
    assert.equal(dates[30], "2026-08-31");
    assert.deepEqual(dates.slice(0, 3), [
      "2026-08-01",
      "2026-08-02",
      "2026-08-03",
    ]);
    assert.equal(new Set(dates).size, 31);
  });

  it("uses 29 days for leap-year February and 28 days otherwise", () => {
    assert.equal(generateMonthDates(2024, 2).length, 29);
    assert.equal(generateMonthDates(2026, 2).length, 28);
  });
});

describe("calculateMonthlyPageCount", () => {
  it("uses four daily pages plus six answer-key pages", () => {
    assert.deepEqual(calculateMonthlyPageCount(2026, 4), {
      year: 2026,
      month: 4,
      dayCount: 30,
      dailyPagesPerDay: 4,
      answerKeyPages: 6,
      totalPages: 126,
    });

    assert.deepEqual(calculateMonthlyPageCount(2026, 8), {
      year: 2026,
      month: 8,
      dayCount: 31,
      dailyPagesPerDay: 4,
      answerKeyPages: 6,
      totalPages: 130,
    });
  });
});

describe("calendar input validation", () => {
  it("rejects invalid years and months with actionable errors", () => {
    assert.throws(
      () => generateMonthDates(2026, 13),
      /month must be an integer from 1 through 12/,
    );

    assert.throws(
      () => calculateMonthlyPageCount("2026", 8),
      /year must be an integer from 1 through 9999/,
    );
  });
});
