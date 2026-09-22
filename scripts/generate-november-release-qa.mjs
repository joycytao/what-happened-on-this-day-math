#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const root = resolve(new URL("..", import.meta.url).pathname);
const errors = [];
const paths = {
  pdf: resolve(root, "output/pdf/november-worksheet-packet.pdf"),
  worksheets: resolve(root, "reports/november-worksheet-pages"),
  answerKey: resolve(root, "reports/november-answer-key-pages"),
  content: resolve(root, "reports/issue-56-november-content-validation.json"),
  mathematics: resolve(root, "reports/issue-56-november-mathematics-validation.json"),
  source: resolve(root, "reports/issue-56-november-source-validation.json"),
};

const validation = {
  content: await validateGate("content", paths.content),
  mathematics: await validateGate("mathematics", paths.mathematics),
  source: await validateGate("source", paths.source),
};
const daily = await validateDailyPages(paths.worksheets);
const answerKey = await validateAnswerKey(paths.answerKey);
const pdf = validatePdf(paths.pdf);
const visualInspection = rasterizeSamples(paths.pdf);
validation.layout = daily.errors.length === 0 && answerKey.errors.length === 0;
validation.pdf = pdf.errors.length === 0;

const report = {
  valid: errors.length === 0,
  issue: 60,
  month: 11,
  expectedPageCount: 123,
  actualPageCount: pdf.actualPageCount,
  sourceCoverage: { dailyDays: 30, dailyPages: 120, answerKeyPages: 3 },
  templateVersions: { daily: daily.templateVersion, answerKey: answerKey.templateVersion },
  validation,
  pageDimensions: {
    daily: { width: 1545, height: 2000 },
    answerKey: { width: 1545, height: 1999 },
    pdf: pdf.pageSizes,
  },
  visualInspection,
  errors,
  artifacts: {
    pdf: "output/pdf/november-worksheet-packet.pdf",
    humanReport: "reports/issue-60-november-pdf-qa.md",
    machineReport: "reports/issue-60-november-pdf-qa.json",
  },
};

