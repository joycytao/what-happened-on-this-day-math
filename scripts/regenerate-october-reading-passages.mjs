#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { buildOctoberReadingPassages, validateReadingPassage } from "../src/reading-passage-quality.mjs";

const contentPath = new URL("../content/monthly/month-10.json", import.meta.url);
const content = JSON.parse(await readFile(contentPath, "utf8"));
const passages = buildOctoberReadingPassages(content.days.length);
const reports = [];

for (const generated of passages) {
  const day = content.days.find((entry) => entry.day === generated.day);
  day.readingPassage = generated.readingPassage;
  reports.push(validateReadingPassage({ ...day, readingPassage: generated.readingPassage }));
}

const failures = reports.filter((report) => !report.valid);
if (failures.length) {
  throw new Error(failures.map((report) => `${report.day}: ${report.errors.join("; ")}`).join("\n"));
}

await writeFile(contentPath, `${JSON.stringify(content, null, 2)}\n`);
console.log(JSON.stringify({ updatedDays: passages.length, wordCounts: reports.map(({ day, wordCount }) => ({ day, wordCount })) }, null, 2));
