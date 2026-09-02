import { readFile, writeFile } from "node:fs/promises";

import { loadLevel1Template, renderLevel1 } from "../src/level1-renderer.mjs";

const [inputPath, outputPath, requestedDate] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/render-level1.mjs <monthly-content.json> <output.svg> [YYYY-MM-DD]");
  process.exit(2);
}

const content = JSON.parse(await readFile(inputPath, "utf8"));
const days = Array.isArray(content?.days) ? content.days : [];
const day = requestedDate ? days.find((candidate) => candidate?.date === requestedDate) : days[0];
if (!day) {
  console.error(requestedDate ? `No daily record found for ${requestedDate}` : "Input must contain at least one daily record in days");
  process.exit(1);
}

const template = await loadLevel1Template();
const svg = renderLevel1(day, { template });
await writeFile(outputPath, `${svg}\n`, "utf8");
console.log(`rendered Level 1 ${day.date} with ${template.filename} v${template.version} to ${outputPath}`);
