#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const root = resolve(new URL("..", import.meta.url).pathname);
const args = parseArgs(process.argv.slice(2));
const errors = [];
const contentReports = ["content", "mathematics", "source"].map((gate) => ({ gate, path: resolve(root, args[`${gate}Report`]) }));
const gateResults = {};
for (const { gate, path } of contentReports) {
  const report = JSON.parse(await readFile(path, "utf8"));
  gateResults[gate] = report.valid === true;
  if (!gateResults[gate]) errors.push(`${gate} gate is not valid: ${path}`);
}

const worksheet = await validateWorksheets(resolve(root, args.worksheetDir));
const answerKey = await validateAnswerKey(resolve(root, args.answerKeyDir));
errors.push(...worksheet.errors, ...answerKey.errors);
const pdf = validatePdf(resolve(root, args.pdf));
errors.push(...pdf.errors);
const visualInspection = renderVisualSamples(resolve(root, args.pdf));
const report = {
  valid: errors.length === 0,
  month: 11,
  expectedPageCount: 123,
  actualPageCount: pdf.actualPageCount,
  sourceCoverage: { dailyDays: 30, dailyPages: 120, answerKeyPages: 3 },
  templateVersions: { daily: worksheet.templateVersion, answerKey: answerKey.templateVersion },
  validation: { content: gateResults.content, mathematics: gateResults.mathematics, source: gateResults.source, layout: worksheet.errors.length === 0 && answerKey.errors.length === 0, pdf: pdf.errors.length === 0 },
  pageDimensions: { daily: { width: 1545, height: 2000 }, answerKey: { width: 1545, height: 1999 }, pdf: pdf.pageSizes },
  visualInspection,
  errors,
  output: args.pdf,
};
await mkdir(resolve(root, args.json, ".."), { recursive: true });
await writeFile(resolve(root, args.json), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await mkdir(resolve(root, args.markdown, ".."), { recursive: true });
await writeFile(resolve(root, args.markdown), renderMarkdown(report), "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.valid) process.exitCode = 1;

function parseArgs(argv) {
  const value = (name, fallback) => { const index = argv.indexOf(name); return index >= 0 ? argv[index + 1] : fallback; };
  return { worksheetDir: value("--worksheet-dir", "reports/november-worksheet-pages"), answerKeyDir: value("--answer-key-dir", "reports/november-answer-key-pages"), pdf: value("--pdf", "output/pdf/november-worksheet-packet.pdf"), json: value("--json", "reports/issue-59-november-release.json"), markdown: value("--markdown", "reports/issue-59-november-release.md"), contentReport: value("--content-report", "reports/issue-56-november-content-validation.json"), mathematicsReport: value("--mathematics-report", "reports/issue-56-november-mathematics-validation.json"), sourceReport: value("--source-report", "reports/issue-56-november-source-validation.json") };
}

async function validateWorksheets(directory) {
  const errors = [];
  const manifest = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8"));
  const types = ["reading-passage", "level1", "level2", "level3"];
  if (manifest.month !== 11 || manifest.pageCount !== 120 || manifest.expectedPageCount !== 120 || manifest.pages.length !== 120) errors.push("daily manifest must contain 120 November pages");
  const templateVersion = manifest.template?.version ?? "1.0.0";
  for (let index = 0; index < manifest.pages.length; index += 1) {
    const page = manifest.pages[index];
    const expectedDay = Math.floor(index / 4) + 1;
    const expectedType = types[index % 4];
    if (page.pageNumber !== index + 1 || page.day !== expectedDay || page.pageType !== expectedType) errors.push(`daily page ${index + 1} order is invalid`);
    if (page.width !== 1545 || page.height !== 2000) errors.push(`daily page ${index + 1} dimensions are invalid`);
    const path = join(directory, `${String(page.day).padStart(2, "0")}-${page.pageType}.svg`);
    try { await access(path); } catch { errors.push(`missing daily page ${path}`); continue; }
    const svg = await readFile(path, "utf8");
    if (!svg.includes('width="1545"') || !svg.includes('height="2000"')) errors.push(`daily page ${index + 1} SVG dimensions are invalid`);
  }
  return { errors, templateVersion };
}

async function validateAnswerKey(directory) {
  const errors = [];
  const manifest = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8"));
  const levels = ["level1", "level2", "level3"];
  if (manifest.month !== 11 || manifest.pageCount !== 3 || manifest.pages.length !== 3) errors.push("Answer Key manifest must contain three November pages");
  const templateVersion = manifest.template?.version ?? "1.0.0";
  const entries = [];
  for (let index = 0; index < manifest.pages.length; index += 1) {
    const page = manifest.pages[index];
    if (page.pageNumber !== index + 1 || page.level !== levels[index]) errors.push(`Answer Key page ${index + 1} order is invalid`);
    if (page.width !== 1545 || page.height !== 1999) errors.push(`Answer Key page ${index + 1} dimensions are invalid`);
    entries.push(...(page.entryIds || []));
    const svg = await readFile(join(directory, `answer-key-${String(index + 1).padStart(2, "0")}.svg`), "utf8");
    if (!svg.includes('width="1545"') || !svg.includes('height="1999"')) errors.push(`Answer Key page ${index + 1} SVG dimensions are invalid`);
  }
  const expected = new Set(Array.from({ length: 30 }, (_, day) => levels.map((level) => `11-${String(day + 1).padStart(2, "0")}:${level}`)).flat());
  if (entries.length !== 90 || new Set(entries).size !== 90 || entries.some((entry) => !expected.has(entry))) errors.push("Answer Key entries must cover every November day and level exactly once");
  return { errors, templateVersion };
}

function validatePdf(pdfPath) {
  const errors = [];
  const output = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
  const actualPageCount = Number(output.match(/^Pages:\s+(\d+)/m)?.[1] || 0);
  if (actualPageCount !== 123) errors.push(`PDF must contain 123 pages; found ${actualPageCount}`);
  const pageSizes = [];
  for (const page of Array.from({ length: 123 }, (_, index) => index + 1)) {
    const info = execFileSync("pdfinfo", ["-f", String(page), "-l", String(page), pdfPath], { encoding: "utf8" });
    const size = info.match(/Page\s+\d+\s+size:\s+(.+)/)?.[1] ?? "unknown";
    if ([1, 120, 121, 123].includes(page)) pageSizes.push({ page, size });
    const expected = page <= 120 ? "1158.75 x 1500" : "1158.75 x 1499.25";
    if (!size.includes(expected)) errors.push(`PDF page ${page} has unexpected size ${size}`);
  }
  return { errors, actualPageCount, pageSizes };
}

function renderVisualSamples(pdfPath) {
  const pages = [1, 2, 3, 4, 5, 120, 121, 122, 123];
  const directory = join(tmpdir(), "november-release-qa");
  execFileSync("mkdir", ["-p", directory]);
  for (const page of pages) execFileSync("pdftoppm", ["-png", "-singlefile", "-r", "72", "-f", String(page), "-l", String(page), pdfPath, join(directory, `page-${String(page).padStart(3, "0")}`)]);
  return { pages, directory, note: "Representative first, middle, last daily pages and all Answer Key pages rasterized for visual inspection." };
}

function renderMarkdown(report) {
  return `# November release QA\n\n- Month: ${report.month}\n- Expected pages: ${report.expectedPageCount}\n- Actual pages: ${report.actualPageCount}\n- Daily pages: 30 days × 4 types = 120\n- Answer Key pages: 3, ordered Level 1, Level 2, Level 3\n- Content gate: ${report.validation.content ? "PASS" : "FAIL"}\n- Mathematics gate: ${report.validation.mathematics ? "PASS" : "FAIL"}\n- Source gate: ${report.validation.source ? "PASS" : "FAIL"}\n- Layout gate: ${report.validation.layout ? "PASS" : "FAIL"}\n- PDF gate: ${report.validation.pdf ? "PASS" : "FAIL"}\n- Visual sample pages: ${report.visualInspection.pages.join(", ")}\n- Release status: ${report.valid ? "PASS" : "BLOCKED"}\n${report.errors.length ? `\n## Errors\n\n${report.errors.map((error) => `- ${error}`).join("\n")}\n` : ""}`;
}
