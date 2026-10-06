import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildFfmpegArgs, buildProductReelRenderPlan } from "../src/product-reel-renderer.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const option = (name, fallback = "") => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
};
if (!option("--input")) {
  console.error("Usage: node scripts/render-product-reel-mp4.mjs --input <workstream.json> [--output <reel.mp4>]");
  process.exit(2);
}

const inputPath = path.resolve(root, option("--input"));
const output = option("--output", "output/social/product-reels/rendered/reel.mp4");
const workstream = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const plan = buildProductReelRenderPlan(workstream, { root, output });
if (!plan.valid) {
  console.error(plan.errors.join("\n"));
  process.exit(1);
}
if (!fs.existsSync(plan.sourceAsset)) {
  console.error(`source evidence asset does not exist: ${plan.sourceAsset}`);
  process.exit(1);
}
fs.mkdirSync(path.dirname(plan.outputPath), { recursive: true });
const result = spawnSync("ffmpeg", buildFfmpegArgs(plan), { stdio: "inherit" });
if (result.status !== 0) process.exit(result.status ?? 1);
const manifestPath = plan.outputPath.replace(/\.mp4$/i, ".json");
fs.writeFileSync(manifestPath, `${JSON.stringify({
  renderer: "scripts/render-product-reel-mp4.mjs",
  input: path.relative(root, inputPath),
  output: path.relative(root, plan.outputPath),
  sourceAsset: path.relative(root, plan.sourceAsset),
  sceneCount: plan.sceneCount,
  spec: plan.spec,
  storage: plan.storage,
  humanReviewRequired: true,
}, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(root, plan.outputPath), manifest: path.relative(root, manifestPath), spec: plan.spec }, null, 2));
