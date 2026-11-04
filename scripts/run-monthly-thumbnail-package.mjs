import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateMonthlyThumbnailManifest } from "../src/monthly-thumbnail-manifest.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const option = (name, fallback = "") => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
};

const manifestArgument = option("--manifest");
if (!manifestArgument) throw new Error("Usage: node scripts/run-monthly-thumbnail-package.mjs --manifest <path> [--output-dir <path>]");

const manifestPath = path.resolve(root, manifestArgument);
const outputDir = path.resolve(root, option("--output-dir", "output/monthly-thumbnail-package"));
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const validation = validateMonthlyThumbnailManifest(manifest);
const requiredProductFields = ["id", "month", "version", "day_count"];
for (const field of requiredProductFields) {
  if (!manifest.product?.[field]) validation.errors.push(`product.${field} is required`);
}
if (!manifest.doodle?.path) validation.errors.push("doodle.path is required for a complete package");
if (!validation.valid || validation.errors.length > 0) {
  throw new Error(`thumbnail manifest invalid: ${validation.errors.join("; ")}`);
}

fs.mkdirSync(outputDir, { recursive: true });
const generated = spawnSync(process.execPath, [
  "scripts/generate-tpt-visual-assets.mjs",
  "--manifest", manifestPath,
  "--output-dir", outputDir,
], { cwd: root, encoding: "utf8" });
if (generated.status !== 0) throw new Error(generated.stderr.trim() || generated.stdout.trim() || "thumbnail package generation failed");

function normalizeGeneratedJson(value) {
  if (typeof value === "string") return value.replaceAll(outputDir, ".");
  if (Array.isArray(value)) return value.map(normalizeGeneratedJson);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeGeneratedJson(entry)]));
  return value;
}

for (const name of ["landing-page-handoff.json", "monthly-thumbnail-report.json", "visual-structure-qa.json"]) {
  const filePath = path.join(outputDir, name);
  const normalized = normalizeGeneratedJson(JSON.parse(fs.readFileSync(filePath, "utf8")));
  fs.writeFileSync(filePath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}

const product = manifest.product;
const listing = [
  `# ${product.month[0].toUpperCase()}${product.month.slice(1)} Morning Work Math`,
  "",
  `- Package: ${product.id}@${product.version}`,
  `- Format: Printable PDF with ${product.day_count} daily word-problem modules`,
  "- Levels: Level 1, Level 2, and Level 3",
  "- Includes: reading passages, differentiated math tasks, answer key, and reviewable thumbnail assets",
  "",
  "> Publication remains pending human QA.",
  "",
].join("\n");
fs.writeFileSync(path.join(outputDir, "listing.md"), listing, "utf8");

const metadata = {
  schemaVersion: "thumbnail-package/v1",
  package: { id: product.id, version: product.version, month: product.month, dayCount: product.day_count },
  source: {
    manifest: path.relative(root, manifestPath),
    pdf: { path: manifest.pdf.path, sha256: manifest.pdf.sha256, pageCount: manifest.pdf.page_count },
  },
  outputs: {
    thumbnails: ["cover", "whats-included", "different-math", "daily-practice", "landing-page"],
    qa: ["monthly-thumbnail-report.json", "visual-structure-qa.json"],
    handoff: "landing-page-handoff.json",
    listing: "listing.md",
  },
  qa: { humanReviewRequired: true, deterministic: true },
};
fs.writeFileSync(path.join(outputDir, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

const excluded = new Set(["package-manifest.json"]);
const files = fs.readdirSync(outputDir)
  .filter((name) => !excluded.has(name) && fs.statSync(path.join(outputDir, name)).isFile())
  .sort()
  .map((name) => {
    const bytes = fs.readFileSync(path.join(outputDir, name));
    return { path: name, bytes: bytes.length, sha256: crypto.createHash("sha256").update(bytes).digest("hex") };
  });
const packageManifest = {
  schemaVersion: "thumbnail-package-manifest/v1",
  package: { id: product.id, version: product.version, month: product.month, dayCount: product.day_count },
  sourceManifest: path.relative(root, manifestPath),
  files,
};
fs.writeFileSync(path.join(outputDir, "package-manifest.json"), `${JSON.stringify(packageManifest, null, 2)}\n`, "utf8");

console.log(JSON.stringify({ outputDir: path.relative(root, outputDir), files: files.length, packageManifest: "package-manifest.json" }, null, 2));
