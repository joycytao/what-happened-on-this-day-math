import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildProductReelWorkstream } from "../src/product-reel-workstream.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const option = (name, fallback = "") => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
};
const inputPath = path.resolve(root, option("--input"));
const outputPath = path.resolve(root, option("--output", "output/social/product-reels/workstream.json"));

if (!option("--input")) {
  console.error("Usage: node scripts/generate-product-reels.mjs --input <monthly-product-reel-input.json> [--output <path>]");
  process.exit(2);
}

const result = buildProductReelWorkstream(JSON.parse(fs.readFileSync(inputPath, "utf8")));
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(root, outputPath), valid: result.valid, records: result.records.length, errors: result.errors }, null, 2));
if (!result.valid) process.exit(1);
