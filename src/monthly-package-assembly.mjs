import { access, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

import { buildFinalPacketContract } from "./final-follow-up-validation.mjs";

const DAILY_TYPES = ["reading-passage", "level1", "level2", "level3"];

export function buildMonthlyPackageContract(dayCount) {
  const approved = buildFinalPacketContract(dayCount);
  return {
    dayCount: approved.dayCount,
    coverPages: approved.coverPages,
    dailyPages: approved.dailyPages,
    answerKeyPages: approved.answerKeyPages,
    followUpPages: approved.followUpPages,
    totalPages: approved.totalPages,
  };
}

function expectedDailyPages(dayCount) {
  return Array.from({ length: dayCount }, (_, index) => DAILY_TYPES.map((pageType) => ({ role: "daily", day: index + 1, pageType }))).flat();
}

function pageRanges(contract) {
  const coverStart = contract.coverPages ? 1 : null;
  const dailyStart = contract.coverPages + 1;
  const dailyEnd = contract.coverPages + contract.dailyPages;
  const answerKeyStart = dailyEnd + 1;
  const answerKeyEnd = answerKeyStart + contract.answerKeyPages - 1;
  return {
    cover: coverStart ? [coverStart, coverStart] : [],
    daily: [dailyStart, dailyEnd],
    answerKey: [answerKeyStart, answerKeyEnd],
    followUp: [contract.totalPages, contract.totalPages],
  };
}

export function validateMonthlyPackageInputs({ dayCount, components, finalExists = false } = {}) {
  const errors = [];
  let contract;
  try { contract = buildMonthlyPackageContract(dayCount); } catch (error) { errors.push(error.message); }
  if (!contract) return { valid: false, errors, pageRanges: null };

  const cover = components?.cover;
  if (contract.coverPages === 1) {
    if (!cover || cover.pageCount !== 1 || cover.pages?.length !== 1 || cover.pages[0]?.role !== "cover") {
      errors.push("cover component must contain exactly one page with role cover");
    }
  } else if (cover?.pageCount || cover?.pages?.length) {
    errors.push("31-day package contract does not permit an unapproved cover component");
  }

  const daily = components?.daily;
  const expectedDaily = expectedDailyPages(contract.dayCount);
  if (daily?.pageCount !== contract.dailyPages || daily.pages?.length !== contract.dailyPages) {
    errors.push(`daily component must contain exactly ${contract.dailyPages} pages`);
  } else if (JSON.stringify(daily.pages) !== JSON.stringify(expectedDaily)) {
    errors.push("daily component pages must remain in calendar order");
  }

  const answerKey = components?.answerKey;
  const expectedAnswerKey = ["level1", "level2", "level3"].map((level) => ({ role: "answer_key", level }));
  if (answerKey?.pageCount !== contract.answerKeyPages || answerKey.pages?.length !== contract.answerKeyPages) {
    errors.push("Answer Key component must contain exactly three pages");
  } else if (JSON.stringify(answerKey.pages) !== JSON.stringify(expectedAnswerKey)) {
    errors.push("Answer Key component pages must be ordered level1, level2, level3");
  }

  const followUp = components?.followUp;
  if (followUp?.pageCount !== 1 || followUp.pages?.length !== 1 || followUp.pages[0]?.role !== "follow_up" || followUp.pages[0]?.asset !== "follow-up-page-reference.png") {
    errors.push("follow-up component must contain exactly one approved follow-up page");
  }
  if (followUp?.visualQa?.passed !== true) errors.push("follow-up visual QA must pass before package assembly");
  if (!followUp?.visualQa?.artifacts?.length) errors.push("follow-up visual QA artifacts are required");
  if (finalExists) errors.push("stale final output exists; remove it before package assembly");

  return { valid: errors.length === 0, errors, contract, pageRanges: pageRanges(contract), pageOneRole: contract.coverPages ? "worksheet-coversheet" : "reading-passage", finalPageRole: "follow-up" };
}

export async function assembleMonthlyPackage({ dayCount, components, componentManifests, pageCounts, outputPdf }) {
  const validation = validateMonthlyPackageInputs({ dayCount, components: componentManifests, finalExists: false });
  if (!validation.valid) throw new Error(validation.errors.join("; "));
  const { PDFDocument } = await import("pdf-lib");
  const ordered = [];
  if (validation.contract.coverPages) ordered.push(["cover", components.cover]);
  ordered.push(["daily", components.daily], ["answerKey", components.answerKey], ["followUp", components.followUp]);
  const output = await PDFDocument.create();
  const componentChecksums = {};
  for (const [name, path] of ordered) {
    const bytes = await readFile(path);
    componentChecksums[name] = sha256(bytes);
    const document = await PDFDocument.load(bytes);
    const expected = validation.contract[name === "answerKey" ? "answerKeyPages" : `${name}Pages`];
    if (document.getPageCount() !== expected || pageCounts?.[name] !== expected) throw new Error(`${name} component page count must be ${expected}`);
    const pages = await output.copyPages(document, document.getPageIndices());
    pages.forEach((page) => output.addPage(page));
  }
  if (output.getPageCount() !== validation.contract.totalPages) throw new Error(`final package must contain ${validation.contract.totalPages} pages`);
  await writeFile(outputPdf, await output.save({ useObjectStreams: false }));
  return { ...validation, actualPageCount: output.getPageCount(), componentChecksums, finalSha256: sha256(await readFile(outputPdf)) };
}

export async function fileExists(path) {
  try { await access(path); return true; } catch { return false; }
}

function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
