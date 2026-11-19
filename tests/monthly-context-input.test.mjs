import test from "node:test";
import assert from "node:assert/strict";

import {
  expectedDaysInMonth,
  parseMonthlyContextComment,
  targetMonthFromSchedulerDate,
} from "../src/monthly-context-input.mjs";

const dayTemplate = {
  title: "第一天",
  context: "中文 context",
  questions: {
    level1: { prompt: "一加一是多少？", answer: "2" },
    level2: { prompt: "二乘三是多少？", answer: "6" },
    level3: { prompt: "四除二是多少？", answer: "2" },
  },
};

const validInput = {
  month: "2026-12",
  days: Array.from({ length: 31 }, (_, index) => ({ ...dayTemplate, date: `12/${index + 1}` })),
};

test("parses the marked JSON comment and preserves Chinese input", () => {
  const result = parseMonthlyContextComment([
    { id: 7, body: "unrelated" },
    { id: 8, body: `<!-- monthly-content-input: 2026-12 -->\n\`\`\`json\n${JSON.stringify(validInput)}\n\`\`\`` },
  ]);

  assert.equal(result.valid, true);
  assert.equal(result.commentId, 8);
  assert.equal(result.input.days[0].context, "中文 context");
});

test("rejects a December input with missing calendar days", () => {
  const input = { ...validInput, days: validInput.days.slice(0, 30) };
  const result = parseMonthlyContextComment([
    { id: 1, body: `<!-- monthly-content-input: 2026-12 -->\n\`\`\`json\n${JSON.stringify(input)}\n\`\`\`` },
  ]);

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /expected 31 days/i);
});

test("rejects duplicate dates", () => {
  const input = { ...validInput, days: [...validInput.days.slice(0, 30), { ...validInput.days[0], date: "12/1" }] };
  const result = parseMonthlyContextComment([
    { id: 1, body: `<!-- monthly-content-input: 2026-12 -->\n\`\`\`json\n${JSON.stringify(input)}\n\`\`\`` },
  ]);

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /duplicate date/i);
});

test("rejects malformed JSON and missing levels", () => {
  const malformed = parseMonthlyContextComment([
    { id: 1, body: "<!-- monthly-content-input: 2026-12 -->\n```json\n{\n```" },
  ]);
  assert.equal(malformed.valid, false);
  assert.match(malformed.errors.join("\n"), /valid JSON/i);

  const missingLevel = { ...validInput, days: validInput.days.map((day, index) => index === 0 ? { ...day, questions: { level1: day.questions.level1 } } : day) };
  const incomplete = parseMonthlyContextComment([
    { id: 2, body: `<!-- monthly-content-input: 2026-12 -->\n\`\`\`json\n${JSON.stringify(missingLevel)}\n\`\`\`` },
  ]);
  assert.equal(incomplete.valid, false);
  assert.match(incomplete.errors.join("\n"), /level2/i);
});

test("computes the month two cycles ahead across a year boundary", () => {
  assert.deepEqual(targetMonthFromSchedulerDate("2026-11-16T09:00:00-06:00"), {
    year: 2027,
    month: 1,
    isoMonth: "2027-01",
  });
  assert.equal(expectedDaysInMonth(2026, 12), 31);
});
