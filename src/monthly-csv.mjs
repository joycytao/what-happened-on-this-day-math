import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { validateContent } from "./content-validation.mjs";

export const CANONICAL_HEADERS = [
  "Date",
  "Emoji",
  "Title",
  "Hook",
  "Core_Story",
  "Trivia",
  "Math_Level_1",
  "Math_Level_2",
  "Math_Level_3",
  "Math_Answer_1",
  "Math_Answer_2",
  "Math_Answer_3",
  "Source_IDs",
  "Source_URLs",
  "Source_Titles",
  "Source_Accessed_Dates",
];

export function serializeMonthlyCsv(content) {
  assertValidContent(content);
  const sourceMap = new Map(content.sources.map((source) => [source.id, source]));
  const rows = [...content.days]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((day) => dailyRecordToRow(day, sourceMap));

  return serializeRows([CANONICAL_HEADERS, ...rows]);
}

export async function upsertMonthlyCsv(content, outputPath) {
  assertValidContent(content);
  let existingRows = [];

  if (await fileExists(outputPath)) {
    existingRows = parseCsv(await readFile(outputPath, "utf8"));
    if (!sameRow(existingRows[0], CANONICAL_HEADERS)) {
      throw new Error("existing CSV headers do not match canonical headers");
    }
    for (const [index, row] of existingRows.slice(1).entries()) {
      if (row.length !== CANONICAL_HEADERS.length) {
        throw new Error(`existing CSV row ${index + 2} has ${row.length} fields; expected ${CANONICAL_HEADERS.length}`);
      }
    }
  }

  const sourceMap = new Map(content.sources.map((source) => [source.id, source]));
  const generatedRows = [...content.days]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((day) => dailyRecordToRow(day, sourceMap));
  const rowsByDate = new Map(generatedRows.map((row) => [row[0], row]));
  const mergedRows = existingRows.length > 0 ? existingRows.slice(1).map((row) => rowsByDate.get(row[0]) || row) : [];
  const existingDates = new Set(mergedRows.map((row) => row[0]));
  for (const row of generatedRows) {
    if (!existingDates.has(row[0])) mergedRows.push(row);
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, serializeRows([CANONICAL_HEADERS, ...mergedRows]), "utf8");
}

export function parseCsv(csv) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (inQuotes) {
      if (character === '"' && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && csv[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (inQuotes) throw new Error("CSV contains an unterminated quoted field");
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value !== "")) rows.push(row);
  }
  return rows;
}

function dailyRecordToRow(day, sourceMap) {
  const sources = day.sourceIds.map((sourceId) => {
    const source = sourceMap.get(sourceId);
    if (!source) throw new Error(`${day.date} cites unknown source: ${sourceId}`);
    return source;
  });

  return [
    day.date,
    day.emoji,
    day.title,
    day.hook,
    day.readingPassage,
    JSON.stringify(day.trivia),
    day.mathLevels.level1.prompt,
    day.mathLevels.level2.prompt,
    day.mathLevels.level3.prompt,
    JSON.stringify(day.answers.level1),
    JSON.stringify(day.answers.level2),
    JSON.stringify(day.answers.level3),
    JSON.stringify(day.sourceIds),
    JSON.stringify(sources.map((source) => source.url)),
    JSON.stringify(sources.map((source) => source.title)),
    JSON.stringify(sources.map((source) => source.accessedDate)),
  ];
}

function serializeRows(rows) {
  return `${rows.map((row) => row.map(escapeCsvField).join(",")).join("\n")}\n`;
}

function escapeCsvField(value) {
  const stringValue = String(value ?? "");
  return /[",\r\n]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue;
}

function sameRow(left, right) {
  return Array.isArray(left) && left.length === right.length && left.every((value, index) => value === right[index]);
}

function assertValidContent(content) {
  const result = validateContent(content);
  if (!result.valid) throw new Error(`content validation failed:\n${result.errors.join("\n")}`);
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
