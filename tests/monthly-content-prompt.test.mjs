import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateExampleDrivenContent } from "../src/reusable-monthly-content-validation.mjs";

test("reusable monthly prompt defines the example-driven question contract", async () => {
  const prompt = await readFile(new URL("../docs/reusable-monthly-content-prompt.md", import.meta.url), "utf8");
  for (const phrase of [
    "examples/oct-content-example.rtf",
    "examples/monthly-content.example.json",
    "English student-facing output",
    "one Level 1 question",
    "one Level 2 question",
    "one Level 3 question",
    "historical anchor",
    "hypothetical",
    "multiple subquestions",
    "duplicate prompts",
  ]) assert.match(prompt, new RegExp(phrase.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "i"), `missing prompt requirement: ${phrase}`);
});

function fixture() {
  const levels = {
    level1: { prompt: "A Ford Model T has 4 tires. How many tires do 3 cars need?", numbersUsed: [{ value: 4, source: "historical anchor" }, { value: 3, source: "hypothetical classroom quantity" }] },
    level2: { prompt: "The Ford factory assembles 12 cars each hour. How many cars in 8 hours?", numbersUsed: [{ value: 12, source: "historical anchor" }, { value: 8, source: "hypothetical classroom quantity" }] },
    level3: { prompt: "The Model T sold for $850 in 1908. How many months of $50 savings are needed?", numbersUsed: [{ value: 850, source: "historical anchor" }, { value: 50, source: "hypothetical classroom quantity" }] },
  };
  return { days: [{ month: 10, day: 1, readingPassage: "A Ford Model T used 4 tires and sold for 850 dollars in 1908.", mathLevels: levels, answers: { level1: { equation: "4 * 3 = 12" }, level2: { equation: "12 * 8 = 96" }, level3: { equation: "850 / 50 = 17" } } }] };
}

test("example-driven validator accepts grounded prompts and all equations", () => {
  assert.deepEqual(validateExampleDrivenContent(fixture()), { valid: true, errors: [] });
});

test("example-driven validator rejects duplicate generic prompts", () => {
  const invalid = fixture();
  invalid.days.push(structuredClone(invalid.days[0]));
  invalid.days[1].day = 2;
  invalid.days[1].mathLevels.level1.prompt = "Use the same numbers in this story. How many?";
  invalid.days[1].mathLevels.level2.prompt = invalid.days[0].mathLevels.level2.prompt;
  const report = validateExampleDrivenContent(invalid);
  assert.equal(report.valid, false);
  assert.match(report.errors.join("\n"), /duplicated/);
  assert.match(report.errors.join("\n"), /generic scaffolding/);
});
