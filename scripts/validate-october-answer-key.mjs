#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const [outputDirectory] = process.argv.slice(2);
if (!outputDirectory) {
  console.error("Usage: node scripts/validate-october-answer-key.mjs <output-directory>");
  process.exit(2);
}

const manifest = JSON.parse(await readFile(join(outputDirectory, "manifest.json"), "utf8"));
const expectedLevels = ["level1", "level1", "level2", "level2", "level3", "level3"];
const errors = [];
const entryIds = [];

if (manifest.month !== 10) errors.push(`manifest month must be 10; found ${manifest.month}`);
if (manifest.pageCount !== 6 || manifest.expectedPageCount !== 6) errors.push("manifest must declare six pages");
if (manifest.pages.length !== 6) errors.push(`manifest page list must contain six pages; found ${manifest.pages.length}`);
if (manifest.pageDimensions?.width !== 1545 || manifest.pageDimensions?.height !== 1999) errors.push("manifest page dimensions must be 1545x1999");

for (let index = 0; index < manifest.pages.length; index += 1) {
  const page = manifest.pages[index];
  const expectedPage = (index % 2) + 1;
  const filename = `answer-key-${String(index + 1).padStart(2, "0")}.svg`;
  if (page.pageNumber !== index + 1 || page.level !== expectedLevels[index] || page.page !== expectedPage) {
    errors.push(`page ${index + 1} has unexpected identity: ${page.level} page ${page.page}`);
  }
  if (page.width !== 1545 || page.height !== 1999) errors.push(`page ${index + 1} has wrong dimensions`);
  entryIds.push(...page.entryIds);
  let svg;
  try {
    await access(join(outputDirectory, filename));
    svg = await readFile(join(outputDirectory, filename), "utf8");
  } catch (error) {
    errors.push(`page ${index + 1} output is missing: ${error.message}`);
    continue;
  }
  if (!svg.includes('width="1545"') || !svg.includes('height="1999"')) errors.push(`page ${index + 1} SVG dimensions are wrong`);
  if (!svg.includes(`data-template-variant="answer-key" data-template-version="1.0.0" data-level="${page.level}" data-page="${page.page}"`)) errors.push(`page ${index + 1} template identity is wrong`);
  if ((svg.match(/<rect x=/g) || []).length !== 32) errors.push(`page ${index + 1} must contain 32 answer cells`);
  for (const match of svg.matchAll(/<text\b[^>]*\by="([0-9.]+)"/g)) {
    const baseline = Number(match[1]);
    if (baseline < 0 || baseline > 1999) errors.push(`page ${index + 1} has text baseline outside the page: ${baseline}`);
  }
}

const expectedEntryIds = new Set(Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, "0")).flatMap((day) => ["level1", "level2", "level3"].map((level) => `10-${day}:${level}`)));
if (entryIds.length !== 93 || new Set(entryIds).size !== 93 || entryIds.some((entryId) => !expectedEntryIds.has(entryId))) {
  errors.push("answer key entries must cover each October day and level exactly once");
}

if (errors.length > 0) {
  console.error(JSON.stringify({ valid: false, errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ valid: true, month: 10, pageCount: 6, pageDimensions: { width: 1545, height: 1999 }, order: "level1 pages, level2 pages, level3 pages" }, null, 2));
