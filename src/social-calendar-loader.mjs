import XLSX from "xlsx";

export const CONTENT_TYPES = Object.freeze(["Carousel", "Reel"]);
export const TEMPLATE_IDS = Object.freeze({
  Carousel: "carousel-v1",
  Reel: "reel-v1"
});
export const TRIGGERS = Object.freeze(["manual", "monthly-release", "scheduled"]);
export const OUTPUT_FORMATS = Object.freeze({ Carousel: "png", Reel: "mp4" });
export const GENERATION_STATUSES = Object.freeze(["planned", "ready", "generated", "review", "published", "blocked"]);

export const CANONICAL_HEADERS = Object.freeze([
  "Content ID",
  "Content Type",
  "Template ID",
  "Trigger",
  "Publish Date",
  "Asset Paths",
  "Hook",
  "Caption",
  "Hashtags",
  "Campaign ID",
  "Campaign Week",
  "Output Format",
  "Generation Status"
]);

const REQUIRED_FIELDS = new Set([
  "Content ID",
  "Content Type",
  "Template ID",
  "Trigger",
  "Publish Date",
  "Asset Paths",
  "Hook",
  "Caption",
  "Hashtags",
  "Campaign ID",
  "Campaign Week",
  "Output Format",
  "Generation Status"
]);

function clean(value) {
  return String(value ?? "").trim();
}

function splitList(value) {
  return clean(value)
    .split(/[;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitHashtags(value) {
  return clean(value)
    .split(/[,;\n\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.startsWith("#") ? item : `#${item}`);
}

function error(row, field, message, contentId = "") {
  return { row, contentId, field, message };
}

function normalizeHeader(value) {
  return clean(value).toLowerCase().replace(/\s+/g, " ");
}

function headerMap(headerRow) {
  const map = new Map();
  headerRow.forEach((value, index) => {
    const key = normalizeHeader(value);
    if (key) map.set(key, index);
  });
  return map;
}

function cell(row, headers, field) {
  return row[headers.get(normalizeHeader(field))] ?? "";
}

function parseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      const month = String(parsed.m).padStart(2, "0");
      const day = String(parsed.d).padStart(2, "0");
      return `${parsed.y}-${month}-${day}`;
    }
  }
  const raw = clean(value);
  if (!raw) return "";
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (iso) {
    const date = new Date(`${raw}T00:00:00Z`);
    if (!Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === raw) return raw;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.valueOf()) ? "" : parsed.toISOString().slice(0, 10);
}

function requestedMonth(value) {
  const raw = value instanceof Date ? value.toISOString().slice(0, 7) : clean(value);
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(raw) ? raw : "";
}

function validateRow(rawRow, rowNumber, headers, targetMonth) {
  const contentId = clean(cell(rawRow, headers, "Content ID"));
  const values = Object.fromEntries(CANONICAL_HEADERS.map((field) => [field, cell(rawRow, headers, field)]));
  const publishDate = parseDate(values["Publish Date"]);
  const record = {
    contentId,
    contentType: clean(values["Content Type"]),
    templateId: clean(values["Template ID"]),
    trigger: clean(values.Trigger),
    publishDate,
    assetPaths: splitList(values["Asset Paths"]),
    hook: clean(values.Hook),
    caption: clean(values.Caption),
    hashtags: splitHashtags(values.Hashtags),
    campaignId: clean(values["Campaign ID"]),
    campaignWeek: Number(values["Campaign Week"]),
    outputFormat: clean(values["Output Format"]).toLowerCase(),
    generationStatus: clean(values["Generation Status"]).toLowerCase()
  };
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    const value = field === "Publish Date" ? publishDate : field === "Asset Paths" ? record.assetPaths.length : field === "Hashtags" ? record.hashtags.length : values[field];
    if (value === "" || value === undefined || value === null || value === 0 || value === false) errors.push(error(rowNumber, field, "is required", contentId));
  }
  if (publishDate && !publishDate.startsWith(`${targetMonth}-`)) return { record, errors };
  if (record.contentType && !CONTENT_TYPES.includes(record.contentType)) errors.push(error(rowNumber, "Content Type", `must be one of: ${CONTENT_TYPES.join(", ")}`, contentId));
  if (record.contentType && record.templateId && record.templateId !== TEMPLATE_IDS[record.contentType]) errors.push(error(rowNumber, "Template ID", `must be ${TEMPLATE_IDS[record.contentType]} for ${record.contentType}`, contentId));
  if (record.trigger && !TRIGGERS.includes(record.trigger)) errors.push(error(rowNumber, "Trigger", `must be one of: ${TRIGGERS.join(", ")}`, contentId));
  if (record.contentType && record.outputFormat && record.outputFormat !== OUTPUT_FORMATS[record.contentType]) errors.push(error(rowNumber, "Output Format", `must be ${OUTPUT_FORMATS[record.contentType]} for ${record.contentType}`, contentId));
  if (record.generationStatus && !GENERATION_STATUSES.includes(record.generationStatus)) errors.push(error(rowNumber, "Generation Status", `must be one of: ${GENERATION_STATUSES.join(", ")}`, contentId));
  if (!Number.isInteger(record.campaignWeek) || record.campaignWeek < 1 || record.campaignWeek > 5) errors.push(error(rowNumber, "Campaign Week", "must be an integer from 1 to 5", contentId));
  return { record, errors };
}

