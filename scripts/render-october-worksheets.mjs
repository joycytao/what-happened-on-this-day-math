#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { renderOctoberWorksheetPages } from "../src/monthly-worksheet-renderer.mjs";

const [inputPath, outputDirectory] = process.argv.slice(2);
if (!inputPath || !outputDirectory) {
  console.error("Usage: node scripts/render-october-worksheets.mjs <monthly-content-v2.json> <output-directory>");
  process.exit(2);
}

const content = JSON.parse(await readFile(inputPath, "utf8"));
const pages = await renderOctoberWorksheetPages(content);
await mkdir(outputDirectory, { recursive: true });
for (const page of pages) {
  const filename = `${String(page.day).padStart(2, "0")}-${page.pageType}.svg`;
  await writeFile(join(outputDirectory, filename), `${page.svg}\n`, "utf8");
}
const manifest = {
  month: 10,
  pageCount: pages.length,
  expectedPageCount: 31 * 4,
  pageDimensions: { width: 1545, height: 2000 },
  pages: pages.map(({ svg, ...page }) => page),
};
await writeFile(join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outputDirectory, pageCount: pages.length, expectedPageCount: 124 }, null, 2));
