import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { loadAnswerKeyTemplate, renderAnswerKeyPages } from "./answer-key-renderer.mjs";
import { loadLevel1Template, renderLevel1 } from "./level1-renderer.mjs";
import { loadLevel2Template, renderLevel2 } from "./level2-renderer.mjs";
import { loadLevel3Template, renderLevel3 } from "./level3-renderer.mjs";
import { loadReadingPassageTemplate, renderReadingPassage } from "./reading-passage-renderer.mjs";
import { validateSvgTextGeometry } from "./svg-layout-validation.mjs";

export const DAILY_WIDTH = 1545;
export const DAILY_HEIGHT = 2000;
export const ANSWER_KEY_WIDTH = 1545;
export const ANSWER_KEY_HEIGHT = 1999;
export const DAILY_PAGE_TYPES = ["reading-passage", "level1", "level2", "level3"];
export const ANSWER_KEY_LEVELS = ["level1", "level2", "level3"];

export async function renderMonthlyWorksheetPackage(content, options = {}) {
  const [readingTemplate, level1Template, level2Template, level3Template, answerTemplate] = await Promise.all([
    loadReadingPassageTemplate(options.root), loadLevel1Template(options.root), loadLevel2Template(options.root),
    loadLevel3Template(options.root), loadAnswerKeyTemplate(options.root),
  ]);
  const dailyPages = [];
  for (const day of content.days) {
    const date = day.date;
    const rendered = [
      ["reading-passage", () => renderReadingPassage(day, { template: readingTemplate })],
      ["level1", () => renderLevel1(day, { template: level1Template, allowExtendedPrompt: true })],
      ["level2", () => renderLevel2(day, { template: level2Template, allowExtendedPrompt: true })],
      ["level3", () => renderLevel3(day, { template: level3Template, allowExtendedPrompt: true })],
    ];
    for (const [pageType, render] of rendered) {
      dailyPages.push({ pageNumber: dailyPages.length + 1, date, day: Number(date.slice(-2)), pageType, width: DAILY_WIDTH, height: DAILY_HEIGHT, svg: render() });
    }
  }
  const answerPages = renderAnswerKeyPages(content, { template: answerTemplate }).map((svg, index) => ({
    pageNumber: dailyPages.length + index + 1,
    month: content.month,
    date: null,
    pageType: "answer-key",
    level: ANSWER_KEY_LEVELS[index],
    width: ANSWER_KEY_WIDTH,
    height: ANSWER_KEY_HEIGHT,
    svg,
    entryIds: content.answerKey[ANSWER_KEY_LEVELS[index]].map((entry) => entry.entryId),
  }));
  const pages = [...dailyPages, ...answerPages];
  const expectedPageCount = content.days.length * DAILY_PAGE_TYPES.length + ANSWER_KEY_LEVELS.length;
  if (pages.length !== expectedPageCount) throw new Error(`expected ${expectedPageCount} pages, got ${pages.length}`);

  const errors = [];
  for (const page of pages) {
    const expectedWidth = page.pageType === "answer-key" ? ANSWER_KEY_WIDTH : DAILY_WIDTH;
    const expectedHeight = page.pageType === "answer-key" ? ANSWER_KEY_HEIGHT : DAILY_HEIGHT;
    if (!new RegExp(`<svg\\b[^>]*\\bwidth="${expectedWidth}"[^>]*\\bheight="${expectedHeight}"`).test(page.svg)) {
      errors.push(`${page.pageType} page ${page.pageNumber} has unexpected SVG dimensions`);
    }
    errors.push(...validateSvgTextGeometry(page.svg, {
      pageType: page.pageType,
      date: page.date ?? `${content.month}:${page.level}`,
      width: expectedWidth,
      height: expectedHeight,
    }));
  }
  if (errors.length) throw new Error(`monthly worksheet layout validation failed:\n${errors.join("\n")}`);

  const manifestPages = pages.map(({ svg, ...page }) => ({ ...page, sha256: sha256(svg) }));
  return {
    month: content.month,
    expectedPageCount,
    pageCount: pages.length,
    dailyPageCount: dailyPages.length,
    answerKeyPageCount: answerPages.length,
    pages,
    manifest: {
      schemaVersion: "1.0.0",
      month: content.month,
      pageCount: pages.length,
      expectedPageCount,
      pageDimensions: { daily: { width: DAILY_WIDTH, height: DAILY_HEIGHT }, answerKey: { width: ANSWER_KEY_WIDTH, height: ANSWER_KEY_HEIGHT } },
      pages: manifestPages,
    },
  };
}

export async function writeMonthlyWorksheetPackage(content, outputDirectory, options = {}) {
  const result = await renderMonthlyWorksheetPackage(content, options);
  await mkdir(outputDirectory, { recursive: true });
  for (const page of result.pages) {
    const filename = page.pageType === "answer-key"
      ? `answer-key-${page.level}.svg`
      : `${String(page.day).padStart(2, "0")}-${page.pageType}.svg`;
    await writeFile(join(outputDirectory, filename), `${page.svg}\n`, "utf8");
  }
  await writeFile(join(outputDirectory, "manifest.json"), `${JSON.stringify(result.manifest, null, 2)}\n`, "utf8");
  return result.manifest;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
