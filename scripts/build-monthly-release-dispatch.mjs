import fs from "node:fs";
import path from "node:path";
import { validateMonthlyReleaseManifest } from "../src/monthly-release-manifest.mjs";

const MONTHS = Object.freeze({
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
});

function parseArgs(argv = []) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--") || !argv[index + 1]) throw new Error(`Unknown or incomplete argument: ${argument}`);
    options[argument.slice(2)] = argv[index + 1];
    index += 1;
  }
  if (!options.manifest) throw new Error("--manifest is required");
  return options;
}

function monthNumber(month) {
  const value = String(month ?? "").trim().toLowerCase();
  return MONTHS[value] ?? (Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 12 ? String(value).padStart(2, "0") : null);
}

export function buildMonthlyReleaseDispatch({ manifest, manifestPath, contentPath, thumbnailManifestPath } = {}) {
  const errors = [];
  const month = String(manifest?.month ?? "").trim();
  const year = Number(manifest?.year);
  const monthSlug = month.toLowerCase();
  const monthId = monthNumber(month);
  if (!manifest || typeof manifest !== "object") errors.push("manifest must be an object");
  if (!manifest?.packageId) errors.push("manifest.packageId is required");
  if (!monthId) errors.push("manifest.month must be a valid month");
  if (!Number.isInteger(year) || year < 2000) errors.push("manifest.year must be a four-digit year");
  const validation = manifest && monthId && Number.isInteger(year)
    ? validateMonthlyReleaseManifest(manifest, { month, year })
    : { valid: false, errors: [] };
  errors.push(...validation.errors);

  const resolvedContentPath = contentPath || `data/monthly/${year}-${monthId}-content-v2.json`;
  const resolvedThumbnailManifestPath = thumbnailManifestPath || `examples/${monthSlug}-thumbnail-manifest.json`;
  if (!resolvedContentPath) errors.push("content path is required");
  if (!resolvedThumbnailManifestPath.includes("thumbnail-manifest.json")) errors.push("thumbnail manifest path must be a thumbnail-manifest.json file");

  return {
    valid: errors.length === 0,
    errors,
    month,
    year,
    packageId: manifest?.packageId,
    manifestPath,
    contentPath: resolvedContentPath,
    thumbnailManifestPath: resolvedThumbnailManifestPath,
    workflows: ["Queue monthly social workstreams", "Start TPT from released monthly package"],
  };
}

export function buildFromFiles({ manifestPath, contentPath, thumbnailManifestPath, root = process.cwd() } = {}) {
  const absoluteManifestPath = path.resolve(root, manifestPath);
  const manifest = JSON.parse(fs.readFileSync(absoluteManifestPath, "utf8"));
  const result = buildMonthlyReleaseDispatch({
    manifest,
    manifestPath,
    contentPath,
    thumbnailManifestPath,
  });
  for (const [label, relativePath] of [["content", result.contentPath], ["thumbnail manifest", result.thumbnailManifestPath]]) {
    if (!fs.existsSync(path.resolve(root, relativePath))) result.errors.push(`${label} file is missing: ${relativePath}`);
  }
  result.valid = result.errors.length === 0;
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const options = parseArgs(process.argv.slice(2));
  const result = buildFromFiles({
    manifestPath: options.manifest,
    contentPath: options.content,
    thumbnailManifestPath: options.thumbnailManifest,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.valid) process.exitCode = 1;
}
