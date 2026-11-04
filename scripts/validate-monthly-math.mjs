import { readFile, writeFile } from "node:fs/promises";
import { validateMonthlyMath } from "../src/monthly-math-validation.mjs";

const [contentPath, csvPath, sourcePath, reportPath] = process.argv.slice(2);
if (!contentPath || !csvPath || !sourcePath) {
  console.error("Usage: node scripts/validate-monthly-math.mjs <content.json> <history.csv> <source.json> [report.json]");
  process.exit(2);
}

const result = validateMonthlyMath({
  content: JSON.parse(await readFile(contentPath, "utf8")),
  csv: await readFile(csvPath, "utf8"),
  source: JSON.parse(await readFile(sourcePath, "utf8")),
});
const output = JSON.stringify(result.report, null, 2);
if (reportPath) await writeFile(reportPath, `${output}\n`, "utf8");
console.log(output);
if (!result.valid) {
  for (const error of result.errors) console.error(error);
  process.exitCode = 1;
}
