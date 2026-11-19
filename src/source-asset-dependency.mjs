export const SOURCE_ASSET_DEPENDENCY_MARKER = "CODEX_SOURCE_ASSET_DEPENDENCY";
export const SOURCE_ASSET_DEPENDENCY_STATUSES = new Set(["available", "missing", "pending"]);
export const SOURCE_ASSET_REQUIRED_LABELS = new Set(["social: product-reel", "social: carousel", "social: utility-reel"]);

const MARKER = new RegExp(`^${SOURCE_ASSET_DEPENDENCY_MARKER}:\\s*(.+)$`, "gim");
const PLACEHOLDER = /^(?:tbd|todo|n\/a|none|placeholder|<[^>]+>)$/i;

function normalizedPaths(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((path) => typeof path === "string").map((path) => path.trim()).filter(Boolean);
}

export function validateSourceAssetDependency(dependency = {}) {
  const errors = [];
  if (!dependency || typeof dependency !== "object" || Array.isArray(dependency)) {
    return { valid: false, errors: ["source asset dependency must be an object"] };
  }
  if (typeof dependency.id !== "string" || !dependency.id.trim()) errors.push("source asset dependency id is required");
  if (dependency.required !== true) errors.push("source asset dependency required must be true");
  if (!SOURCE_ASSET_DEPENDENCY_STATUSES.has(dependency.status)) errors.push("source asset dependency status must be available, missing, or pending");
  const paths = normalizedPaths(dependency.paths);
  if (!Array.isArray(dependency.paths) || paths.length !== dependency.paths.length) errors.push("source asset dependency paths must be a string array");
  if (paths.some((path) => PLACEHOLDER.test(path))) errors.push("source asset dependency paths cannot be placeholders");
  if (dependency.status === "available" && paths.length === 0) errors.push("available source asset dependency requires at least one path");
  if (dependency.status !== "available" && (typeof dependency.reason !== "string" || !dependency.reason.trim())) errors.push("unavailable source asset dependency requires a reason");
  if (dependency.sha256 !== undefined && !/^[a-f0-9]{64}$/i.test(String(dependency.sha256))) errors.push("source asset dependency sha256 must be 64 hexadecimal characters");
  if (dependency.producer !== undefined && !/^#\d+$/.test(String(dependency.producer))) errors.push("source asset dependency producer must be an Issue reference such as #123");
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function parseSourceAssetDependencies(body = "") {
  const dependencies = [];
  const errors = [];
  for (const match of String(body).matchAll(MARKER)) {
    let dependency;
    try {
      dependency = JSON.parse(match[1].trim());
    } catch {
      errors.push("source asset dependency contains invalid JSON");
      continue;
    }
    const validation = validateSourceAssetDependency(dependency);
    if (!validation.valid) errors.push(...validation.errors);
    dependencies.push(dependency);
  }
  const duplicateIds = dependencies.map((dependency) => dependency.id).filter((id, index, ids) => ids.indexOf(id) !== index);
  if (duplicateIds.length) errors.push(`duplicate source asset dependency id: ${[...new Set(duplicateIds)].join(", ")}`);
  return { dependencies, errors: [...new Set(errors)], satisfied: dependencies.every((dependency) => dependency.status === "available") };
}

export function requiresSourceAssetDependency(labels = []) {
  return labels.some((label) => SOURCE_ASSET_REQUIRED_LABELS.has(typeof label === "string" ? label : label?.name));
}

export function renderSourceAssetDependency(dependency) {
  const validation = validateSourceAssetDependency(dependency);
  if (!validation.valid) throw new Error(validation.errors.join("; "));
  return `${SOURCE_ASSET_DEPENDENCY_MARKER}: ${JSON.stringify(dependency)}`;
}
