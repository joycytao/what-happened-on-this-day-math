#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { assembleMonthlyPackage, fileExists, validateMonthlyPackageInputs } from "../src/monthly-package-assembly.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; };
const dayCount = Number(arg("--day-count", "30"));
const outputPdf = resolve(root, arg("--output", "output/pdf/monthly-package-final.pdf"));
const reportPath = resolve(root, arg("--manifest", "reports/monthly-package-manifest.json"));
const paths = {
  cover: resolve(root, arg("--cover-pdf", "output/worksheet-cover/worksheet-cover.pdf")),
  daily: resolve(root, arg("--daily-pdf", "output/pdf/daily-worksheets.pdf")),
  answerKey: resolve(root, arg("--answer-key-pdf", "output/pdf/answer-key.pdf")),
  followUp: resolve(root, arg("--follow-up-pdf", "output/follow-up/follow-up-page.pdf")),
};
const manifestPaths = {
  cover: resolve(root, arg("--cover-manifest", "reports/worksheet-cover/manifest.json")),
  daily: resolve(root, arg("--daily-manifest", "reports/daily-worksheets/manifest.json")),
  answerKey: resolve(root, arg("--answer-key-manifest", "reports/answer-key/manifest.json")),
  followUp: resolve(root, arg("--follow-up-manifest", "reports/follow-up-page-manifest.json")),
  visualQa: resolve(root, arg("--visual-qa", "reports/follow-up-visual-qa/visual-qa.json")),
};

function json(path) { try { return JSON.parse(readFileSync(path, "utf8")); } catch { return {}; } }
function pageCount(path) { try { return Number(execFileSync("pdfinfo", [path], { encoding: "utf8" }).match(/^Pages:\s+(\d+)/m)?.[1] || 0); } catch { return 0; } }

async function main() {
  const pageCounts = Object.fromEntries(Object.entries(paths).map(([name, path]) => [name, pageCount(path)]));
  const manifests = Object.fromEntries(Object.entries(manifestPaths).map(([name, path]) => [name, json(path)]));
  const components = {
    cover: { ...manifests.cover, pageCount: pageCounts.cover },
    daily: { ...manifests.daily, pageCount: pageCounts.daily },
    answerKey: { ...manifests.answerKey, pageCount: pageCounts.answerKey },
    followUp: { ...manifests.followUp, pageCount: pageCounts.followUp, visualQa: manifests.visualQa },
  };
  const validation = validateMonthlyPackageInputs({ dayCount, components, finalExists: await fileExists(outputPdf) });
  const report = { valid: validation.valid, issue: 122, dayCount, expectedPageCount: validation.contract?.totalPages ?? null, actualPageCount: null, pageRanges: validation.pageRanges, pageOneRole: validation.pageOneRole, finalPageRole: validation.finalPageRole, components: paths, pageCounts, errors: validation.errors, recoveryLoop: validation.valid ? "not required" : "fix component -> regenerate -> rerun complete QA" };
  await mkdir(dirname(reportPath), { recursive: true });
  if (!validation.valid) {
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.error(`monthly package assembly blocked: ${validation.errors.join("; ")}`);
    process.exitCode = 1;
    return;
  }
  const assembled = await assembleMonthlyPackage({ dayCount, components: paths, componentManifests: components, pageCounts, outputPdf });
  Object.assign(report, { valid: true, actualPageCount: assembled.actualPageCount, pageRanges: assembled.pageRanges, componentChecksums: assembled.componentChecksums, finalSha256: assembled.finalSha256 });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main().catch(async (error) => {
  const report = { valid: false, issue: 122, errors: [error instanceof Error ? error.message : String(error)], recoveryLoop: "fix component -> regenerate -> rerun complete QA" };
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.error(error.message);
  process.exitCode = 1;
});
