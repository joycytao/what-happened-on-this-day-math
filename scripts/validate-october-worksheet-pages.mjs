#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const [outputDirectory] = process.argv.slice(2);
if (!outputDirectory) {
  console.error("Usage: node scripts/validate-october-worksheet-pages.mjs <output-directory>");
  process.exit(2);
}

const manifest = JSON.parse(await readFile(join(outputDirectory, "manifest.json"), "utf8"));
const expectedTypes = ["reading-passage", "level1", "level2", "level3"];
const errors = [];

if (manifest.month !== 10) errors.push(`manifest month must be 10; found ${manifest.month}`);
if (manifest.pageCount !== 124 || manifest.expectedPageCount !== 124) errors.push("manifest must declare 124 pages");
if (manifest.pages.length !== 124) errors.push(`manifest page list must contain 124 pages; found ${manifest.pages.length}`);

for (let index = 0; index < manifest.pages.length; index += 1) {
  const page = manifest.pages[index];
  const expectedDay = Math.floor(index / 4) + 1;
  const expectedPageType = expectedTypes[index % 4];
  const filename = `${String(page.day).padStart(2, "0")}-${page.pageType}.svg`;
  if (page.pageNumber !== index + 1 || page.day !== expectedDay || page.pageType !== expectedPageType) {
    errors.push(`page ${index + 1} has unexpected identity: ${page.date} ${page.pageType}`);
  }
  if (page.width !== 1545 || page.height !== 2000) errors.push(`${page.date} ${page.pageType} has wrong dimensions`);
  let svg;
  try {
    await access(join(outputDirectory, filename));
    svg = await readFile(join(outputDirectory, filename), "utf8");
  } catch (error) {
    errors.push(`${page.date} ${page.pageType} output is missing: ${error.message}`);
    continue;
  }
  if (!svg.includes('width="1545"') || !svg.includes('height="2000"')) errors.push(`${page.date} ${page.pageType} SVG dimensions are wrong`);
  if (!svg.includes(`data-template-variant="${page.pageType}"`)) errors.push(`${page.date} ${page.pageType} template variant is wrong`);
  if (svg.includes("2000-10-")) errors.push(`${page.date} ${page.pageType} exposes the synthetic renderer year`);
  for (const match of svg.matchAll(/<text\b[^>]*\by="([0-9.]+)"/g)) {
    const baseline = Number(match[1]);
    if (baseline < 0 || baseline > 2000) errors.push(`${page.date} ${page.pageType} has text baseline outside the page: ${baseline}`);
  }
}

if (errors.length > 0) {
  console.error(JSON.stringify({ valid: false, errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ valid: true, month: 10, pageCount: 124, pageDimensions: { width: 1545, height: 2000 }, order: "day then reading-passage, level1, level2, level3" }, null, 2));
