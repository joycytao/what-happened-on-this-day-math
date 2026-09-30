#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

import { validateSvgTextGeometry } from "../src/svg-layout-validation.mjs";

const [outputDirectory] = process.argv.slice(2);
if (!outputDirectory) {
  console.error("Usage: node scripts/validate-november-answer-key.mjs <output-directory>");
  process.exit(2);
}

const manifest = JSON.parse(await readFile(join(outputDirectory, "manifest.json"), "utf8"));
const expectedLevels = ["level1", "level2", "level3"];
const expectedDayCount = new Date(Date.UTC(2000, 11, 0)).getUTCDate();
const errors = [];
const entryIds = [];

if (manifest.month !== 11) errors.push(`manifest month must be 11; found ${manifest.month}`);
if (manifest.expectedDayCount !== expectedDayCount) errors.push(`manifest must declare ${expectedDayCount} November days`);
if (manifest.pageCount !== 3 || manifest.expectedPageCount !== 3) errors.push("manifest must declare three pages");
if (manifest.pages.length !== 3) errors.push(`manifest page list must contain three pages; found ${manifest.pages.length}`);
if (manifest.pageDimensions?.width !== 1545 || manifest.pageDimensions?.height !== 1999) errors.push("manifest page dimensions must be 1545x1999");

for (let index = 0; index < manifest.pages.length; index += 1) {
  const page = manifest.pages[index];
  const expectedPage = 1;
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
  errors.push(...validateSvgTextGeometry(svg, page));
}

const expectedEntryIds = new Set(Array.from({ length: expectedDayCount }, (_, index) => String(index + 1).padStart(2, "0")).flatMap((day) => expectedLevels.map((level) => `11-${day}:${level}`)));
if (entryIds.length !== expectedDayCount * expectedLevels.length || new Set(entryIds).size !== expectedDayCount * expectedLevels.length || entryIds.some((entryId) => !expectedEntryIds.has(entryId))) {
  errors.push("answer key entries must cover each November day and level exactly once");
}

if (errors.length > 0) {
  console.error(JSON.stringify({ valid: false, errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ valid: true, month: 11, pageCount: 3, pageDimensions: { width: 1545, height: 1999 }, order: "level1 page, level2 page, level3 page" }, null, 2));
