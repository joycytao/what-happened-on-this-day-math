import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildTptProjectPlan } from "../src/tpt-project-integration.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const option = (name, fallback = "") => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
};

const resultPath = path.resolve(root, option("--result"));
const outputPath = path.resolve(root, option("--output", "output/tpt/project-sync.json"));
const result = JSON.parse(fs.readFileSync(resultPath, "utf8"));
const issueNumber = Number(option("--issue-number"));
const planResult = buildTptProjectPlan({
  result,
  issueNumber,
  issueNodeId: option("--issue-node-id"),
  runUrl: option("--run-url"),
  manifestPath: option("--manifest"),
  artifactUrl: option("--artifact-url"),
  config: {
    owner: option("--project-owner"),
    number: option("--project-number")
  }
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(planResult, null, 2) + "\n");
console.log(JSON.stringify(planResult, null, 2));
if (!planResult.valid) process.exit(1);
