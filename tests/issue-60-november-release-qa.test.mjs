import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("Issue #60 publishes a machine-readable and human-readable release QA report", async () => {
  const json = JSON.parse(await readFile(new URL("../reports/issue-60-november-pdf-qa.json", import.meta.url), "utf8"));
  const markdown = await readFile(new URL("../reports/issue-60-november-pdf-qa.md", import.meta.url), "utf8");
  assert.equal(json.valid, true);
  assert.deepEqual(json.errors, []);
  assert.equal(json.expectedPageCount, 123);
  assert.equal(json.actualPageCount, 123);
  assert.deepEqual(json.sourceCoverage, { dailyDays: 30, dailyPages: 120, answerKeyPages: 3 });
  assert.deepEqual(json.validation, { content: true, mathematics: true, source: true, layout: true, pdf: true });
  assert.match(markdown, /Release status: PASS/);
  assert.match(markdown, /123 pages/);
  assert.match(markdown, /Content, mathematics, source, layout, and PDF gates/);
});
