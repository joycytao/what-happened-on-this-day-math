import test from "node:test";
import assert from "node:assert/strict";

import { validateMonthlyContextSource } from "../scripts/validate-monthly-context-source.mjs";

const input = {
  month: "2026-12",
  days: Array.from({ length: 31 }, (_, index) => ({
    date: `12/${index + 1}`,
    title: `Event ${index + 1} (1900)`,
    context: `Context ${index + 1}`,
    questions: {
      level1: { prompt: "one", answer: "1" },
      level2: { prompt: "two", answer: "2" },
      level3: { prompt: "three", answer: "3" },
    },
  })),
};

function issue() {
  return { number: 210, body: "<!-- monthly-context: 2026-12 -->" };
}

function comments(value = input) {
  return [{ id: 6474858797, body: `<!-- monthly-content-input: 2026-12 -->\n\`\`\`json\n${JSON.stringify(value)}\n\`\`\`` }];
}

test("validates the real monthly context contract without requiring Project metadata", () => {
  const report = validateMonthlyContextSource({ issue: issue(), comments: comments() });

  assert.equal(report.valid, true);
  assert.equal(report.month, "2026-12");
  assert.equal(report.expectedDays, 31);
  assert.equal(report.actualDays, 31);
  assert.equal(report.inputCommentId, 6474858797);
  assert.equal(report.entries[0].eventYear, 1900);
  assert.equal(report.sourceInput.status, "complete");
});

test("rejects a context issue whose payload has fewer than the calendar days", () => {
  const broken = { ...input, days: input.days.slice(0, 30) };
  const report = validateMonthlyContextSource({ issue: issue(), comments: comments(broken) });

  assert.equal(report.valid, false);
  assert.equal(report.expectedDays, 31);
  assert.match(report.errors.join("\n"), /expected 31 days/i);
});
