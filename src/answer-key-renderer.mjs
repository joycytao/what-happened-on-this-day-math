import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { validateContent } from "./content-validation.mjs";

export const ANSWER_KEY_TEMPLATE = {
  version: "1.0.0",
  filename: "template-05.png",
  width: 1545,
  height: 1999,
  pages: 6,
  slotsPerPage: 16,
};

const LEVELS = ["level1", "level2", "level3"];
const BOXES = { left: 155, right: 785, width: 605, top: 245, height: 180, rowGap: 12 };

export function renderAnswerKeyPages(content, options = {}) {
  const validation = validateContent(content);
  if (!validation.valid) throw new Error(`content validation failed:\n${validation.errors.join("\n")}`);
  const template = options.template ?? ANSWER_KEY_TEMPLATE;
  if (template.version !== ANSWER_KEY_TEMPLATE.version || template.filename !== ANSWER_KEY_TEMPLATE.filename) {
    throw new Error(`unsupported Answer Key template; expected ${ANSWER_KEY_TEMPLATE.filename} v${ANSWER_KEY_TEMPLATE.version}`);
  }

  return LEVELS.flatMap((level) => {
    const entries = content.answerKey[level];
    if (entries.length > 32) throw new Error(`${level} has too many entries for the Answer Key layout`);
    return [0, 1].map((pageIndex) => renderAnswerKeyPage(level, entries.slice(pageIndex * 16, (pageIndex + 1) * 16), pageIndex));
  });
}

export async function loadAnswerKeyTemplate(root = join(dirname(fileURLToPath(import.meta.url)), "..")) {
  const manifest = JSON.parse(await readFile(join(root, "assets/templates/v1/manifest.json"), "utf8"));
  const variant = manifest.canonicalVariants.find((candidate) => candidate.id === "answer-key");
  if (!variant || variant.filename !== ANSWER_KEY_TEMPLATE.filename) throw new Error("manifest does not define the canonical Answer Key template");
  return { ...variant, version: manifest.version };
}

function renderAnswerKeyPage(level, entries, pageIndex) {
  const boxes = Array.from({ length: 16 }, (_, index) => {
    const x = index % 2 === 0 ? BOXES.left : BOXES.right;
    const y = BOXES.top + Math.floor(index / 2) * (BOXES.height + BOXES.rowGap);
    return renderEntryBox(entries[index], x, y, pageIndex * 16 + index + 1);
  }).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1545" height="1999" viewBox="0 0 1545 1999" data-template-variant="answer-key" data-template-version="1.0.0" data-level="${level}" data-page="${pageIndex + 1}">
  <rect width="1545" height="1999" fill="#faf8f8"/>
  <text x="145" y="160" fill="#153657" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="700">Answer Keys (${level.replace("level", "Level ")})</text>
  ${boxes}
  <g transform="translate(1305 1710)" fill="none" stroke="#f18a5b" stroke-width="6"><path d="M100 8 190 62v112l-90 54-90-54V62Z"/><path d="M45 139h110"/><circle cx="153" cy="139" r="4" fill="#f18a5b"/></g>
  <text x="1405" y="1825" fill="#f18a5b" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="78" font-weight="700">6</text>
  <text x="1458" y="1827" fill="#f18a5b" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28">pm</text>
  <text x="1405" y="1870" fill="#f18a5b" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="25">studio</text>
</svg>`;
}

function renderEntryBox(entry, x, y, questionNumber) {
  const answerLines = entry ? wrap(entry.finalAnswer, 38) : [];
  const content = entry ? [`Q${questionNumber}: ${answerLines[0]}`, ...answerLines.slice(1)] : [];
  if (content.length > 7) throw new Error(`${entry.entryId} answer exceeds the template box capacity; shorten finalAnswer`);
  const lines = content.map((line, index) => `<text x="${x + 18}" y="${y + 46 + index * 30}" fill="#111" font-family="Arial, Helvetica, sans-serif" font-size="30">${escapeXml(line)}</text>`).join("\n");
  return `<rect x="${x}" y="${y}" width="${BOXES.width}" height="${BOXES.height}" fill="none" stroke="#111" stroke-width="3"/>${lines}`;
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
