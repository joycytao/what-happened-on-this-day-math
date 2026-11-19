import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { PAGE_TYPES, renderNovemberWorksheetPages } from "../src/monthly-worksheet-renderer.mjs";

test("November renderer emits 120 pages in day/module order", async () => {
  const content = JSON.parse(await readFile(new URL("../content/monthly/month-11.json", import.meta.url), "utf8"));
  const pages = await renderNovemberWorksheetPages(content);

  assert.equal(pages.length, 120);
  assert.deepEqual(pages.slice(0, 4).map((page) => [page.date, page.pageType]), [
    ["11-01", "reading-passage"],
    ["11-01", "level1"],
    ["11-01", "level2"],
    ["11-01", "level3"],
  ]);
  assert.deepEqual(pages.slice(-4).map((page) => [page.date, page.pageType]), [
    ["11-30", "reading-passage"],
    ["11-30", "level1"],
    ["11-30", "level2"],
    ["11-30", "level3"],
  ]);
  assert.ok(pages.every((page) => page.width === 1545 && page.height === 2000));
  assert.ok(pages.every((page) => page.svg.includes(`data-template-variant="${page.pageType}"`)));
  assert.ok(pages.every((page) => !page.svg.includes("2000-11-")));
  for (let day = 1; day <= 30; day += 1) {
    assert.deepEqual(pages.slice((day - 1) * 4, day * 4).map((page) => page.pageType), PAGE_TYPES);
  }
});
