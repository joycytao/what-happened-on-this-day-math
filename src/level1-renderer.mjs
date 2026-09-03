import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const LEVEL1_TEMPLATE = {
  version: "1.0.0",
  filename: "level-1.png",
  width: 1545,
  height: 2000,
};

const CONTENT = {
  card: { x: 145, y: 402, width: 1265, height: 280, radius: 16 },
  prompt: { x: 220, y: 515, maxCharacters: 55, lineHeight: 60, maxLines: 3 },
};

export function renderLevel1(day, options = {}) {
  validateLevel1Day(day);
  const template = options.template ?? LEVEL1_TEMPLATE;
  if (template.version !== LEVEL1_TEMPLATE.version || template.filename !== LEVEL1_TEMPLATE.filename) {
    throw new Error(`unsupported Level 1 template; expected ${LEVEL1_TEMPLATE.filename} v${LEVEL1_TEMPLATE.version}`);
  }

  const date = new Date(`${day.date}T00:00:00Z`);
  const month = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  const dayNumber = date.getUTCDate();
  const promptLines = wrapText(day.mathLevels.level1.prompt, CONTENT.prompt.maxCharacters);
  if (promptLines.length > CONTENT.prompt.maxLines) {
    throw new Error(`level1 prompt exceeds the template text area; ${promptLines.length} lines would be required (maximum ${CONTENT.prompt.maxLines})`);
  }

  const prompt = promptLines.map((line, index) => `<text x="${CONTENT.prompt.x}" y="${CONTENT.prompt.y + index * CONTENT.prompt.lineHeight}" fill="#153657" font-family="Arial, Helvetica, sans-serif" font-size="46">${escapeXml(line)}</text>`).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1545" height="2000" viewBox="0 0 1545 2000" data-template-variant="level1" data-template-version="1.0.0" data-date="${day.date}">
  <rect width="1545" height="2000" fill="#faf8f8"/>
  <g fill="#111" font-family="Arial, Helvetica, sans-serif">
    <text x="155" y="205" font-size="50" font-weight="700">Name:</text>
    <line x1="350" y1="210" x2="815" y2="210" stroke="#111" stroke-width="5"/>
    <text x="985" y="205" font-size="50" font-weight="700">Date:</text>
    <line x1="1155" y1="210" x2="1390" y2="210" stroke="#111" stroke-width="5"/>
  </g>
  <g fill="#111" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">
    <text x="772" y="365" font-size="47" font-weight="700">${month}</text>
    <text x="772" y="482" font-size="66" font-weight="700">${dayNumber}</text>
  </g>
  <rect x="${CONTENT.card.x}" y="${CONTENT.card.y}" width="${CONTENT.card.width}" height="${CONTENT.card.height}" rx="${CONTENT.card.radius}" fill="#faf8f8" stroke="#477db7" stroke-width="6"/>
  <rect x="212" y="348" width="315" height="106" fill="#dbe4f4"/>
  <text x="220" y="416" fill="#153657" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="700">Level</text>
  <circle cx="444" cy="402" r="42" fill="#c7f38b" stroke="#111" stroke-width="3"/>
  <text x="444" y="420" fill="#111" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="52" font-style="italic">1</text>
  ${prompt}
  <g transform="translate(1495 1876) scale(0.5) translate(-1495 -1876)">
    <g transform="translate(1305 1710)" fill="none" stroke="#f18a5b" stroke-width="6">
      <path d="M100 8 190 62v112l-90 54-90-54V62Z"/>
      <path d="M45 139h110"/>
      <circle cx="153" cy="139" r="4" fill="#f18a5b"/>
    </g>
    <text x="1405" y="1825" fill="#f18a5b" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="78" font-weight="700">6</text>
    <text x="1458" y="1827" fill="#f18a5b" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28">pm</text>
    <text x="1405" y="1870" fill="#f18a5b" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="25">studio</text>
  </g>
</svg>`;
}

export async function loadLevel1Template(root = join(dirname(fileURLToPath(import.meta.url)), "..")) {
  const manifest = JSON.parse(await readFile(join(root, "assets/templates/v1/manifest.json"), "utf8"));
  const variant = manifest.canonicalVariants.find((candidate) => candidate.id === "level-1");
  if (!variant || variant.filename !== LEVEL1_TEMPLATE.filename) throw new Error("manifest does not define the canonical Level 1 template");
  return { ...variant, version: manifest.version };
}

function validateLevel1Day(day) {
  if (!day || typeof day !== "object" || Array.isArray(day)) throw new Error("Level 1 record must be an object");
  if (typeof day.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day.date) || Number.isNaN(new Date(`${day.date}T00:00:00Z`).getTime())) {
    throw new Error("date must be a real date in YYYY-MM-DD format");
  }
  const level = day.mathLevels?.level1;
  if (!level || typeof level !== "object") throw new Error("mathLevels.level1 is required");
  if (level.pageType !== "level1") throw new Error("mathLevels.level1.pageType must be level1");
  if (typeof level.prompt !== "string" || level.prompt.trim() === "") throw new Error("mathLevels.level1.prompt is required");
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

function escapeXml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]);
}