await writeFile(resolve(root, "reports/issue-60-november-pdf-qa.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await writeFile(resolve(root, "reports/issue-60-november-pdf-qa.md"), renderMarkdown(report), "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.valid) process.exitCode = 1;

async function validateGate(gate, path) {
  try {
    const report = JSON.parse(await readFile(path, "utf8"));
    const valid = report.valid === true && Array.isArray(report.errors) && report.errors.length === 0;
    if (!valid) errors.push({ gate, artifact: path, reason: "upstream validation report is not passing" });
    return valid;
  } catch (error) {
    errors.push({ gate, artifact: path, reason: `cannot read validation report: ${error.message}` });
    return false;
  }
}

async function validateDailyPages(directory) {
  const result = { errors: [], templateVersion: "unknown" };
  let manifest;
  try { manifest = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8")); } catch (error) {
    result.errors.push({ artifact: "daily manifest", reason: error.message });
    errors.push(...result.errors);
    return result;
  }
  result.templateVersion = manifest.template?.version ?? "unknown";
  if (manifest.month !== 11 || manifest.pageCount !== 120 || manifest.pages?.length !== 120) {
    result.errors.push({ artifact: "daily manifest", reason: "November must contain 30 days × 4 daily pages = 120 pages" });
  }
  const types = ["reading-passage", "level1", "level2", "level3"];
  for (let index = 0; index < (manifest.pages ?? []).length; index += 1) {
    const page = manifest.pages[index];
    const day = Math.floor(index / 4) + 1;
    const pageType = types[index % 4];
    const pagePath = join(directory, `${String(day).padStart(2, "0")}-${pageType}.svg`);
    if (page.pageNumber !== index + 1 || page.day !== day || page.pageType !== pageType) {
      result.errors.push({ date: `2026-11-${String(day).padStart(2, "0")}`, page: index + 1, field: "ordering", reason: `expected ${pageType} for day ${day}` });
    }
    if (page.width !== 1545 || page.height !== 2000) result.errors.push({ date: `2026-11-${String(day).padStart(2, "0")}`, page: index + 1, field: "dimensions", reason: "expected 1545×2000 px" });
    try { await access(pagePath); } catch { result.errors.push({ date: `2026-11-${String(day).padStart(2, "0")}`, page: index + 1, artifact: pagePath, reason: "missing SVG page" }); }
  }
  errors.push(...result.errors);
  return result;
}

async function validateAnswerKey(directory) {
  const result = { errors: [], templateVersion: "unknown" };
  let manifest;
  try { manifest = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8")); } catch (error) {
    result.errors.push({ artifact: "answer key manifest", reason: error.message });
    errors.push(...result.errors);
    return result;
  }
  result.templateVersion = manifest.template?.version ?? "unknown";
  const levels = ["level1", "level2", "level3"];
  if (manifest.month !== 11 || manifest.pageCount !== 3 || manifest.pages?.length !== 3) result.errors.push({ artifact: "answer key manifest", reason: "expected three answer-key pages" });
  const entries = [];
  for (let index = 0; index < (manifest.pages ?? []).length; index += 1) {
    const page = manifest.pages[index];
    if (page.pageNumber !== index + 1 || page.level !== levels[index]) result.errors.push({ page: 121 + index, field: "ordering", reason: `expected ${levels[index]} answer key` });
    if (page.width !== 1545 || page.height !== 1999) result.errors.push({ page: 121 + index, field: "dimensions", reason: "expected 1545×1999 px" });
    entries.push(...(page.entryIds ?? []));
  }
  const expected = new Set(Array.from({ length: 30 }, (_, day) => levels.map((level) => `11-${String(day + 1).padStart(2, "0")}:${level}`)).flat());
  if (entries.length !== 90 || new Set(entries).size !== 90 || entries.some((entry) => !expected.has(entry))) result.errors.push({ field: "answer-key coverage", reason: "must cover every November day and level exactly once" });
  errors.push(...result.errors);
  return result;
}

function validatePdf(pdfPath) {
  const result = { errors: [], actualPageCount: 0, pageSizes: [] };
  try {
    const output = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
    result.actualPageCount = Number(output.match(/^Pages:\s+(\d+)/m)?.[1] || 0);
  } catch (error) {
    result.errors.push({ artifact: pdfPath, reason: `cannot inspect PDF: ${error.message}` });
    errors.push(...result.errors);
    return result;
  }
  if (result.actualPageCount !== 123) result.errors.push({ artifact: pdfPath, field: "page count", reason: `expected 123 pages, found ${result.actualPageCount}` });
  for (let page = 1; page <= Math.max(result.actualPageCount, 123); page += 1) {
    try {
      const info = execFileSync("pdfinfo", ["-f", String(page), "-l", String(page), pdfPath], { encoding: "utf8" });
      const size = info.match(/Page\s+\d+\s+size:\s+(.+)/)?.[1] ?? "unknown";
      if ([1, 120, 121, 122, 123].includes(page)) result.pageSizes.push({ page, size });
      const expected = page <= 120 ? "1158.75 x 1500" : "1158.75 x 1499.25";
      if (!size.includes(expected)) result.errors.push({ page, field: "PDF dimensions", reason: `expected ${expected} pts, found ${size}` });
    } catch (error) {
      result.errors.push({ page, field: "PDF page", reason: error.message });
    }
  }
  errors.push(...result.errors);
  return result;
}

function rasterizeSamples(pdfPath) {
  const pages = [1, 5, 60, 120, 121, 122, 123];
  const directory = join(tmpdir(), "november-release-qa-final");
  execFileSync("mkdir", ["-p", directory]);
  for (const page of pages) execFileSync("pdftoppm", ["-png", "-singlefile", "-r", "72", "-f", String(page), "-l", String(page), pdfPath, join(directory, `page-${String(page).padStart(3, "0")}`)]);
  return { pages, directory, note: "Rasterized representative first, middle, last daily pages and all three Answer Key pages; visual review must confirm order, margins, clipping, overflow, and legibility." };
}

function renderMarkdown(report) {
  const gates = ["content", "mathematics", "source", "layout", "pdf"].map((gate) => `${gate}: ${report.validation[gate] ? "PASS" : "FAIL"}`).join(", ");
  return `# November PDF release QA\n\n- Release status: ${report.valid ? "PASS" : "BLOCKED"}\n- Coverage: 30 days × 4 daily pages + 3 Answer Key pages = ${report.expectedPageCount} pages; PDF contains ${report.actualPageCount}.\n- Page order: daily pages are day-major (reading passage, Level 1, Level 2, Level 3), followed by Answer Key Levels 1–3.\n- Page dimensions: daily SVG 1545×2000 px; Answer Key SVG 1545×1999 px; PDF dimensions are recorded in the machine-readable report.\n- Content, mathematics, source, layout, and PDF gates: ${gates}.\n- Visual samples: pages ${report.visualInspection.pages.join(", ")} rasterized to ${report.visualInspection.directory}; inspect these for margins, clipping, overflow, ordering, and legibility.\n- Errors: ${report.errors.length === 0 ? "none" : report.errors.length}\n\nThis report is the final November release gate. Any failure is recorded with its date, page, field, artifact, and actionable reason in the JSON report.\n`;
}
