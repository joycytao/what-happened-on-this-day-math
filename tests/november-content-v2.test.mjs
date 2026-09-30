import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateMonthlyContentV2 } from "../src/monthly-content-v2-validation.mjs";

test("November content v2 has 30 month-only records and deterministic answer keys", async () => {
  const content = JSON.parse(await readFile(new URL("../content/monthly/month-11.json", import.meta.url), "utf8"));
  assert.deepEqual(validateMonthlyContentV2(content, { month: 11, dayCount: 30 }), { valid: true, errors: [] });
  assert.equal(content.schemaVersion, "2.0.0");
  assert.equal(content.month, 11);
  assert.deepEqual(content.days.map((day) => day.day), Array.from({ length: 30 }, (_, index) => index + 1));
  assert.ok(content.days.every((day) => day.month === 11 && !Object.hasOwn(day, "date")));
  assert.equal(new Set(content.days.map((day) => day.title)).size, 30);
  for (const day of content.days) {
    for (const level of ["level1", "level2", "level3"]) {
      assert.match(day.mathLevels[level].prompt, /\?/);
      assert.equal(day.answers[level].equation, content.answerKey[level].find((entry) => entry.entryId === `11-${String(day.day).padStart(2, "0")}:${level}`).equation);
    }
  }
});
