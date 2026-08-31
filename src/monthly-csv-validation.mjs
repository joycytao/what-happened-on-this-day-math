import { generateMonthDates } from "./calendar-pages.mjs";
import { CANONICAL_HEADERS, parseCsv } from "./monthly-csv.mjs";
import { calculateEquation, containsNumber } from "./content-validation.mjs";

const REQUIRED_TEXT_FIELDS = ["Emoji", "Title", "Hook", "Core_Story", "Math_Level_1", "Math_Level_2", "Math_Level_3"];
const ANSWER_FIELDS = ["Math_Answer_1", "Math_Answer_2", "Math_Answer_3"];
const SOURCE_FIELDS = ["Source_IDs", "Source_URLs", "Source_Titles", "Source_Accessed_Dates"];

export function validateMonthlyCsv(csv) {
  const errors = [];
  let rows;
  try {
    rows = parseCsv(csv);
  } catch (error) {
    return { valid: false, errors: [error.message], report: emptyReport() };
  }

  if (!sameRow(rows[0], CANONICAL_HEADERS)) {
    errors.push("header must match canonical headers exactly");
  }

  const dataRows = rows.slice(1);
  const month = inferMonth(dataRows);
  const expectedDates = month ? monthDates(month, errors) : [];
  const dates = [];
  const seenDates = new Set();

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    if (row.length !== CANONICAL_HEADERS.length) {
      errors.push(`row ${rowNumber} must contain ${CANONICAL_HEADERS.length} fields; found ${row.length}`);
      return;
    }
    const record = Object.fromEntries(CANONICAL_HEADERS.map((header, fieldIndex) => [header, row[fieldIndex]]));
    validateRow(record, rowNumber, errors);
    const date = record.Date;
    if (!isDate(date)) {
      errors.push(`row ${rowNumber} Date must be a real date in YYYY-MM-DD format`);
    } else {
      dates.push(date);
      if (seenDates.has(date)) errors.push(`dates must be unique; duplicate ${date} at row ${rowNumber}`);
      seenDates.add(date);
      if (month && !date.startsWith(`${month}-`)) errors.push(`row ${rowNumber} Date must be inside month ${month}`);
    }
  });

  const datesInOrder = expectedDates.length > 0 && dates.length === expectedDates.length && dates.every((date, index) => date === expectedDates[index]);
  if (expectedDates.length > 0 && !datesInOrder) errors.push("dates must be in chronological order and include every calendar date");
  if (expectedDates.length > 0 && dates.length !== expectedDates.length) errors.push(`expected ${expectedDates.length} dated rows for ${month}; found ${dates.length}`);

  return {
    valid: errors.length === 0,
    errors,
    report: { month, expectedDates: expectedDates.length || null, rowCount: dataRows.length, datesInOrder },
  };
}

function validateRow(record, rowNumber, errors) {
  for (const field of REQUIRED_TEXT_FIELDS) {
    if (!record[field]?.trim()) errors.push(`row ${rowNumber} ${field} must not be empty`);
  }
  if (!record.Date?.trim()) errors.push(`row ${rowNumber} Date must not be empty`);
  if (!record.Trivia?.trim()) errors.push(`row ${rowNumber} Trivia must not be empty`);
  if (record.Core_Story?.trim() && (wordCount(record.Core_Story) < 150 || wordCount(record.Core_Story) > 250)) {
    errors.push(`row ${rowNumber} Core_Story must contain 150-250 words`);
  }

  const trivia = parseJson(record.Trivia, `row ${rowNumber} Trivia`, errors);
  if (trivia !== undefined && (!Array.isArray(trivia) || trivia.length < 1 || trivia.length > 2)) {
    errors.push(`row ${rowNumber} Trivia must contain one or two items`);
  }
  if (Array.isArray(trivia) && trivia.some((item) => typeof item !== "string" || !item.trim())) {
    errors.push(`row ${rowNumber} Trivia items must be non-empty text`);
  }

  ANSWER_FIELDS.forEach((field) => validateAnswer(record[field], field, rowNumber, errors));
  const storyText = [record.Title, record.Hook, record.Core_Story, ...(Array.isArray(trivia) ? trivia : [])].join(" ");
  ["Math_Level_1", "Math_Level_2", "Math_Level_3"].forEach((field) => {
    const prompt = record[field];
    const numbers = prompt?.match(/\b\d+(?:\.\d+)?\b/g) || [];
    if (numbers.length === 0) errors.push(`row ${rowNumber} ${field} must contain at least one number`);
    if (numbers.some((number) => !numberAppearsInText(number, storyText) && !isExplicitTaskFact(prompt))) {
      errors.push(`row ${rowNumber} ${field} uses a number not found in Core_Story or explicitly defined in the task`);
    }
  });
  validateSources(record, rowNumber, errors);
}

