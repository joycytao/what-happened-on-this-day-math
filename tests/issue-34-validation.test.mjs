import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateOctoberContent } from "../src/october-content-validation.mjs";

test("October regeneration clears the Issue #34 duplicate-prompt failure", async () => {
  const content = JSON.parse(await readFile(new URL("../content/monthly/month-10.json", import.meta.url), "utf8"));
  const research = JSON.parse(await readFile(new URL("../research/october-events.json", import.meta.url), "utf8"));
  const report = validateOctoberContent(content, research);

  assert.equal(report.valid, true);
  assert.equal(report.content.valid, true);
  assert.equal(report.mathematics.valid, true);
  assert.equal(report.sources.valid, true);
  assert.equal(report.content.errors.length, 0);
});

test("Issue #34 validator catches an independently incorrect equation", async () => {
  const content = JSON.parse(await readFile(new URL("../content/monthly/month-10.json", import.meta.url), "utf8"));
  content.days[0].answers.level1.equation = "1 - 1 = 1";

  const report = validateOctoberContent(content);

  assert.equal(report.mathematics.valid, false);
  assert.match(report.mathematics.errors.join("\n"), /10-01 level1 equation evaluates incorrectly/);
});
