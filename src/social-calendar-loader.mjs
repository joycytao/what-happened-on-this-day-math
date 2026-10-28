import path from "node:path";

import XLSX from "xlsx";

const REQUIRED_COLUMNS = [
  "contentId", "contentType", "templateId", "trigger", "publicationDate",
  "assetPaths", "hook", "caption", "hashtags",
];

const COLUMN_ALIASES = new Map([
  ["contentid", "contentId"], ["contenttype", "contentType"],
  ["templateid", "templateId"], ["trigger", "trigger"],
  ["publicationdate", "publicationDate"], ["date", "publicationDate"],
  ["assetpaths", "assetPaths"], ["assets", "assetPaths"], ["hook", "hook"],
  ["caption", "caption"], ["hashtags", "hashtags"],
  ["outputformat", "outputFormat"], ["generationstatus", "generationStatus"],
  ["campaignid", "campaignId"], ["campaignname", "campaignName"],
]);

const TEMPLATE_BY_TYPE = Object.freeze({ carousel: "carousel-v1", reel: "reel-v1" });

function key(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function rowError(errors, rowNumber, message) {
  errors.push(`Row ${rowNumber}: ${message}`);
}

function splitList(value, splitWhitespace = false) {
  const separator = splitWhitespace ? /[\n,;\s]+/ : /[\n,;]+/;
  return String(value ?? "").split(separator).map((item) => item.trim()).filter(Boolean);
}

function normalizeDate(value) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed?.y && parsed?.m && parsed?.d) {
      return `${String(parsed.y).padStart(4, "0")}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }
  }
  const text = String(value ?? "").trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const us = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (us) return `${us[3]}-${String(us[1]).padStart(2, "0")}-${String(us[2]).padStart(2, "0")}`;
  return "";
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function normalizeRow(raw, columns, rowNumber, errors) {
  const value = (field) => raw[columns.get(field)];
  const contentId = String(value("contentId") ?? "").trim();
  const contentType = String(value("contentType") ?? "").trim().toLowerCase();
  const templateId = String(value("templateId") ?? "").trim();
  const trigger = String(value("trigger") ?? "").trim().toUpperCase();
  const publicationDate = normalizeDate(value("publicationDate"));
  const assetPaths = splitList(value("assetPaths"));
  const hook = String(value("hook") ?? "").trim();
  const caption = String(value("caption") ?? "").trim();
  const hashtags = splitList(value("hashtags"), true);

  for (const [present, label] of [
    [contentId, "Content ID"], [contentType, "Content Type"], [templateId, "Template ID"],
    [trigger, "Trigger"], [publicationDate, "Publication Date"], [assetPaths.length, "Asset Paths"],
    [hook, "Hook"], [caption, "Caption"], [hashtags.length, "Hashtags"],
  ]) if (!present) rowError(errors, rowNumber, `${label} is required`);

  if (contentType && !TEMPLATE_BY_TYPE[contentType]) rowError(errors, rowNumber, `Content Type "${contentType}" is unsupported; expected Carousel or Reel`);
  if (templateId && contentType && TEMPLATE_BY_TYPE[contentType] && templateId !== TEMPLATE_BY_TYPE[contentType]) {
    const displayType = contentType[0].toUpperCase() + contentType.slice(1);
    rowError(errors, rowNumber, `Template ID "${templateId}" does not match ${displayType} (${TEMPLATE_BY_TYPE[contentType]})`);
  }
  if (trigger && !["START", "ENDING_SOON"].includes(trigger)) rowError(errors, rowNumber, `Trigger "${trigger}" is unsupported; expected START or ENDING_SOON`);
  if (publicationDate && !validDate(publicationDate)) rowError(errors, rowNumber, `Publication Date "${publicationDate}" is invalid`);

  return {
    contentId,
    contentType: contentType ? contentType[0].toUpperCase() + contentType.slice(1) : "",
    templateId, trigger, publicationDate, assetPaths, hook, caption, hashtags,
    outputFormat: String(value("outputFormat") ?? "").trim(),
    generationStatus: String(value("generationStatus") ?? "").trim(),
    campaignId: String(value("campaignId") ?? "").trim(),
    campaignName: String(value("campaignName") ?? "").trim(),
  };
}

export function loadSocialCalendar({ workbookPath, month, root = process.cwd() } = {}) {
  const errors = [];
  if (!workbookPath) errors.push("workbookPath is required");
  const requestedMonth = String(month ?? "").trim();
  if (!/^\d{4}-\d{2}$/.test(requestedMonth)) errors.push("month must use YYYY-MM format");
  if (errors.length) return { valid: false, errors, rows: [] };

  const absolutePath = path.resolve(root, workbookPath);
  let workbook;
  try { workbook = XLSX.readFile(absolutePath, { cellDates: true, raw: true }); }
  catch (cause) { return { valid: false, errors: [`Unable to read workbook ${workbookPath}: ${cause.message}`], rows: [] }; }

  const sheetName = workbook.SheetNames.includes("Content Calendar") ? "Content Calendar" : workbook.SheetNames[0];
  if (!sheetName) return { valid: false, errors: ["Workbook has no worksheets"], rows: [] };
  const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "", raw: true, blankrows: false });
  const columns = new Map();
  (matrix[0] ?? []).forEach((header, index) => {
    const field = COLUMN_ALIASES.get(key(header));
    if (field && !columns.has(field)) columns.set(field, index);
  });
  for (const field of REQUIRED_COLUMNS) if (!columns.has(field)) errors.push(`Missing required column "${field}"`);
  if (errors.length) return { valid: false, errors, rows: [] };

  const rows = [];
  const seenIds = new Set();
  for (let index = 1; index < matrix.length; index += 1) {
    const raw = matrix[index];
    if (!raw.some((cell) => String(cell ?? "").trim())) continue;
    const rowNumber = index + 1;
    const row = normalizeRow(raw, columns, rowNumber, errors);
    if (row.contentId && seenIds.has(row.contentId)) rowError(errors, rowNumber, `duplicate Content ID "${row.contentId}"`);
    if (row.contentId) seenIds.add(row.contentId);
    if (row.publicationDate.slice(0, 7) === requestedMonth) rows.push(row);
  }
  rows.sort((a, b) => a.publicationDate.localeCompare(b.publicationDate) || a.contentId.localeCompare(b.contentId));
  return { valid: errors.length === 0, errors, rows, source: { workbookPath, sheetName, month: requestedMonth } };
}
