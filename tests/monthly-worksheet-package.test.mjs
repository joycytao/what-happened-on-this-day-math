import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { renderMonthlyWorksheetPackage } from "../src/monthly-worksheet-package.mjs";

const content = JSON.parse(await readFile(new URL("../data/monthly/2026-12-content.json", import.meta.url), "utf8"));

test("renders December daily pages and answer keys in canonical order", async () => {
  const result = await renderMonthlyWorksheetPackage(content);
  assert.equal(result.pageCount, 127);
  assert.deepEqual(result.pages.slice(0, 4).map((page) => page.pageType), ["reading-passage", "level1", "level2", "level3"]);
  assert.deepEqual(result.pages.slice(-3).map((page) => page.level), ["level1", "level2", "level3"]);
  assert.ok(result.pages.every((page) => page.pageType === "answer-key" ? page.height === 1999 : page.height === 2000));
  assert.equal(result.pages.filter((page) => page.pageType === "answer-key").flatMap((page) => page.entryIds).length, 93);
});

test("render output is deterministic", async () => {
  const first = await renderMonthlyWorksheetPackage(content);
  const second = await renderMonthlyWorksheetPackage(content);
  assert.deepEqual(first.manifest, second.manifest);
});
