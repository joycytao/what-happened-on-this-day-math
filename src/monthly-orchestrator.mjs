import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { calculateMonthlyPageCount } from "./calendar-pages.mjs";
import { renderOctoberWorksheetPages } from "./monthly-worksheet-renderer.mjs";
import { renderOctoberAnswerKeyPages } from "./answer-key-renderer.mjs";
import { validateOctoberContent, validateOctoberSources } from "./october-content-validation.mjs";

export const DEFAULT_CALENDAR_YEAR = 2026;
export const MONTHLY_TEMPLATE_VERSION = "1.0.0";

export function parseMonthlyArguments(argv) {
  const monthIndex = argv.indexOf("--month");
  const month = Number(monthIndex >= 0 ? argv[monthIndex + 1] : undefined);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("--month must be an integer from 1 through 12");
  }
  return { month };
}

export function buildMonthlyContract(month, year = DEFAULT_CALENDAR_YEAR) {
  const calendar = calculateMonthlyPageCount(year, month);
  return { month, dayCount: calendar.dayCount, dailyPagesPerDay: calendar.dailyPagesPerDay, answerKeyPages: calendar.answerKeyPages, totalPages: calendar.totalPages };
}

export async function generateMonthly({ month, root = projectRoot(), outputDirectory } = {}) {
  const contract = buildMonthlyContract(month);
  const contentPath = join(root, "content", "monthly", `month-${month}.json`);
  const researchPath = join(root, "research", "october-events.json");
  if (month !== 10 || !(await exists(contentPath))) throw new Error(`month ${month} is not ready for orchestration: missing validated monthly content artifact`);

  const content = JSON.parse(await readFile(contentPath, "utf8"));
  const research = JSON.parse(await readFile(researchPath, "utf8"));
  const contentValidation = validateOctoberContent(content, research);
  const sourceValidation = await validateOctoberSources(content);
  if (!contentValidation.valid || !sourceValidation.valid) throw new Error(`content/source validation failed; see ${contentValidation.content.errors.length + contentValidation.mathematics.errors.length + sourceValidation.errors.length} errors`);

  const outputDir = resolve(root, outputDirectory ?? join("output", "monthly", `month-${month}`));
  const worksheetDir = join(outputDir, "worksheet-pages");
  const answerKeyDir = join(outputDir, "answer-key-pages");
  const reportDir = join(outputDir, "validation");
  await mkdir(reportDir, { recursive: true });
  const worksheetPages = await renderOctoberWorksheetPages(content, { root });
  const answerKeyPages = renderOctoberAnswerKeyPages(content);
  if (worksheetPages.length !== contract.dayCount * contract.dailyPagesPerDay) throw new Error(`worksheet page count ${worksheetPages.length} does not match expected ${contract.dayCount * contract.dailyPagesPerDay}`);
  if (answerKeyPages.length !== contract.answerKeyPages) throw new Error(`Answer Key page count ${answerKeyPages.length} does not match expected ${contract.answerKeyPages}`);
  await writeWorksheetPages(worksheetDir, worksheetPages);
  await writeAnswerKeyPages(answerKeyDir, answerKeyPages);
  await writeJson(join(reportDir, "content-validation.json"), { ...contentValidation, sources: sourceValidation });
  await runNodeScript(root, "scripts/validate-october-worksheet-pages.mjs", worksheetDir);
  await runNodeScript(root, "scripts/validate-october-answer-key.mjs", answerKeyDir);
  await runPythonScript(root, "scripts/assemble-monthly-pdf.py", ["--month", String(month), "--worksheet-dir", worksheetDir, "--answer-key-dir", answerKeyDir, "--output", join(outputDir, `month-${month}-worksheet-packet.pdf`), "--report", join(reportDir, "pdf-qa.json"), "--content-report", join(reportDir, "content-validation.json")]);

  const report = { valid: true, month, templateVersion: MONTHLY_TEMPLATE_VERSION, source: contentPath, contract, actual: { worksheetPages: worksheetPages.length, answerKeyPages: answerKeyPages.length, totalPages: worksheetPages.length + answerKeyPages.length, order: "day then reading-passage, level1, level2, level3; Answer Key level1, level2, level3" }, validation: { content: true, mathematics: true, source: true, layout: true, pdf: true }, outputDirectory: outputDir };
  await writeJson(join(outputDir, "manifest.json"), report);
  return report;
}

async function writeWorksheetPages(directory, pages) {
  await mkdir(directory, { recursive: true });
  for (const page of pages) await writeFile(join(directory, `${String(page.day).padStart(2, "0")}-${page.pageType}.svg`), `${page.svg}\n`, "utf8");
  await writeJson(join(directory, "manifest.json"), { month: 10, pageCount: pages.length, expectedPageCount: pages.length, pages: pages.map(({ svg, ...page }) => page) });
}
async function writeAnswerKeyPages(directory, pages) {
  await mkdir(directory, { recursive: true });
  for (const page of pages) await writeFile(join(directory, `answer-key-${String(page.pageNumber).padStart(2, "0")}.svg`), `${page.svg}\n`, "utf8");
  await writeJson(join(directory, "manifest.json"), { month: 10, pageCount: pages.length, expectedPageCount: pages.length, pageDimensions: { width: 1545, height: 1999 }, pages: pages.map(({ svg, ...page }) => page) });
}
async function writeJson(path, value) { await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
async function exists(path) { try { await readFile(path); return true; } catch { return false; } }
function projectRoot() { return resolve(fileURLToPath(new URL("..", import.meta.url))); }
function runNodeScript(root, script, argument) { return run(process.execPath, [join(root, script), argument], root); }
function runPythonScript(root, script, args) { return run(process.env.PYTHON_BIN || "python3", [join(root, script), ...args], root); }
function run(command, args, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolvePromise() : reject(new Error(`${command} ${args.join(" ")} failed (${code}): ${stderr.trim()}`)));
  });
}
