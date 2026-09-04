import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateMonthlyContentV2 } from "../src/monthly-content-v2-validation.mjs";

test("October content v2 is month-only, deterministic, and source-linked", async () => {
  const content = JSON.parse(await readFile(new URL("../content/monthly/month-10.json", import.meta.url), "utf8"));
  const result = validateMonthlyContentV2(content);

  assert.deepEqual(result, { valid: true, errors: [] });
  assert.equal(content.schemaVersion, "2.0.0");
  assert.equal(content.month, 10);
  assert.equal(content.days.length, 31);
  assert.deepEqual(content.days.map((day) => day.day), Array.from({ length: 31 }, (_, index) => index + 1));
  assert.ok(content.days.every((day) => day.month === 10 && !Object.hasOwn(day, "date")));
  assert.ok(content.days.every((day) => Object.hasOwn(day, "eventYear")));
  assert.ok(content.answerKey.level1.every((entry) => /^10-\d{2}:level1$/.test(entry.entryId)));
  for (const day of content.days) {
    for (const level of ["level1", "level2", "level3"]) {
      for (const number of day.mathLevels[level].numbersUsed) {
        assert.match(day.readingPassage, new RegExp(`\\b${number.value}\\b`), `${day.day}/${level} number missing from passage`);
      }
      const entry = content.answerKey[level].find((candidate) => candidate.entryId === `10-${String(day.day).padStart(2, "0")}:${level}`);
      assert.deepEqual(entry, { entryId: entry.entryId, date: entry.date, level, ...day.answers[level] });
    }
  }
});

test("monthly content v2 schema is valid JSON and declares the breaking version", async () => {
  const schema = JSON.parse(await readFile(new URL("../schemas/monthly-content-v2.schema.json", import.meta.url), "utf8"));
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.properties.schemaVersion.const, "2.0.0");
  assert.deepEqual(schema.$defs.day.required.slice(0, 3), ["month", "day", "eventYear"]);
});
