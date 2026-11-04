import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildProductConfirmedStory } from "../src/product-confirmed-handoff.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const option = (name, fallback = "") => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
};
const inputPath = option("--input");
const template = option("--template", "reel");
const outputDir = path.resolve(root, option("--output-dir", `output/social/${template === "carousel" ? "carousels" : "product-reels"}/handoff`));
if (!inputPath) {
  console.error("Usage: node scripts/build-product-confirmed-handoff.mjs --input <payload.json> [--output-dir <dir>]");
  process.exit(2);
}
const result = buildProductConfirmedStory(JSON.parse(fs.readFileSync(path.resolve(root, inputPath), "utf8")), { root });
if (!result.valid) {
  console.error(JSON.stringify({ valid: false, errors: result.errors }, null, 2));
  process.exit(1);
}
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, "product-confirmed.json"), `${JSON.stringify(result.payload, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, `${template === "carousel" ? "product-carousel" : "product-reel"}-story.md`), `${result.story}\n`);
console.log(JSON.stringify({ valid: true, handoff_id: result.payload.handoff_id, marker: result.marker, outputDir: path.relative(root, outputDir), labels: result.labels }, null, 2));
