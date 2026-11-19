import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { validateMonthlyMath } from "../src/monthly-math-validation.mjs";

const content = JSON.parse(await readFile("data/monthly/2026-12-content.json", "utf8"));
const csv = await readFile("history_today_2026-12.csv", "utf8");
const source = JSON.parse(await readFile("data/monthly/2026-12-source.json", "utf8"));

test("validates the complete December math/content contract", () => {
  const result = validateMonthlyMath({ content, csv, source });
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.deepEqual(result.report, {
    month: "2026-12",
    expectedDays: 31,
    contentDays: 31,
    csvRows: 31,
    sourceDays: 31,
    equationsChecked: 218,
    studentFacingFieldsChecked: 155,
    provenanceMappingsChecked: 31,
  });
});

test("rejects an unbalanced intermediate equation", () => {
  const changed = structuredClone(content);
  changed.days[0].answers.level3.work = changed.days[0].answers.level3.work.replace("50/100=0.5", "50/100=0.6");
  const result = validateMonthlyMath({ content: changed, csv, source });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /does not balance/);
});

test("rejects CJK text in student-facing fields", () => {
  const changed = structuredClone(content);
  changed.days[0].title = "英法海底隧道";
  const result = validateMonthlyMath({ content: changed, csv, source });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /title contains non-English CJK text/);
});
