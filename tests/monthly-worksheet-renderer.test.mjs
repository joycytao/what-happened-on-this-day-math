import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { PAGE_TYPES, renderOctoberWorksheetPages } from "../src/monthly-worksheet-renderer.mjs";

test("monthly worksheet renderer emits 124 month/day pages in daily module order", async () => {
  const content = JSON.parse(await readFile(new URL("../content/monthly/month-10.json", import.meta.url), "utf8"));
  const pages = await renderOctoberWorksheetPages(content);

  assert.equal(pages.length, 124);
  assert.deepEqual(pages.slice(0, 4).map((page) => [page.date, page.pageType]), [
    ["10-01", "reading-passage"],
    ["10-01", "level1"],
    ["10-01", "level2"],
    ["10-01", "level3"],
  ]);
  assert.deepEqual(pages.slice(-4).map((page) => [page.date, page.pageType]), [
    ["10-31", "reading-passage"],
    ["10-31", "level1"],
    ["10-31", "level2"],
    ["10-31", "level3"],
  ]);
  assert.ok(pages.every((page) => page.width === 1545 && page.height === 2000));
  assert.ok(pages.every((page) => page.svg.includes(`data-template-variant="${page.pageType}"`)));
  assert.ok(pages.every((page) => !page.svg.includes("2000-10-")));
  for (let day = 1; day <= 31; day += 1) {
    assert.deepEqual(pages.slice((day - 1) * 4, day * 4).map((page) => page.pageType), PAGE_TYPES);
  }
});

test("renderer failures identify the month/day, page type, and reason", async () => {
  const content = JSON.parse(await readFile(new URL("../content/monthly/month-10.json", import.meta.url), "utf8"));
  const broken = structuredClone(content);
  broken.days[0].mathLevels.level1.prompt = "A deliberately overlong prompt ".repeat(20);

  await assert.rejects(
    () => renderOctoberWorksheetPages(broken),
    /failed to render 10-01 level1: level1 prompt exceeds the template text area/,
  );
});
