import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

import { buildMonthlyContextIssue } from "../scripts/build-monthly-context-issue.mjs";
import { parseMonthlyContextComment } from "../src/monthly-context-input.mjs";

const fixture = JSON.parse(fs.readFileSync(new URL("../examples/monthly-context-input.example.json", import.meta.url), "utf8"));

function makeInput(month, dayCount) {
  return {
    month,
    days: Array.from({ length: dayCount }, (_, index) => ({
      date: `${Number(month.slice(5))}/${index + 1}`,
      title: `Day ${index + 1}`,
      context: "中文 context",
      questions: {
        level1: { prompt: "一加一？", answer: "2" },
        level2: { prompt: "二乘三？", answer: "6" },
        level3: { prompt: "四除二？", answer: "2" },
      },
    })),
  };
}

for (const item of fixture.fixtures) {
  test(`accepts the ${item.dayCount}-day fixture ${item.month}`, () => {
    const input = makeInput(item.month, item.dayCount);
    const result = parseMonthlyContextComment([
      { id: item.month, body: `<!-- monthly-content-input: ${item.month} -->\n\`\`\`json\n${JSON.stringify(input)}\n\`\`\`` },
    ]);
    assert.equal(result.valid, true);
  });
}

test("re-running the scheduler produces the same target marker and issue identity", () => {
  const first = buildMonthlyContextIssue({ now: "2026-10-19T14:00:00Z", repository: "owner/repo", runUrl: "run-1" });
  const second = buildMonthlyContextIssue({ now: "2026-10-19T14:00:00Z", repository: "owner/repo", runUrl: "run-1" });
  assert.equal(first.marker, second.marker);
  assert.equal(first.targetMonth, second.targetMonth);
  assert.equal(first.title, second.title);
});
