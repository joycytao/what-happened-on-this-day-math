#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { writeMonthlyWorksheetPackage } from "../src/monthly-worksheet-package.mjs";

const [inputPath, outputDirectory] = process.argv.slice(2);
if (!inputPath || !outputDirectory) {
  console.error("Usage: node scripts/render-monthly-worksheet-package.mjs <monthly-content-v2.json> <output-directory>");
  process.exit(2);
}

const content = JSON.parse(await readFile(inputPath, "utf8"));
const manifest = await writeMonthlyWorksheetPackage(content, outputDirectory);
console.log(JSON.stringify({ outputDirectory, pageCount: manifest.pageCount, expectedPageCount: manifest.expectedPageCount }, null, 2));