export function loadSocialCalendar({ workbookPath, month, sheetName = "Content Calendar" } = {}) {
  const targetMonth = requestedMonth(month);
  if (!targetMonth) return { valid: false, month: clean(month), records: [], errors: [{ row: 0, contentId: "", field: "month", message: "must use YYYY-MM format" }] };
  if (!workbookPath) return { valid: false, month: targetMonth, records: [], errors: [{ row: 0, contentId: "", field: "workbookPath", message: "is required" }] };

  let workbook;
  try {
    workbook = XLSX.readFile(workbookPath, { cellDates: true });
  } catch (loadError) {
    return { valid: false, month: targetMonth, records: [], errors: [{ row: 0, contentId: "", field: "workbookPath", message: loadError.message }] };
  }
  const selectedSheet = workbook.Sheets[sheetName] ?? workbook.Sheets[workbook.SheetNames[0]];
  if (!selectedSheet) return { valid: false, month: targetMonth, records: [], errors: [{ row: 0, contentId: "", field: "sheet", message: "workbook has no worksheets" }] };
  const rows = XLSX.utils.sheet_to_json(selectedSheet, { header: 1, defval: "", raw: true });
  const headers = headerMap(rows[0] ?? []);
  const errors = [];
  for (const field of CANONICAL_HEADERS) if (!headers.has(normalizeHeader(field))) errors.push(error(1, field, "header is required"));
  if (errors.length) return { valid: false, month: targetMonth, records: [], errors };

  const records = [];
  const seen = new Map();
  for (let index = 1; index < rows.length; index += 1) {
    if (rows[index].every((value) => clean(value) === "")) continue;
    const result = validateRow(rows[index], index + 1, headers, targetMonth);
    if (!result.record.publishDate || result.record.publishDate.startsWith(`${targetMonth}-`)) {
      if (result.record.contentId && seen.has(result.record.contentId)) {
        errors.push(error(index + 1, "Content ID", `duplicates row ${seen.get(result.record.contentId)}`, result.record.contentId));
      } else if (result.record.contentId) {
        seen.set(result.record.contentId, index + 1);
      }
      errors.push(...result.errors);
      if (result.record.publishDate.startsWith(`${targetMonth}-`)) records.push(result.record);
    }
  }
  records.sort((left, right) => left.publishDate.localeCompare(right.publishDate) || left.contentId.localeCompare(right.contentId));
  return { valid: errors.length === 0, month: targetMonth, records, errors };
}
