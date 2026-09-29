import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export const FOLLOW_UP_REFERENCE = {
  version: "1.0.0",
  asset: "references /worksheet-assets/follow-up-page-reference.png",
  sha256: "47a58a4831063ae84d99ccecc77efe9dbf7b9084154decd328bab20233e3e83e",
};

export function buildFinalPacketContract(dayCount) {
  if (dayCount !== 30 && dayCount !== 31) {
    throw new Error(`no approved packet page count exists for a ${dayCount}-day month`);
  }
  const dailyPages = dayCount * 4;
  const basePages = dayCount === 30 ? 124 : 127;
  return { dayCount, basePages, coverPages: basePages - dailyPages - 3, dailyPages, answerKeyPages: 3, followUpPages: 1, totalPages: basePages + 1 };
}

/**
 * Validate the logical page manifest after rendering, before PDF release.
 * Content, mathematics, and pixel-level visual QA remain separate gates.
 */
export function validateFinalPacketManifest(pages, dayCount) {
  const errors = [];
  const contract = buildFinalPacketContract(dayCount);
  if (!Array.isArray(pages)) return { valid: false, errors: ["packet pages must be an array"] };
  if (pages.length !== contract.totalPages) errors.push(`packet must contain ${contract.totalPages} pages including the final follow-up page`);
  const expectedCoverPages = contract.coverPages;
  const actualCoverPages = pages.filter((page) => page?.role === "cover").length;
  if (actualCoverPages !== expectedCoverPages) errors.push(`packet must contain ${expectedCoverPages} cover page(s) before daily modules`);

  const answerKeys = pages.filter((page) => page?.role === "answer_key");
  const followUps = pages.filter((page) => page?.role === "follow_up");
  if (answerKeys.length !== 3) errors.push("packet must contain exactly three Answer Key pages");
  if (followUps.length !== 1) errors.push("packet must contain exactly one final follow-up page");

  const expectedDaily = [];
  for (let day = 1; day <= dayCount; day += 1) {
    for (const pageType of ["reading-passage", "level1", "level2", "level3"]) expectedDaily.push(`${day}:${pageType}`);
  }
  const actualDaily = pages.filter((page) => page?.role === "daily").map((page) => `${page.day}:${page.pageType}`);
  if (JSON.stringify(actualDaily) !== JSON.stringify(expectedDaily)) errors.push("daily modules must remain in calendar order with four pages per day");

  const finalRoles = pages.slice(-4).map((page) => page?.role === "answer_key" ? `answer_key:${page.level}` : page?.role);
  if (JSON.stringify(finalRoles) !== JSON.stringify(["answer_key:level1", "answer_key:level2", "answer_key:level3", "follow_up"])) {
    errors.push("the final four pages must be Answer Key levels 1-3 followed by the follow-up page");
  }
  if (followUps[0]?.asset !== "follow-up-page-reference.png") errors.push("follow-up page must identify the approved reference asset");
  return { valid: errors.length === 0, errors, contract, finalRoles };
}

export async function verifyFollowUpReference(path) {
  const bytes = await readFile(path);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  return { ...FOLLOW_UP_REFERENCE, path, valid: sha256 === FOLLOW_UP_REFERENCE.sha256, actualSha256: sha256 };
}
