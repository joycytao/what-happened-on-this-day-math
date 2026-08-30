import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

import { validateContent } from "../src/content-validation.mjs";

const example = JSON.parse(
  await readFile(new URL("../examples/monthly-content.example.json", import.meta.url), "utf8"),
);

describe("validateContent", () => {
  it("accepts the canonical example", () => {
    assert.deepEqual(validateContent(example), { valid: true, errors: [] });
  });

  it("reports missing fields, passage length, and unsupported themes", () => {
    const invalid = structuredClone(example);
    invalid.days[0].title = "";
    invalid.days[0].readingPassage = "Too short.";
    invalid.days[0].theme = "politics";

    const result = validateContent(invalid);

    assert.equal(result.valid, false);
    assert.match(result.errors.join("\n"), /days\[0\]\.title must not be empty/);
    assert.match(result.errors.join("\n"), /days\[0\]\.readingPassage must contain 150-250 words/);
    assert.match(result.errors.join("\n"), /days\[0\]\.theme must use an approved theme/);
  });

  it("checks level-specific math constraints and story numbers", () => {
    const invalid = structuredClone(example);
    invalid.days[0].mathLevels.level1.skill = "multiplication";
    invalid.days[0].mathLevels.level1.numbersUsed[0].value = 999;
    invalid.days[0].mathLevels.level1.numbersUsed[0].source = "Historical source.";

    const result = validateContent(invalid);

    assert.equal(result.valid, false);
    assert.match(result.errors.join("\n"), /level1 must use addition or subtraction/);
    assert.match(result.errors.join("\n"), /numbersUsed\[0\] value 999 is not present in the passage/);
  });

  it("rejects a Level 1 number outside the intended range", () => {
    const invalid = structuredClone(example);
    invalid.days[0].mathLevels.level1.numbersUsed[0].value = 51;
    invalid.days[0].mathLevels.level1.numbersUsed[0].source = "Problem scenario.";

    const result = validateContent(invalid);

    assert.equal(result.valid, false);
    assert.match(result.errors.join("\n"), /level1 numbers must be within 50/);
  });

  it("recomputes every answer and catches mismatches", () => {
    const invalid = structuredClone(example);
    invalid.days[0].answers.level2.equation = "3 x 4 = 13";
    invalid.days[0].answers.level2.finalAnswer = "13 snacks";

    const result = validateContent(invalid);

    assert.equal(result.valid, false);
    assert.match(result.errors.join("\n"), /answers\.level2 equation evaluates to 12, not 13/);
    assert.match(result.errors.join("\n"), /answers\.level2\.finalAnswer must include computed result 12/);
  });
});
