import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { validateMonthlyThumbnailManifest } from "../src/monthly-thumbnail-manifest.mjs";
import { buildLandingPageMetadata } from "../src/landing-page-handoff.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const option = (name, fallback = "") => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
};

const manifestPath = path.resolve(root, option("--manifest"));
const outputDir = path.resolve(root, option("--output-dir", "output/tpt/visual-assets"));
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const validation = validateMonthlyThumbnailManifest(manifest);
if (!validation.valid) throw new Error(`thumbnail manifest invalid: ${validation.errors.join("; ")}`);

const pdfPath = path.resolve(root, manifest.pdf.path);
const doodlePath = path.resolve(root, manifest.doodle.path);
if (!fs.existsSync(pdfPath)) throw new Error(`final PDF does not exist: ${manifest.pdf.path}`);
if (!fs.existsSync(doodlePath)) throw new Error(`month-specific doodle does not exist: ${manifest.doodle.path}`);
const actualPdfSha256 = crypto.createHash("sha256").update(fs.readFileSync(pdfPath)).digest("hex");
if (actualPdfSha256 !== manifest.pdf.sha256) throw new Error(`stale final PDF: expected ${manifest.pdf.sha256}, got ${actualPdfSha256}`);

fs.mkdirSync(outputDir, { recursive: true });
const bundledPython = "/Users/jtao/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";
const python = process.env.CODEX_PYTHON || (fs.existsSync(bundledPython) ? bundledPython : "python3");
const result = spawnSync(python, ["scripts/generate_monthly_thumbnails.py", "--manifest", manifestPath, "--output-dir", outputDir], { cwd: root, encoding: "utf8" });
if (result.status !== 0) throw new Error(result.stderr.trim() || result.stdout.trim() || "thumbnail generation failed");

const prefix = `${manifest.product.month}-${manifest.product.version}`;
const names = ["cover", "whats-included", "different-math", "daily-practice", "landing-page"];
const assets = names.map((name) => {
  const assetPath = path.join(outputDir, `${prefix}-${name}.png`);
  if (!fs.existsSync(assetPath)) throw new Error(`generated thumbnail missing: ${assetPath}`);
  const image = PNG.sync.read(fs.readFileSync(assetPath));
  if (image.width !== 1260 || image.height !== 1260) throw new Error(`${name} must be 1260x1260, got ${image.width}x${image.height}`);
  return {
    id: name,
    path: path.relative(root, assetPath),
    width: image.width,
    height: image.height,
    bytes: fs.statSync(assetPath).size,
    sha256: crypto.createHash("sha256").update(fs.readFileSync(assetPath)).digest("hex")
  };
});

const reportPath = path.join(outputDir, "monthly-thumbnail-report.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const structuralQaPath = path.join(outputDir, "visual-structure-qa.json");
const structuralQa = spawnSync(python, ["scripts/validate-tpt-visual-structure.py", "--canonical-dir", "references /thumbnail-assets", "--generated-dir", outputDir, "--report", structuralQaPath], { cwd: root, encoding: "utf8" });
if (structuralQa.status !== 0) throw new Error(structuralQa.stderr.trim() || structuralQa.stdout.trim() || "visual structure QA failed");
const structuralQaReport = JSON.parse(fs.readFileSync(structuralQaPath, "utf8"));
const handoff = {
  schemaVersion: "1.0.0",
  packageId: option("--package-id", manifest.product.id),
  packageVersion: option("--package-version", manifest.product.version),
  month: manifest.product.month,
  landingPage: buildLandingPageMetadata(manifest.product),
  sourcePdf: { path: path.relative(root, pdfPath), sha256: actualPdfSha256, pageCount: manifest.pdf.page_count },
  doodle: { path: path.relative(root, doodlePath), sha256: report.doodle_sha256 },
  assets,
  landingPageImage: assets.find((asset) => asset.id === "landing-page"),
  sourcePages: manifest.templates,
  qa: {
    status: structuralQaReport.passed ? "review" : "blocked",
    deterministic: report.style?.deterministic === true,
    dimensions: assets.every((asset) => asset.width === 1260 && asset.height === 1260),
    clipping: "manual-review-required",
    visualComparison: "fixed-region-structural-ssim-with-variable-copy-exclusions",
    structuralReport: path.relative(root, structuralQaPath),
    report: path.relative(root, reportPath)
  }
};
const handoffPath = path.join(outputDir, "landing-page-handoff.json");
fs.writeFileSync(handoffPath, `${JSON.stringify(handoff, null, 2)}\n`);
console.log(JSON.stringify({ outputDir: path.relative(root, outputDir), handoff: path.relative(root, handoffPath), assets: assets.length, qa: handoff.qa.status }, null, 2));
