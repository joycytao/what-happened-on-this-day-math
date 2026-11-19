import path from "node:path";

const SUPPORTED_GENERATORS = Object.freeze({
  "reel-v1": "product-reel",
  "carousel-v1": "product-carousel",
});

function isMonth(value) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value ?? "").trim());
}

function rowLabel(row) {
  return String(row?.contentId ?? "(unknown content)").trim() || "(unknown content)";
}

function sortedRows(rows) {
  return rows
    .map((row) => ({ ...row, assetPaths: Array.isArray(row.assetPaths) ? [...row.assetPaths] : row.assetPaths, hashtags: Array.isArray(row.hashtags) ? [...row.hashtags] : row.hashtags }))
    .sort((a, b) => String(a.publicationDate ?? "").localeCompare(String(b.publicationDate ?? "")) || rowLabel(a).localeCompare(rowLabel(b)));
}

export function buildMonthlySocialRunPlan({ rows = [], month, outputRoot = "output/social/monthly" } = {}) {
  const requestedMonth = String(month ?? "").trim();
  const errors = [];
  if (!isMonth(requestedMonth)) errors.push("month must use YYYY-MM format");
  if (!Array.isArray(rows)) errors.push("rows must be an array");
  if (typeof outputRoot !== "string" || !outputRoot.trim()) errors.push("outputRoot is required");
  if (errors.length) return { valid: false, errors, month: requestedMonth, rows: [], outputRoot };

  const seenIds = new Set();
  const plannedRows = sortedRows(rows).map((sourceRow) => {
    const contentId = rowLabel(sourceRow);
    const templateId = String(sourceRow.templateId ?? "").trim();
    const publicationDate = String(sourceRow.publicationDate ?? "").trim();
    const rowErrors = [];
    if (!sourceRow.contentId || contentId === "(unknown content)") rowErrors.push("Content ID is required");
    if (seenIds.has(contentId)) rowErrors.push(`duplicate Content ID "${contentId}"`);
    seenIds.add(contentId);
    if (!publicationDate.startsWith(`${requestedMonth}-`)) rowErrors.push(`publication date is outside requested month ${requestedMonth}`);

    const generator = SUPPORTED_GENERATORS[templateId] ?? null;
    const status = generator ? (rowErrors.length ? "invalid" : "planned") : "unsupported-template";
    if (!generator) rowErrors.push(`unsupported template "${templateId || "(missing)"}"`);
    errors.push(...rowErrors.map((message) => `Content ID ${contentId}: ${message}`));

    return {
      contentId,
      templateId,
      publicationDate,
      status,
      generator,
      input: { ...sourceRow, assetPaths: Array.isArray(sourceRow.assetPaths) ? [...sourceRow.assetPaths] : sourceRow.assetPaths, hashtags: Array.isArray(sourceRow.hashtags) ? [...sourceRow.hashtags] : sourceRow.hashtags },
      outputPath: path.join(outputRoot, requestedMonth, contentId),
      errors: rowErrors,
    };
  });

  return {
    valid: errors.length === 0,
    errors,
    month: requestedMonth,
    rows: plannedRows,
    outputRoot,
  };
}

export { SUPPORTED_GENERATORS };
