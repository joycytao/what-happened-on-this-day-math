import { readFile, writeFile } from "node:fs/promises";

import { validateMonthlyCsv } from "../src/monthly-csv-validation.mjs";

const [inputPath, reportPath] = process.argv.slice(2);
if (!inputPath) {
  console.error("Usage: npm run csv:validate -- <input.csv> [report.json]");
  process.exit(2);
}

const result = validateMonthlyCsv(await readFile(inputPath, "utf8"));
const output = JSON.stringify(result.report, null, 2);
if (reportPath) await writeFile(reportPath, `${output}\n`, "utf8");
console.log(output);
if (!result.valid) {
  for (const error of result.errors) console.error(error);
  process.exitCode = 1;
}
