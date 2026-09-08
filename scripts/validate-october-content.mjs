#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateOctoberContent, validateOctoberSources } from "../src/october-content-validation.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contentPath = resolve(root, "content/monthly/month-10.json");
const researchPath = resolve(root, "research/october-events.json");
const outputArgument = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
const outputPath = outputArgument ? resolve(process.cwd(), outputArgument) : null;
const content = JSON.parse(await readFile(contentPath, "utf8"));
const research = JSON.parse(await readFile(researchPath, "utf8"));
const report = validateOctoberContent(content, research);

if (process.argv.includes("--check-sources")) {
  report.sources = await validateOctoberSources(content);
  report.valid = report.valid && report.sources.valid;
}

const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath) await writeFile(outputPath, serialized);
process.stdout.write(serialized);
process.exitCode = report.valid ? 0 : 1;
