import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

for (const gate of ["content", "source", "mathematics"]) test(`Issue 56 November ${gate} report passes independently`, async () => {
  const report = JSON.parse(await readFile(new URL(`../reports/issue-56-november-${gate}-validation.json`, import.meta.url), "utf8"));
  assert.equal(report.valid, true);
  assert.deepEqual(report.errors, []);
});
