#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { renderNovemberWorksheetPages } from "../src/monthly-worksheet-renderer.mjs";

const [inputPath, outputDirectory] = process.argv.slice(2);
if (!inputPath || !outputDirectory) {
  console.error("Usage: node scripts/render-november-worksheets.mjs <monthly-content-v2.json> <output-directory>");
  process.exit(2);
}

const content = JSON.parse(await readFile(inputPath, "utf8"));
const pages = await renderNovemberWorksheetPages(content);
const expectedDayCount = new Date(Date.UTC(2000, 11, 0)).getUTCDate();
const expectedPageCount = expectedDayCount * 4;
if (pages.length !== expectedPageCount) throw new Error(`November must render ${expectedPageCount} pages; found ${pages.length}`);
await mkdir(outputDirectory, { recursive: true });
for (const page of pages) {
  const filename = `${String(page.day).padStart(2, "0")}-${page.pageType}.svg`;
  await writeFile(join(outputDirectory, filename), `${page.svg}\n`, "utf8");
}
const manifest = {
  month: 11,
  pageCount: pages.length,
  expectedDayCount,
  expectedPageCount,
  pageDimensions: { width: 1545, height: 2000 },
  pages: pages.map(({ svg, ...page }) => page),
};
await writeFile(join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outputDirectory, pageCount: pages.length, expectedDayCount, expectedPageCount }, null, 2));