function validateAnswer(value, field, rowNumber, errors) {
  if (!value?.trim()) {
    errors.push(`row ${rowNumber} ${field} must not be empty`);
    return;
  }
  const answer = parseJson(value, `row ${rowNumber} ${field}`, errors);
  if (!answer || typeof answer !== "object" || Array.isArray(answer)) {
    errors.push(`row ${rowNumber} ${field} must be a JSON object`);
    return;
  }
  for (const answerField of ["equation", "work", "finalAnswer"]) {
    if (typeof answer[answerField] !== "string" || !answer[answerField].trim()) errors.push(`row ${rowNumber} ${field}.${answerField} must not be empty`);
  }
  if (typeof answer.equation !== "string") return;
  const calculation = calculateEquation(answer.equation);
  if (!calculation.valid) {
    errors.push(`row ${rowNumber} ${field} equation is invalid: ${calculation.error}`);
  } else if (Math.abs(calculation.left - calculation.right) >= 1e-9) {
    errors.push(`row ${rowNumber} ${field} equation evaluates to ${formatNumber(calculation.left)}, not ${formatNumber(calculation.right)}`);
  } else if (typeof answer.finalAnswer === "string" && !containsNumber(answer.finalAnswer, calculation.left)) {
    errors.push(`row ${rowNumber} ${field}.finalAnswer must include computed result ${formatNumber(calculation.left)}`);
  }
}

function validateSources(record, rowNumber, errors) {
  const parsed = SOURCE_FIELDS.map((field) => parseJson(record[field], `row ${rowNumber} ${field}`, errors));
  if (parsed.some((value) => value === undefined)) return;
  if (parsed.some((value) => !Array.isArray(value))) {
    errors.push(`row ${rowNumber} Source_* fields must be JSON arrays`);
    return;
  }
  const [ids, urls, titles, accessedDates] = parsed;
  if (ids.length === 0) errors.push(`row ${rowNumber} Source_IDs must contain at least one source`);
  if (ids.some((id) => typeof id !== "string" || !id.trim()) || titles.some((title) => typeof title !== "string" || !title.trim())) {
    errors.push(`row ${rowNumber} Source_IDs and Source_Titles must contain non-empty text`);
  }
  if (!(ids.length === urls.length && ids.length === titles.length && ids.length === accessedDates.length)) {
    errors.push(`row ${rowNumber} Source_* fields must contain aligned arrays`);
  }
  urls.forEach((url) => { if (typeof url !== "string" || !url.startsWith("https://")) errors.push(`row ${rowNumber} Source_URLs must use https://`); });
  accessedDates.forEach((date) => { if (!isDate(date)) errors.push(`row ${rowNumber} Source_Accessed_Dates must contain real dates`); });
}

function parseJson(value, label, errors) {
  if (!value?.trim()) { errors.push(`${label} must not be empty`); return undefined; }
  try { return JSON.parse(value); } catch { errors.push(`${label} must contain valid JSON`); return undefined; }
}

function inferMonth(rows) {
  const date = rows.find((row) => row.length > 0)?.[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(date || "") ? date.slice(0, 7) : null;
}

function monthDates(month, errors) {
  const [year, monthNumber] = month.split("-").map(Number);
  try { return generateMonthDates(year, monthNumber); } catch { errors.push(`Date month ${month} must be a real calendar month`); return []; }
}

function isDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return parsed.toISOString().startsWith(value);
}

function wordCount(value) { return value.trim().split(/\s+/).filter(Boolean).length; }
function formatNumber(value) { return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6))); }
function sameRow(left, right) { return Array.isArray(left) && left.length === right.length && left.every((value, index) => value === right[index]); }
function emptyReport() { return { month: null, expectedDates: null, rowCount: 0, datesInOrder: false }; }
function numberAppearsInText(number, text) { return new RegExp(`(?<![\\d.])${number.replace(".", "\\.")}(?![\\d.])`).test(text); }
function isExplicitTaskFact(prompt) { return /\b(if|each|per|pretend|suppose|assume|classroom|model|unit|conversion|how many|days passed)\b/i.test(prompt); }
