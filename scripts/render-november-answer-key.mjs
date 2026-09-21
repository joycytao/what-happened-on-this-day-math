#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { loadAnswerKeyTemplate, renderNovemberAnswerKeyPages } from "../src/answer-key-renderer.mjs";

const [inputPath, outputDirectory] = process.argv.slice(2);
if (!inputPath || !outputDirectory) {
  console.error("Usage: node scripts/render-november-answer-key.mjs <monthly-content-v2.json> <output-directory>");
  process.exit(2);
}

const content = JSON.parse(await readFile(inputPath, "utf8"));
const template = await loadAnswerKeyTemplate();
const pages = renderNovemberAnswerKeyPages(content, { template });
const expectedDayCount = new Date(Date.UTC(2000, 11, 0)).getUTCDate();
const expectedPageCount = 3;
if (pages.length !== expectedPageCount || content.answerKey.level1.length !== expectedDayCount || content.answerKey.level2.length !== expectedDayCount || content.answerKey.level3.length !== expectedDayCount) {
  throw new Error(`November Answer Key must contain ${expectedDayCount} entries on each of ${expectedPageCount} pages`);
}
await mkdir(outputDirectory, { recursive: true });
for (const page of pages) {
  const filename = `answer-key-${String(page.pageNumber).padStart(2, "0")}.svg`;
  await writeFile(join(outputDirectory, filename), `${page.svg}\n`, "utf8");
}
const manifest = {
  month: 11,
  pageCount: pages.length,
  expectedPageCount,
  expectedDayCount,
  pageDimensions: { width: 1545, height: 1999 },
  template: { filename: template.filename, version: template.version },
  pages: pages.map(({ svg, ...page }) => page),
};
await writeFile(join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outputDirectory, pageCount: pages.length, expectedPageCount, expectedDayCount }, null, 2));
