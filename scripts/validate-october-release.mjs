#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

import { validateOctoberContent, validateOctoberSources } from "../src/october-content-validation.mjs";
import { validateSvgTextGeometry } from "../src/svg-layout-validation.mjs";
import { buildOctoberReleaseReport, renderOctoberReleaseMarkdown } from "../src/october-release-report.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const args = parseArgs(process.argv.slice(2));
const content = JSON.parse(await readFile(join(root, "content/monthly/month-10.json"), "utf8"));
const research = JSON.parse(await readFile(join(root, "research/october-events.json"), "utf8"));
const contentResult = validateOctoberContent(content, research);
const sourceResult = await validateOctoberSources(content);
const layoutResult = await validateSvgArtifacts(join(root, "reports/october-worksheet-pages"), join(root, "reports/october-answer-key-pages"));
const pdfResult = validatePdf(args.pdf);
const report = buildOctoberReleaseReport({
  content: contentResult.content,
  mathematics: contentResult.mathematics,
  source: sourceResult,
  layout: layoutResult,
  pdf: pdfResult,
  visualInspection: renderVisualSamples(args.pdf),
});
report.details = { content: contentResult.content, mathematics: contentResult.mathematics, source: sourceResult, layout: layoutResult, pdf: pdfResult };
await mkdir(resolve(args.json, ".."), { recursive: true });
await writeFile(args.json, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await mkdir(resolve(args.markdown, ".."), { recursive: true });
await writeFile(args.markdown, renderOctoberReleaseMarkdown(report), "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.valid) process.exitCode = 1;

function parseArgs(argv) {
  const value = (name, fallback) => {
    const index = argv.indexOf(name);
    return index >= 0 ? argv[index + 1] : fallback;
  };
  return {
    pdf: resolve(root, value("--pdf", "output/pdf/october-worksheet-packet.pdf")),
    json: resolve(root, value("--json", "reports/issue-10-october-release.json")),
    markdown: resolve(root, value("--markdown", "reports/issue-10-october-release.md")),
  };
}

async function validateSvgArtifacts(worksheetDir, answerKeyDir) {
  const errors = [];
  const worksheetManifest = JSON.parse(await readFile(join(worksheetDir, "manifest.json"), "utf8"));
  const expectedTypes = ["reading-passage", "level1", "level2", "level3"];
  if (worksheetManifest.pageCount !== 124 || worksheetManifest.pages.length !== 124) errors.push("worksheet manifest must contain 124 pages");
  for (const [index, page] of worksheetManifest.pages.entries()) {
    const expectedDay = Math.floor(index / 4) + 1;
    const expectedType = expectedTypes[index % 4];
    if (page.pageNumber !== index + 1 || page.day !== expectedDay || page.pageType !== expectedType) errors.push(`worksheet page ${index + 1} is out of order`);
    const svgPath = join(worksheetDir, `${String(page.day).padStart(2, "0")}-${page.pageType}.svg`);
    const svg = await readFile(svgPath, "utf8");
    errors.push(...validateSvgTextGeometry(svg, page));
  }
  const answerManifest = JSON.parse(await readFile(join(answerKeyDir, "manifest.json"), "utf8"));
  const levels = ["level1", "level2", "level3"];
  if (answerManifest.pageCount !== 3 || answerManifest.pages.length !== 3) errors.push("Answer Key manifest must contain 3 pages");
  for (const [index, page] of answerManifest.pages.entries()) {
    if (page.pageNumber !== index + 1 || page.level !== levels[index]) errors.push(`Answer Key page ${index + 1} is out of order`);
    const svg = await readFile(join(answerKeyDir, `answer-key-${String(index + 1).padStart(2, "0")}.svg`), "utf8");
    if (!svg.includes('width="1545"') || !svg.includes('height="1999"') || (svg.match(/<rect x=/g) || []).length !== 32) errors.push(`Answer Key page ${index + 1} has invalid dimensions or cells`);
  }
  return { valid: errors.length === 0, errors, worksheetPages: worksheetManifest.pageCount, answerKeyPages: answerManifest.pageCount };
}

function validatePdf(pdfPath) {
  const first = execFileSync("pdfinfo", ["-f", "1", "-l", "1", pdfPath], { encoding: "utf8" });
  const last = execFileSync("pdfinfo", ["-f", "127", "-l", "127", pdfPath], { encoding: "utf8" });
  const pages = Number(first.match(/^Pages:\s+(\d+)/m)?.[1] || 0);
  return { valid: pages === 127 && /size:\s+1158\.75 x 1500/.test(first) && /size:\s+1158\.75 x 1499\.25/.test(last), actualPageCount: pages, firstPageSize: first.match(/size:\s+(.+)$/m)?.[1], lastPageSize: last.match(/size:\s+(.+)$/m)?.[1], path: pdfPath };
}

function renderVisualSamples(pdfPath) {
  const pages = [1, 2, 3, 4, 124, 125, 126, 127];
  const directory = join(tmpdir(), "october-release-qa");
  execFileSync("mkdir", ["-p", directory]);
  for (const page of pages) execFileSync("pdftoppm", ["-png", "-singlefile", "-r", "72", "-f", String(page), "-l", String(page), pdfPath, join(directory, `page-${String(page).padStart(3, "0")}`)]);
  return { valid: true, pages, directory, note: "Representative first/last daily pages and all Answer Key pages rasterized for visual inspection." };
}
