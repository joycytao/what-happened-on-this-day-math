#!/usr/bin/env node
import { resolve } from "node:path";
import { validateWorksheetCoverVisual } from "../src/worksheet-cover-visual-qa.mjs";

const option = (name, fallback) => { const index = process.argv.indexOf(name); return index < 0 ? fallback : process.argv[index + 1]; };
const report = await validateWorksheetCoverVisual({
  referencePath: resolve(option("--reference", "references /worksheet-assets/worksheet-cover-reference.png")),
  candidatePath: resolve(option("--candidate", "references /worksheet-assets/worksheet-cover-reference.png")),
  outputDir: resolve(option("--output-dir", "reports/worksheet-cover-visual-qa")),
  promptVersion: option("--prompt-version", "1.0.0"),
  iteration: Number(option("--iteration", "1")),
});
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
