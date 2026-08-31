import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const READING_PASSAGE_TEMPLATE = {
  version: "1.0.0",
  filename: "reading-passage.png",
  width: 1545,
  height: 2000,
};

const CONTENT = {
  left: 155,
  right: 1390,
  lineHeight: 42,
  fontSize: 34,
  maxLines: 25,
};

export function renderReadingPassage(day, options = {}) {
  validateReadingPassage(day);
  const template = options.template ?? READING_PASSAGE_TEMPLATE;
  if (template.version !== READING_PASSAGE_TEMPLATE.version || template.filename !== READING_PASSAGE_TEMPLATE.filename) {
    throw new Error(`unsupported Reading Passage template; expected ${READING_PASSAGE_TEMPLATE.filename} v${READING_PASSAGE_TEMPLATE.version}`);
  }

  const date = new Date(`${day.date}T00:00:00Z`);
  const month = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  const dayNumber = date.getUTCDate();
  const titleLines = wrapText(day.title, 39);
  const hookLines = wrapText(day.hook, 66);
  const passageLines = wrapMarkdownText(day.readingPassage, 66);
  const triviaLines = day.trivia.flatMap((item) => wrapText(`Trivia: ${item}`, 66));
  const totalLines = titleLines.length + hookLines.length + passageLines.length + triviaLines.length;
  if (totalLines > CONTENT.maxLines) {
    throw new Error(`readingPassage content exceeds the template text area; ${totalLines} lines would be required (maximum ${CONTENT.maxLines})`);
  }

  let body = "";
  body += textBlock(titleLines, 610, 42, { fontSize: 42, weight: 700 });
  const hookY = 610 + titleLines.length * 52 + 22;
  body += textBlock(hookLines, hookY, CONTENT.lineHeight, { weight: 600 });
  const passageY = hookY + hookLines.length * CONTENT.lineHeight + 38;
  body += markdownTextBlock(passageLines, passageY, CONTENT.lineHeight);
  const triviaY = passageY + passageLines.length * CONTENT.lineHeight + 38;
  body += textBlock(triviaLines, triviaY, CONTENT.lineHeight, { size: 29 });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1545" height="2000" viewBox="0 0 1545 2000" data-template-variant="reading-passage" data-template-version="1.0.0">
  <rect width="1545" height="2000" fill="#faf8f8"/>
  <g fill="#111" font-family="Arial, Helvetica, sans-serif">
    <text x="155" y="205" font-size="50" font-weight="700">Name:</text>
    <line x1="350" y1="210" x2="815" y2="210" stroke="#111" stroke-width="5"/>
    <text x="985" y="205" font-size="50" font-weight="700">Date:</text>
    <line x1="1155" y1="210" x2="1390" y2="210" stroke="#111" stroke-width="5"/>
  </g>
  <g stroke="#111" fill="none" stroke-width="4">
    <rect x="690" y="305" width="165" height="82"/>
    <rect x="690" y="387" width="165" height="145"/>
  </g>
  <g fill="#111" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">
    <text x="772" y="365" font-size="47" font-weight="700">${escapeXml(month)}</text>
    <text x="772" y="482" font-size="66" font-weight="700">${dayNumber}</text>
    <text x="772" y="575" font-size="42">${escapeXml(day.emoji)}</text>
  </g>
  <g fill="#111" font-family="Arial, Helvetica, sans-serif">
    ${body}
  </g>
  <g transform="translate(1390 1815)" fill="none" stroke="#f18a5b" stroke-width="8">
    <path d="M0 50 45 20 90 50v58l-45 30-45-30Z"/>
  </g>
  <text x="1435" y="1890" fill="#f18a5b" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22">6pm studio</text>
</svg>`;
}

export async function loadReadingPassageTemplate(root = join(dirname(fileURLToPath(import.meta.url)), "..")) {
  const manifest = JSON.parse(await readFile(join(root, "assets/templates/v1/manifest.json"), "utf8"));
  const variant = manifest.canonicalVariants.find((candidate) => candidate.id === "reading-passage");
  if (!variant || variant.filename !== READING_PASSAGE_TEMPLATE.filename) {
    throw new Error("manifest does not define the canonical Reading Passage template");
  }
  return { ...variant, version: manifest.version };
}

function validateReadingPassage(day) {
  if (!day || typeof day !== "object" || Array.isArray(day)) throw new Error("reading passage record must be an object");
  for (const field of ["date", "emoji", "title", "hook", "readingPassage"]) {
    if (typeof day[field] !== "string" || day[field].trim() === "") throw new Error(`${field} is required`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || Number.isNaN(new Date(`${day.date}T00:00:00Z`).getTime())) {
    throw new Error("date must be a real date in YYYY-MM-DD format");
  }
  if (Array.from(day.emoji).length !== 1) throw new Error("emoji must contain exactly one emoji");
  if (!Array.isArray(day.trivia) || day.trivia.length < 1 || day.trivia.length > 2 || day.trivia.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error("trivia must contain one or two non-empty items");
  }
  const words = day.readingPassage.trim().split(/\s+/).filter(Boolean).length;
  if (words < 150 || words > 250) throw new Error(`readingPassage must contain 150-250 words; found ${words}`);
  if (!day.readingPassage.trim().split(/\n\s*\n/)[0].includes("?")) throw new Error("readingPassage first paragraph must contain a child-friendly question");
}

function wrapText(text, maxCharacters) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    if (line && line.length + word.length + 1 > maxCharacters) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function wrapMarkdownText(text, maxCharacters) {
  const tokens = text.replace(/\s+/g, " ").trim().match(/\*\*[^*]+\*\*|\S+/g) || [];
  const lines = [];
  let line = "";
  for (const token of tokens) {
    const visibleToken = token.replace(/\*\*/g, "");
    const visibleLine = line.replace(/\*\*/g, "");
    if (line && visibleLine.length + visibleToken.length + 1 > maxCharacters) {
      lines.push(line);
      line = token;
    } else {
      line = line ? `${line} ${token}` : token;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textBlock(lines, y, lineHeight, { size = CONTENT.fontSize, weight = 400 } = {}) {
  return lines.map((line, index) => `<text x="${CONTENT.left}" y="${y + index * lineHeight}" font-size="${size}" font-weight="${weight}">${escapeXml(line)}</text>`).join("\n");
}

function markdownTextBlock(lines, y, lineHeight) {
  return lines.map((line, index) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part) => part.startsWith("**")
      ? `<tspan font-weight="700">${escapeXml(part.slice(2, -2))}</tspan>`
      : escapeXml(part));
    return `<text x="${CONTENT.left}" y="${y + index * lineHeight}" font-size="${CONTENT.fontSize}">${parts.join("")}</text>`;
  }).join("\n");
}

function escapeXml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]);
}
