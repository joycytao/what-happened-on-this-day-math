import { access, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

import { buildFinalPacketContract } from "./final-follow-up-validation.mjs";

export function buildFollowUpAssemblyContract(dayCount, sourcePageCount, coverPages = 0) {
  const contract = buildFinalPacketContract(dayCount);
  if (!Number.isInteger(sourcePageCount) || sourcePageCount !== contract.basePages) {
    throw new Error(`source packet must contain ${contract.basePages} pages for a ${dayCount}-day contract`);
  }
  if (coverPages !== contract.coverPages) throw new Error(`cover_pages must be ${contract.coverPages} for the approved ${dayCount}-day contract`);
  return {
    ...contract,
    sourcePageCount,
    finalPageCount: contract.totalPages,
    pageOneRole: coverPages === 1 ? "worksheet-coversheet" : "reading-passage",
    finalPageRole: "follow-up",
    mappings: {
      cover: coverPages ? { sourcePages: [1], finalPages: [1] } : { sourcePages: [], finalPages: [] },
      dailyWorksheets: { sourcePages: [coverPages + 1, coverPages + contract.dailyPages], finalPages: [coverPages + 1, coverPages + contract.dailyPages] },
      answerKeys: { sourcePages: [coverPages + contract.dailyPages + 1, sourcePageCount], finalPages: [coverPages + contract.dailyPages + 1, sourcePageCount], order: ["level1", "level2", "level3"] },
      followUp: { sourcePages: [], finalPages: [contract.totalPages] },
    },
  };
}

export function validateFollowUpArtifact({ artifact, visualQa, sourcePageCount, dayCount, coverPages = 0, finalExists = false } = {}) {
  const errors = [];
  let contract;
  try { contract = buildFollowUpAssemblyContract(dayCount, sourcePageCount, coverPages); } catch (error) { errors.push(error.message); }
  if (finalExists) errors.push("final packet already exists; remove stale derived output before rerunning");
  if (artifact?.valid !== true) errors.push("follow-up artifact manifest must be valid");
  if (artifact?.pageCount !== 1) errors.push("follow-up artifact must contain exactly one page");
  if (artifact?.position !== "after-answer-key") errors.push("follow-up artifact position must be after-answer-key");
  if (artifact?.asset !== "follow-up-page-reference.png") errors.push("follow-up artifact must identify the approved reference asset");
  if (visualQa?.passed !== true) errors.push("follow-up visual QA must pass before final assembly");
  if (!visualQa?.artifacts?.length) errors.push("follow-up visual QA artifacts are required");
  return {
    valid: errors.length === 0,
    errors,
    contract,
    recoveryLoop: errors.length === 0 ? "not required" : "optimize prompt/layout -> regenerate -> rerun complete QA",
  };
}

export async function appendFollowUpPage({ sourcePdf, followUpPdf, finalPdf }) {
  const { PDFDocument } = await import("pdf-lib");
  const source = await PDFDocument.load(await readFile(sourcePdf));
  const followUp = await PDFDocument.load(await readFile(followUpPdf));
  if (followUp.getPageCount() !== 1) throw new Error("follow-up PDF must contain exactly one page");
  const output = await PDFDocument.create();
  const sourcePages = await output.copyPages(source, source.getPageIndices());
  sourcePages.forEach((page) => output.addPage(page));
  const followUpPages = await output.copyPages(followUp, followUp.getPageIndices());
  followUpPages.forEach((page) => output.addPage(page));
  await writeFile(finalPdf, await output.save({ useObjectStreams: false }));
  return { sourcePageCount: source.getPageCount(), followUpPageCount: followUp.getPageCount(), finalPageCount: output.getPageCount(), finalSha256: await sha256(finalPdf) };
}

export async function fileExists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function sha256(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}
