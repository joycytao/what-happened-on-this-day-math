#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { loadAnswerKeyTemplate, renderOctoberAnswerKeyPages } from "../src/answer-key-renderer.mjs";

const [inputPath, outputDirectory] = process.argv.slice(2);
if (!inputPath || !outputDirectory) {
  console.error("Usage: node scripts/render-october-answer-key.mjs <monthly-content-v2.json> <output-directory>");
  process.exit(2);
}

const content = JSON.parse(await readFile(inputPath, "utf8"));
const template = await loadAnswerKeyTemplate();
const pages = renderOctoberAnswerKeyPages(content, { template });
const dimensions = template.dimensions ?? { width: 1545, height: 1999 };
await mkdir(outputDirectory, { recursive: true });
for (const page of pages) {
  const filename = `answer-key-${String(page.pageNumber).padStart(2, "0")}.svg`;
  await writeFile(join(outputDirectory, filename), `${page.svg}\n`, "utf8");
}
const manifest = {
  month: content.month,
  pageCount: pages.length,
  expectedPageCount: 6,
  pageDimensions: dimensions,
  template: { filename: template.filename, version: template.version },
  pages: pages.map(({ svg, ...page }) => page),
};
await writeFile(join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outputDirectory, pageCount: pages.length, expectedPageCount: 6 }, null, 2));
