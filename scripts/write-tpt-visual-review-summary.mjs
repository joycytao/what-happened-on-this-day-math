import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const [visualDir, outputPath] = process.argv.slice(2);
if (!visualDir || !outputPath) {
  throw new Error("Usage: node scripts/write-tpt-visual-review-summary.mjs <visual-dir> <output-path>");
}

const requiredAssets = ["cover", "whats-included", "different-math", "daily-practice", "landing-page"];
const resolvedVisualDir = path.resolve(visualDir);
const resolvedOutputPath = path.resolve(outputPath);
const handoffPath = path.join(resolvedVisualDir, "landing-page-handoff.json");
const qaPath = path.join(resolvedVisualDir, "visual-structure-qa.json");
const reportPath = path.join(resolvedVisualDir, "monthly-thumbnail-report.json");
const errors = [];

function readJson(filePath, label) {
  if (!fs.existsSync(filePath)) {
    errors.push(`${label} is missing: ${path.relative(process.cwd(), filePath)}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`${label} is invalid JSON: ${error.message}`);
    return null;
  }
}

function checksum(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

const handoff = readJson(handoffPath, "landing-page-handoff.json");
const qa = readJson(qaPath, "visual-structure-qa.json");
const report = readJson(reportPath, "monthly-thumbnail-report.json");
const handoffAssets = new Map((handoff?.assets ?? []).map((asset) => [asset.id, asset]));
const assets = requiredAssets.map((id) => {
  const declared = handoffAssets.get(id);
  const filePath = declared?.path ? path.resolve(declared.path) : path.join(resolvedVisualDir, `${id}.png`);
  const exists = fs.existsSync(filePath);
  if (!exists) errors.push(`thumbnail asset is missing: ${id}`);
  return {
    id,
    path: path.relative(process.cwd(), filePath),
    archivePath: path.relative(path.dirname(resolvedVisualDir), filePath),
    sha256: exists ? checksum(filePath) : null,
    width: declared?.width ?? null,
    height: declared?.height ?? null,
    qa: (qa?.results ?? []).find((result) => result.asset === id)?.passed === true,
  };
});

for (const asset of assets) {
  if (!asset.qa) errors.push(`thumbnail QA did not pass: ${asset.id}`);
  if (asset.width !== 1260 || asset.height !== 1260) errors.push(`thumbnail dimensions are not 1260x1260: ${asset.id}`);
}

const summary = {
  schemaVersion: "tpt-visual-review-summary/v1",
  valid: errors.length === 0,
  errors,
  source: {
    pdf: handoff?.sourcePdf ?? null,
    templateVersion: report?.design ?? handoff?.templateVersion ?? handoff?.template?.version ?? null,
    sourcePages: handoff?.sourcePages ?? null,
  },
  assets,
  qa: {
    report: path.relative(process.cwd(), qaPath),
    deterministic: handoff?.qa?.deterministic === true,
    dimensions: handoff?.qa?.dimensions === true,
  },
  artifact: {
    name: process.env.ARTIFACT_NAME ?? null,
    runUrl: process.env.RUN_URL ?? null,
  },
};
if (!summary.qa.deterministic) summary.errors.push("deterministic QA evidence is missing");
if (!summary.qa.dimensions) summary.errors.push("dimension QA evidence is missing");
summary.valid = summary.errors.length === 0;

fs.mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
fs.writeFileSync(resolvedOutputPath, `${JSON.stringify(summary, null, 2)}\n`);
const markdownPath = resolvedOutputPath.replace(/\.json$/i, ".md");
const artifactUrl = summary.artifact.runUrl ? `${summary.artifact.runUrl}/artifacts` : "not available";
const markdown = [
  "# TPT visual review evidence",
  "",
  `- Status: **${summary.valid ? "reviewable" : "blocked"}**`,
  `- Source PDF: ${summary.source.pdf?.path ?? "unknown"}`,
  `- Source PDF SHA-256: \`${summary.source.pdf?.sha256 ?? "unknown"}\``,
  `- Template version: ${summary.source.templateVersion ?? "unknown"}`,
  `- QA JSON: [download artifact](${artifactUrl}) (${summary.qa.report})`,
  ...summary.assets.map((asset) => `- ${asset.id}: [download artifact](${artifactUrl}) (${asset.archivePath}); dimensions=${asset.width}x${asset.height}; SHA-256=\`${asset.sha256 ?? "missing"}\`; QA=${asset.qa ? "passed" : "failed"}`),
  ...summary.errors.map((error) => `- Blocker: ${error}`),
].join("\n") + "\n";
fs.writeFileSync(markdownPath, markdown);
if (!summary.valid) process.exitCode = 1;
