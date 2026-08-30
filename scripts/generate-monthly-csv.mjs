#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import { upsertMonthlyCsv } from "../src/monthly-csv.mjs";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/generate-monthly-csv.mjs <content.json> <history_today_YYYY-MM.csv>");
  process.exit(2);
}

const content = JSON.parse(await readFile(inputPath, "utf8"));
await upsertMonthlyCsv(content, outputPath);
console.log(`monthly CSV written: ${outputPath}`);
