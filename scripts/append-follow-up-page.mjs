#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { appendFollowUpPage, fileExists, validateFollowUpArtifact } from "../src/follow-up-assembly.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; };
const month = Number(arg("--month", "11"));
const dayCount = Number(arg("--day-count", month === 11 ? "30" : "31"));
const coverPages = Number(arg("--cover-pages", month === 11 ? "1" : "0"));
const sourcePdf = resolve(root, arg("--source-pdf", "output/pdf/november-worksheet-packet-final.pdf"));
const followUpPdf = resolve(root, arg("--follow-up-pdf", "output/follow-up/follow-up-page.pdf"));
const finalPdf = resolve(root, arg("--final-pdf", "output/pdf/november-worksheet-packet-final-follow-up.pdf"));
const artifactPath = resolve(root, arg("--artifact-manifest", "reports/follow-up-page-manifest.json"));
const visualQaPath = resolve(root, arg("--visual-qa", "reports/follow-up-visual-qa/visual-qa.json"));
const reportPath = resolve(root, arg("--report", "reports/issue-117-follow-up-assembly.json"));

function json(path) { try { return JSON.parse(readFileSync(path, "utf8")); } catch { return {}; } }
function pageCount(path) {
  try { return Number(execFileSync("pdfinfo", [path], { encoding: "utf8" }).match(/^Pages:\s+(\d+)/m)?.[1] || 0); } catch { return 0; }
}

async function main() {
  const sourcePageCount = pageCount(sourcePdf);
  const validation = validateFollowUpArtifact({ artifact: json(artifactPath), visualQa: json(visualQaPath), sourcePageCount, dayCount, coverPages, finalExists: await fileExists(finalPdf) });
  const report = { valid: validation.valid, issue: 117, month, dayCount, cover_pages: coverPages, sourcePageCount, follow_up_pages: 1, expectedFinalPageCount: validation.contract?.finalPageCount ?? null, actualFinalPageCount: null, pageOneRole: validation.contract?.pageOneRole ?? null, finalPageRole: "follow-up", mappings: validation.contract?.mappings ?? null, recoveryLoop: validation.recoveryLoop, artifacts: { sourcePdf, followUpPdf, finalPdf, report: reportPath }, errors: validation.errors };
  await mkdir(dirname(reportPath), { recursive: true });
  if (!validation.valid) {
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.error(`follow-up assembly blocked: ${validation.errors.join("; ")}`);
    process.exitCode = 1;
    return;
  }
  const merged = await appendFollowUpPage({ sourcePdf, followUpPdf, finalPdf });
  report.actualFinalPageCount = merged.finalPageCount;
  report.finalSha256 = merged.finalSha256;
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main().catch(async (error) => {
  const report = { valid: false, issue: 117, errors: [error instanceof Error ? error.message : String(error)] };
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.error(error.message);
  process.exitCode = 1;
});
