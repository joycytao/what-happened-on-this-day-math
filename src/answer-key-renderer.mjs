import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { validateContent } from "./content-validation.mjs";
import { validateMonthlyContentV2 } from "./monthly-content-v2-validation.mjs";

export const ANSWER_KEY_TEMPLATE = {
  version: "1.0.0",
  filename: "template-05.png",
  width: 1545,
  height: 1999,
  pages: 6,
  slotsPerPage: 32,
};

const LEVELS = ["level1", "level2", "level3"];
const BOXES = { left: 150, right: 782, leftWidth: 620, rightWidth: 612, top: 190, height: 100, rowGap: 10, rows: 16 };

export function renderAnswerKeyPages(content, options = {}) {
  const validation = validateContent(content);
  if (!validation.valid) throw new Error(`content validation failed:\n${validation.errors.join("\n")}`);
  const template = options.template ?? ANSWER_KEY_TEMPLATE;
  if (template.version !== ANSWER_KEY_TEMPLATE.version || template.filename !== ANSWER_KEY_TEMPLATE.filename) {
    throw new Error(`unsupported Answer Key template; expected ${ANSWER_KEY_TEMPLATE.filename} v${ANSWER_KEY_TEMPLATE.version}`);
  }

  return LEVELS.flatMap((level) => {
    const entries = content.answerKey[level];
    if (entries.length > 64) throw new Error(`${level} has too many entries for the Answer Key layout`);
    return [0, 1].map((pageIndex) => renderAnswerKeyPage(level, entries.slice(pageIndex * 32, (pageIndex + 1) * 32), pageIndex));
  });
}

export function renderOctoberAnswerKeyPages(content, options = {}) {
  const validation = validateMonthlyContentV2(content);
  if (!validation.valid) throw new Error(`cannot render invalid October content: ${validation.errors.join("; ")}`);

  const normalized = normalizeMonthlyContentV2(content);
  let rendered;
  try {
    rendered = renderAnswerKeyPages(normalized, options);
  } catch (error) {
    throw new Error(formatOctoberRenderError(error), { cause: error });
  }

  return rendered.map((svg, index) => {
    const level = LEVELS[Math.floor(index / 2)];
    const page = (index % 2) + 1;
    const entries = content.answerKey[level].slice((page - 1) * ANSWER_KEY_TEMPLATE.slotsPerPage, page * ANSWER_KEY_TEMPLATE.slotsPerPage);
    return {
      pageNumber: index + 1,
      month: content.month,
      level,
      page,
      width: ANSWER_KEY_TEMPLATE.width,
      height: ANSWER_KEY_TEMPLATE.height,
      entryIds: entries.map((entry) => entry.entryId),
      svg,
    };
  });
}

export async function loadAnswerKeyTemplate(root = join(dirname(fileURLToPath(import.meta.url)), "..")) {
  const manifest = JSON.parse(await readFile(join(root, "assets/templates/v1/manifest.json"), "utf8"));
  const variant = manifest.canonicalVariants.find((candidate) => candidate.id === "answer-key");
  if (!variant || variant.filename !== ANSWER_KEY_TEMPLATE.filename) throw new Error("manifest does not define the canonical Answer Key template");
  return { ...variant, version: manifest.version };
}

function renderAnswerKeyPage(level, entries, pageIndex) {
  const boxes = Array.from({ length: ANSWER_KEY_TEMPLATE.slotsPerPage }, (_, index) => {
    const x = index % 2 === 0 ? BOXES.left : BOXES.right;
    const y = BOXES.top + Math.floor(index / 2) * (BOXES.height + BOXES.rowGap);
    return renderEntryBox(entries[index], x, y, pageIndex * ANSWER_KEY_TEMPLATE.slotsPerPage + index + 1);
  }).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1545" height="1999" viewBox="0 0 1545 1999" data-template-variant="answer-key" data-template-version="1.0.0" data-level="${level}" data-page="${pageIndex + 1}">
  <rect width="1545" height="1999" fill="#faf8f8"/>
  <text x="145" y="160" fill="#153657" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="700">Answer Keys (${level.replace("level", "Level ")})</text>
  ${boxes}
  <g transform="translate(1400 1800) scale(0.45)" fill="none" stroke="#f18a5b" stroke-width="6"><path d="M100 8 190 62v112l-90 54-90-54V62Z"/><path d="M45 139h110"/><circle cx="153" cy="139" r="4" fill="#f18a5b"/>
    <text x="100" y="115" fill="#f18a5b" stroke="none" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="78" font-weight="700">6</text>
    <text x="153" y="117" fill="#f18a5b" stroke="none" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28">pm</text>
    <text x="100" y="160" fill="#f18a5b" stroke="none" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="25">studio</text>
  </g>
</svg>`;
}

function renderEntryBox(entry, x, y, questionNumber) {
  const answerLines = entry ? wrap(entry.finalAnswer, 38) : [];
  const content = entry ? [`Q${questionNumber}: ${answerLines[0]}`, ...answerLines.slice(1)] : [];
  if (content.length > 7) throw new Error(`${entry.entryId} answer exceeds the template box capacity; shorten finalAnswer`);
  const lines = content.map((line, index) => `<text x="${x + 18}" y="${y + 35 + index * 20}" fill="#111" font-family="Arial, Helvetica, sans-serif" font-size="20">${escapeXml(line)}</text>`).join("\n");
  const width = x === BOXES.left ? BOXES.leftWidth : BOXES.rightWidth;
  return `<rect x="${x}" y="${y}" width="${width}" height="${BOXES.height}" fill="none" stroke="#111" stroke-width="3"/>${lines}`;
}

function normalizeMonthlyContentV2(content) {
  const dateFor = (monthDay) => `2000-${monthDay}`;
  const days = content.days.map((day) => ({
    ...day,
    date: dateFor(`${String(day.month).padStart(2, "0")}-${String(day.day).padStart(2, "0")}`),
    answerKeyEntries: day.answerKeyEntries.map((entryId) => `${dateFor(entryId.slice(0, 5))}${entryId.slice(5)}`),
  }));
  const answerKey = Object.fromEntries(LEVELS.map((level) => [level, content.answerKey[level].map((entry) => ({
    ...entry,
    date: dateFor(entry.date),
    entryId: `${dateFor(entry.date)}:${level}`,
  }))]));
  return { schemaVersion: "1.0.0", month: "2000-10", days, answerKey, sources: content.sources };
}

function formatOctoberRenderError(error) {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/(2000-\d{2}-\d{2}):(level[123])/);
  if (!match) return message;
  return `failed to render ${match[1].slice(5)} ${match[2]}: ${message.replace(`${match[0]} `, "")}`;
}

function wrap(value, maxCharacters) {
  const words = String(value).replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    if (line && line.length + word.length + 1 > maxCharacters) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

function escapeXml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]);
}
