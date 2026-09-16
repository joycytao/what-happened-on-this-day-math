import assert from "node:assert/strict";
import test from "node:test";

import { buildOctoberReleaseReport } from "../src/october-release-report.mjs";

test("October release report records the 127-page contract and separate gates", () => {
  const report = buildOctoberReleaseReport({
    content: { valid: true },
    mathematics: { valid: true },
    source: { valid: true },
    layout: { valid: true },
    pdf: { valid: true, actualPageCount: 127 },
  });

  assert.equal(report.valid, true);
  assert.equal(report.expectedPageCount, 127);
  assert.equal(report.actualPageCount, 127);
  assert.deepEqual(report.validation, { content: true, mathematics: true, source: true, layout: true, pdf: true });
});

test("October release report fails when any independent gate fails", () => {
  const report = buildOctoberReleaseReport({
    content: { valid: true },
    mathematics: { valid: false },
    source: { valid: true },
    layout: { valid: true },
    pdf: { valid: true, actualPageCount: 127 },
  });

  assert.equal(report.valid, false);
  assert.equal(report.validation.mathematics, false);
});
