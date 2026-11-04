import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCarouselWorkstream } from "../src/carousel-workstream.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const option = (name, fallback = "") => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] ?? fallback : fallback; };
if (!option("--input") || !option("--reels")) { console.error("Usage: node scripts/generate-carousels.mjs --input <carousel-input.json> --reels <product-reels.json> [--output <path>]"); process.exit(2); }
const input = JSON.parse(fs.readFileSync(path.resolve(root, option("--input")), "utf8"));
const reels = JSON.parse(fs.readFileSync(path.resolve(root, option("--reels")), "utf8"));
const result = buildCarouselWorkstream({ ...input, productReels: reels });
const output = path.resolve(root, option("--output", `output/social/carousels/${String(input.month).toLowerCase()}-carousels/workstream.json`));
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(root, output), valid: result.valid, records: result.records.length, errors: result.errors }, null, 2));
if (!result.valid) process.exit(1);
