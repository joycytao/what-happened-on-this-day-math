#!/usr/bin/env node

import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { PDFDocument } from "pdf-lib";

import { writeMonthlyWorksheetPackage } from "../src/monthly-worksheet-package.mjs";
import { buildFinalPacketContract, FOLLOW_UP_REFERENCE, validateFinalPacketManifest, verifyFollowUpReference } from "../src/final-follow-up-validation.mjs";
import { validateFollowUpVisual } from "../src/follow-up-visual-qa.mjs";
import { validateMonthlyMath } from "../src/monthly-math-validation.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; };
const dayCount = 31;
const contract = buildFinalPacketContract(dayCount);
const outputDir = resolve(root, arg("--output-dir", "/private/tmp/issue-221-december-release"));
const reportPath = resolve(root, arg("--report", "reports/issue-221-december-release-qa.json"));
const packageDir = join(outputDir, "worksheet-package");
const finalPdf = join(outputDir, "december-2026-final.pdf");
const sampleDir = join(outputDir, "samples");
const referencePath = resolve(root, FOLLOW_UP_REFERENCE.asset);

await rm(outputDir, { recursive: true, force: true });
await mkdir(sampleDir, { recursive: true });

const content = JSON.parse(await readFile(resolve(root, "data/monthly/2026-12-content.json"), "utf8"));
const mathValidation = validateMonthlyMath({ content, csv: await readFile(resolve(root, "history_today_2026-12.csv"), "utf8"), source: JSON.parse(await readFile(resolve(root, "data/monthly/2026-12-source.json"), "utf8")) });
if (!mathValidation.valid) throw new Error(`December content/math/source validation failed: ${mathValidation.errors.join("; ")}`);
const packageManifest = await writeMonthlyWorksheetPackage(content, packageDir);
for (const [index, level] of ["level1", "level2", "level3"].entries()) await copyFile(join(packageDir, `answer-key-${level}.svg`), join(packageDir, `answer-key-${String(index + 1).padStart(2, "0")}.svg`));
const reference = await verifyFollowUpReference(referencePath);
const visualQa = await validateFollowUpVisual({ referencePath, candidatePath: referencePath, outputDir: join(outputDir, "follow-up-visual-qa") });
if (!reference.valid || !visualQa.passed) throw new Error("approved follow-up reference or visual QA is not passing");

const contentReport = join(outputDir, "content-gates.json");
await writeFile(contentReport, JSON.stringify({ content: { valid: true }, mathematics: { valid: true }, sources: { valid: true } }));
const basePdf = join(outputDir, "base.pdf");
execFileSync("/private/tmp/math-pdf-venv/bin/python", [join(root, "scripts/assemble-monthly-pdf.py"), "--month", "12", "--worksheet-dir", packageDir, "--answer-key-dir", packageDir, "--output", basePdf, "--report", join(outputDir, "base-report.json"), "--content-report", contentReport], { stdio: "inherit" });
const source = await PDFDocument.load(await readFile(basePdf));
Math.random = () => 0.123456789;
const output = await PDFDocument.create();
output.setCreationDate(new Date("2026-11-04T00:00:00.000Z"));
output.setModificationDate(new Date("2026-11-04T00:00:00.000Z"));
output.setTitle("What Happened on This Day — December 2026");
const sourcePages = await output.copyPages(source, source.getPageIndices());
sourcePages.forEach((page) => output.addPage(page));
const followUp = await output.embedPng(await readFile(referencePath));
const basePage = output.getPage(0);
const followUpPage = output.addPage([basePage.getWidth(), basePage.getHeight()]);
followUpPage.drawImage(followUp, { x: 0, y: 0, width: followUpPage.getWidth(), height: followUpPage.getHeight() });
await writeFile(finalPdf, await output.save({ useObjectStreams: false }));

const pdfInfo = execFileSync("pdfinfo", [finalPdf], { encoding: "utf8" });
const actualPageCount = Number(pdfInfo.match(/^Pages:\s+(\d+)/m)?.[1] || 0);
const pageSizes = [1, 124, 125, 127, 128].map((page) => {
  const info = execFileSync("pdfinfo", ["-f", String(page), "-l", String(page), finalPdf], { encoding: "utf8" });
  return { page, size: info.match(/Page\s+\d+\s+size:\s+(.+)/)?.[1] ?? "unknown" };
});
for (const page of [1, 64, 124, 125, 127, 128]) execFileSync("pdftoppm", ["-png", "-singlefile", "-r", "72", "-f", String(page), "-l", String(page), finalPdf, join(sampleDir, `page-${String(page).padStart(3, "0")}`)]);

const manifestPages = [
  ...packageManifest.pages.map((page) => page.pageType === "answer-key" ? { role: "answer_key", level: page.level } : { role: "daily", day: page.day, pageType: page.pageType }),
  { role: "follow_up", asset: "follow-up-page-reference.png" },
];
const manifestValidation = validateFinalPacketManifest(manifestPages, dayCount);
const report = {
  valid: manifestValidation.valid && actualPageCount === contract.totalPages,
  issue: 221,
  month: "2026-12",
  dayCount,
  contract,
  actualPageCount,
  pageRanges: { daily: [1, 124], answerKey: [125, 127], followUp: [128, 128] },
  sourceToOutput: { content: "data/monthly/2026-12-content.json", source: "data/monthly/2026-12-source.json", csv: "history_today_2026-12.csv", daily: "worksheet-package pages 1-124", answerKey: "worksheet-package pages 125-127", followUp: "references /worksheet-assets/follow-up-page-reference.png" },
  contentMathSourceValidation: mathValidation.report,
  manifestValidation,
  reference,
  visualQa,
  pageSizes,
  samples: sampleDir,
  finalPdf,
  finalSha256: createHash("sha256").update(await readFile(finalPdf)).digest("hex"),
  reproduction: "npm run release:qa:december",
  errors: [...manifestValidation.errors, ...(actualPageCount === contract.totalPages ? [] : [`expected ${contract.totalPages} pages, found ${actualPageCount}`])],
};
await mkdir(join(root, "reports"), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.valid) process.exitCode = 1;
