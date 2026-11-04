import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateMonthlyReleaseManifest, verifyMonthlyReleaseManifestFiles } from "../src/monthly-release-manifest.mjs";
import { buildTptMetadata, writeTptMetadataOutputs } from "../src/tpt-input-adapter.mjs";
import { buildTptAssetPackage, writeTptAssetInventory } from "../src/tpt-asset-packager.mjs";
import { normaliseTptWorkflowInputs } from "../src/tpt-workstream-contract.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const option = (name, fallback = "") => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
};

const rawInputs = {
  month: option("--month"),
  year: option("--year"),
  packageId: option("--package-id"),
  manifestPath: option("--manifest"),
  contentPath: option("--content")
};
const outputDir = path.resolve(root, option("--output-dir", "output/tpt/workstream"));
const reportPath = path.resolve(root, option("--report", path.relative(root, path.join(outputDir, "workstream.json"))));
const inputResult = normaliseTptWorkflowInputs(rawInputs);

function writeResult(result) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}

if (!inputResult.valid) {
  writeResult({ schemaVersion: "1.0.0", status: "blocked", failureReason: inputResult.errors.join("; "), reportPath });
  process.exit(1);
}

const inputs = inputResult.inputs;
const manifest = JSON.parse(fs.readFileSync(path.resolve(root, inputs.manifestPath), "utf8"));
const content = JSON.parse(fs.readFileSync(path.resolve(root, inputs.contentPath), "utf8"));
const taxonomy = JSON.parse(fs.readFileSync(path.join(root, "examples/tpt-metadata-taxonomy.example.json"), "utf8"));
const manifestResult = validateMonthlyReleaseManifest(manifest, { month: inputs.monthName, year: inputs.year });
const fileResult = manifestResult.valid ? verifyMonthlyReleaseManifestFiles(manifest, root) : { valid: false, errors: [] };
const errors = [
  ...manifestResult.errors.map((error) => `release manifest: ${error}`),
  ...fileResult.errors.map((error) => `release files: ${error}`)
];

if (errors.length === 0 && manifest.packageId !== inputs.packageId) errors.push(`packageId mismatch: expected ${inputs.packageId}, got ${manifest.packageId}`);
if (errors.length === 0) {
  const metadata = buildTptMetadata({ manifest, content, taxonomy, releaseManifestPath: inputs.manifestPath, contentPath: inputs.contentPath });
  if (!metadata.valid) errors.push(...metadata.errors.map((error) => `metadata: ${error}`));
  if (metadata.valid) writeTptMetadataOutputs({ payload: metadata.payload, outputDir });
  const assets = buildTptAssetPackage({ manifest, baseDir: root, outputDir: path.join(outputDir, "assets") });
  if (!assets.valid) errors.push(...assets.errors.map((error) => `assets: ${error}`));
  if (assets.valid) writeTptAssetInventory(assets.inventory, outputDir);
}

const result = {
  schemaVersion: "1.0.0",
  status: errors.length === 0 ? "qa" : "blocked",
  packageId: manifest.packageId ?? inputs.packageId,
  packageVersion: manifest.packageVersion,
  month: manifest.month,
  year: manifest.year,
  sourceCommit: manifest.sourceCommit,
  idempotencyKey: `${manifest.packageId ?? inputs.packageId}@${manifest.packageVersion ?? "unknown"}`,
  outputDir: path.relative(root, outputDir),
  reportPath: path.relative(root, reportPath),
  failureReason: errors.length ? errors.join("; ") : null,
  generatedAt: "deterministic"
};
writeResult(result);
if (errors.length) process.exit(1);
