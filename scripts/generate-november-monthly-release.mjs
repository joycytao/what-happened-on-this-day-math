#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  NOVEMBER_FINAL_PAGE_COUNT,
  NOVEMBER_SOURCE_PAGE_COUNT,
  NOVEMBER_TEMPLATE_VERSION,
  mergeApprovedNovemberCover,
  parseNovemberArguments,
  validateNovemberInputs,
  fileExists,
} from "../src/november-orchestration.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const paths = {
  contentReport: resolve(root, "reports/issue-56-november-content-validation.json"),
  mathematicsReport: resolve(root, "reports/issue-56-november-mathematics-validation.json"),
  sourceReport: resolve(root, "reports/issue-56-november-source-validation.json"),
  worksheetManifest: resolve(root, "reports/november-worksheet-pages/manifest.json"),
  answerKeyManifest: resolve(root, "reports/november-answer-key-pages/manifest.json"),
  coverManifest: resolve(root, "output/worksheet-cover/cover-manifest.json"),
  coverReport: resolve(root, "reports/issue-86-november-cover.json"),
  coverVisualQa: resolve(root, "reports/worksheet-cover-visual-qa/visual-qa.json"),
  sourcePdf: resolve(root, "output/pdf/november-worksheet-packet.pdf"),
  finalPdf: resolve(root, "output/pdf/november-worksheet-packet-final.pdf"),
  manifest: resolve(root, "reports/issue-61-november-orchestration.json"),
};

function json(path) { return JSON.parse(readFileSync(path, "utf8")); }
function requireRead(path) { return readFileSync(path, "utf8"); }
function pdfPages(path) {
  try { requireRead(path); } catch { return 0; }
  const output = execFileSync("pdfinfo", [path], { encoding: "utf8" });
  return Number(output.match(/^Pages:\s+(\d+)/m)?.[1] || 0);
}

async function main() {
  const parsed = parseNovemberArguments(args);
  const input = {
    contentReport: json(paths.contentReport),
    mathematicsReport: json(paths.mathematicsReport),
    sourceReport: json(paths.sourceReport),
    worksheetManifest: json(paths.worksheetManifest),
    answerKeyManifest: json(paths.answerKeyManifest),
    coverManifest: json(paths.coverManifest),
    coverReport: json(paths.coverReport),
    coverVisualQa: json(paths.coverVisualQa),
    sourcePdfPageCount: pdfPages(paths.sourcePdf),
    finalPdfExists: await fileExists(paths.finalPdf),
  };
  const validation = validateNovemberInputs(input);
  const report = { valid: validation.valid, issue: 61, month: parsed.month, templateVersion: parsed.templateVersion, expectedPageCounts: { source: NOVEMBER_SOURCE_PAGE_COUNT, final: NOVEMBER_FINAL_PAGE_COUNT }, ...validation, artifacts: { sourcePdf: paths.sourcePdf, finalPdf: paths.finalPdf, manifest: paths.manifest } };
  await mkdir(dirname(paths.manifest), { recursive: true });
  if (!validation.valid) {
    await writeFile(paths.manifest, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.error(`November release blocked: ${validation.errors.join("; ")}`);
    process.exitCode = 1;
    return;
  }
  await mergeApprovedNovemberCover({ coverPdf: paths.coverManifest.replace("cover-manifest.json", "november-worksheet-cover.pdf"), sourcePdf: paths.sourcePdf, finalPdf: paths.finalPdf });
  report.actualPageCounts = { source: pdfPages(paths.sourcePdf), final: pdfPages(paths.finalPdf) };
  await writeFile(paths.manifest, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main().catch(async (error) => {
  const report = { valid: false, issue: 61, month: 11, templateVersion: NOVEMBER_TEMPLATE_VERSION, errors: [error instanceof Error ? error.message : String(error)] };
  await mkdir(dirname(paths.manifest), { recursive: true });
  await writeFile(paths.manifest, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.error(error.message);
  process.exitCode = 1;
});
