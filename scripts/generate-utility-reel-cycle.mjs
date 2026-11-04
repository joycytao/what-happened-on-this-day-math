import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildUtilityReelCycle } from "../src/utility-reel-workflow.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const option = (name, fallback = "") => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
};
const inputPath = path.resolve(root, option("--input"));
const outputPath = path.resolve(root, option("--output", "output/social/utility-reels/cycle.json"));

if (!option("--input")) {
  console.error("Usage: node scripts/generate-utility-reel-cycle.mjs --input <utility-intake.json> [--output <path>]");
  process.exit(2);
}

const result = buildUtilityReelCycle(JSON.parse(fs.readFileSync(inputPath, "utf8")));
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(root, outputPath), valid: result.valid, records: result.records.length, errors: result.errors }, null, 2));
if (!result.valid) process.exit(1);
