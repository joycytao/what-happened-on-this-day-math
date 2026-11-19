import { readFile, writeFile } from "node:fs/promises";
import { buildScheduledDispatchPlan } from "../src/scheduled-agent-dispatch.mjs";

const inputIndex = process.argv.indexOf("--input");
const outputIndex = process.argv.indexOf("--output");
const inputPath = inputIndex >= 0 ? process.argv[inputIndex + 1] : "";
const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : "";

if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/build-scheduled-agent-dispatch-plan.mjs --input <issues.json> --output <plan.json>");
  process.exit(1);
}

const issues = JSON.parse(await readFile(inputPath, "utf8"));
const plan = buildScheduledDispatchPlan(issues);
await writeFile(outputPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
