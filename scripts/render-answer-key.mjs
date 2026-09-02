import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { loadAnswerKeyTemplate, renderAnswerKeyPages } from "../src/answer-key-renderer.mjs";

const [inputPath, outputDirectory] = process.argv.slice(2);
if (!inputPath || !outputDirectory) {
  console.error("Usage: node scripts/render-answer-key.mjs <monthly-content.json> <output-directory>");
  process.exit(2);
}

const content = JSON.parse(await readFile(inputPath, "utf8"));
const template = await loadAnswerKeyTemplate();
const pages = renderAnswerKeyPages(content, { template });
await mkdir(outputDirectory, { recursive: true });
for (const [index, page] of pages.entries()) await writeFile(join(outputDirectory, `answer-key-${String(index + 1).padStart(2, "0")}.svg`), `${page}\n`, "utf8");
console.log(`rendered ${pages.length} Answer Key pages with ${template.filename} v${template.version} to ${outputDirectory}`);
