import test from "node:test";
import assert from "node:assert/strict";

import { generateMonthDates } from "../src/calendar-pages.mjs";
import { serializeMonthlyCsv } from "../src/monthly-csv.mjs";
import { validateMonthlyCsv } from "../src/monthly-csv-validation.mjs";
import example from "../examples/monthly-content.example.json" with { type: "json" };

function monthlyContent() {
  const content = structuredClone(example);
  const dates = generateMonthDates(1969, 7);
  const template = content.days[0];
  content.days = dates.map((date) => ({ ...structuredClone(template), date,
    answerKeyEntries: [ `${date}:level1`, `${date}:level2`, `${date}:level3` ]
  }));
  content.answerKey = Object.fromEntries(["level1", "level2", "level3"].map((level) => [level,
    content.days.map((day) => ({ ...structuredClone(example.answerKey[level][0]), date: day.date,
      entryId: `${day.date}:${level}`, level }))
  ]));
  return content;
}

test("validates a complete monthly CSV", () => {
  const result = validateMonthlyCsv(serializeMonthlyCsv(monthlyContent()));
  assert.equal(result.valid, true);
  assert.deepEqual(result.report, { month: "1969-07", expectedDates: 31, rowCount: 31, datesInOrder: true });
});

test("reports duplicate and out-of-order dates", () => {
  const content = monthlyContent();
  const csv = serializeMonthlyCsv(content).replace("1969-07-02", "1969-07-01");
  const result = validateMonthlyCsv(csv);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /dates must be unique/);
  assert.match(result.errors.join("\n"), /dates must be in chronological order/);
});

test("reports row and field-level content and answer errors", () => {
  const content = monthlyContent();
  const validCsv = serializeMonthlyCsv(content);
  const shortStory = validateMonthlyCsv(validCsv.replace(content.days[0].readingPassage, "Too short."));
  assert.equal(shortStory.valid, false);
  assert.match(shortStory.errors.join("\n"), /row 2 Core_Story must contain 150-250 words/);
  const wrongAnswer = validateMonthlyCsv(validCsv.replace('1969-07-02', '1969-07-02').replace('30 - 8 = 22', '30 - 8 = 23'));
  assert.equal(wrongAnswer.valid, false);
  assert.match(wrongAnswer.errors.join("\n"), /row 2 Math_Answer_1 equation evaluates to 22, not 23/);
  const emptyTitle = validateMonthlyCsv(validCsv.replace('The Landing With Seconds to Spare', ''));
  assert.equal(emptyTitle.valid, false);
  assert.match(emptyTitle.errors.join("\n"), /row 2 Title must not be empty/);
});
