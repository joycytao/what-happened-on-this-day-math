import test from "node:test";
import assert from "node:assert/strict";

import { buildOctoberReadingPassages, validateReadingPassage } from "../src/reading-passage-quality.mjs";

test("October passage generator returns 31 readable, event-grounded passages", () => {
  const days = buildOctoberReadingPassages();
  assert.equal(days.length, 31);
  assert.equal(new Set(days.map(({ hook }) => hook)).size, 31);
  assert.ok(days.every(({ hook }) => !hook.includes("What clue would you check first")));
  for (const passage of days) {
    const report = validateReadingPassage(passage);
    assert.equal(report.valid, true, `${passage.day}: ${report.errors.join("; ")}`);
  }
});

test("quality validator rejects generic repeated filler", () => {
  const report = validateReadingPassage({
    day: 1,
    title: "A history story",
    readingPassage: "Today we will learn an important and interesting story. This story is important and interesting. Students can learn many things from this important story. History tells us what happened. The worksheet gives us numbers to practice. Read the passage and solve the questions carefully. Read the passage and solve the questions carefully. Read the passage and solve the questions carefully. Read the passage and solve the questions carefully. Read the passage and solve the questions carefully. Read the passage and solve the questions carefully. Read the passage and solve the questions carefully. Read the passage and solve the questions carefully. Read the passage and solve the questions carefully. Read the passage and solve the questions carefully. Read the passage and solve the questions carefully. Read the passage and solve the questions carefully. Read the passage and solve the questions carefully. Read the passage and solve the questions carefully. Read the passage and solve the questions carefully.",
    trivia: ["The event happened on October 1."],
  });
  assert.equal(report.valid, false);
  assert.match(report.errors.join(" "), /repeated|filler|sentence/i);
});
