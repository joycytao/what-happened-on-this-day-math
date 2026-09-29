import { access, readFile, writeFile } from "node:fs/promises";

export const NOVEMBER_TEMPLATE_VERSION = "1.0.0";
export const NOVEMBER_SOURCE_PAGE_COUNT = 123;
export const NOVEMBER_FINAL_PAGE_COUNT = 124;

export function parseNovemberArguments(argv) {
  const monthIndex = argv.indexOf("--month");
  const templateIndex = argv.indexOf("--template-version");
  const month = Number(monthIndex >= 0 ? argv[monthIndex + 1] : undefined);
  const templateVersion = templateIndex >= 0 ? argv[templateIndex + 1] : NOVEMBER_TEMPLATE_VERSION;
  if (month !== 11) throw new Error("November orchestration requires --month 11");
  if (templateVersion !== NOVEMBER_TEMPLATE_VERSION) throw new Error(`unsupported template version: ${templateVersion}`);
  return { month, templateVersion };
}

export function buildNovemberPageMappings() {
  return {
    cover: { finalPage: 1, sourcePages: [] },
    dailyWorksheets: { sourcePages: [1, 120], finalPages: [2, 121] },
    answerKeys: { sourcePages: [121, 123], finalPages: [122, 124], order: ["level1", "level2", "level3"] },
  };
}

export function validateNovemberInputs(inputs) {
  const errors = [];
  const passReport = (name, report) => {
    if (report?.valid !== true) errors.push(`${name} validation report is not passing`);
  };
  passReport("content", inputs.contentReport);
  passReport("mathematics", inputs.mathematicsReport);
  passReport("source", inputs.sourceReport);

  const worksheet = inputs.worksheetManifest;
  if (worksheet?.month !== 11 || worksheet.pageCount !== 120 || worksheet.pages?.length !== 120) {
    errors.push("worksheet manifest must contain exactly 120 November daily pages");
  }
  const answerKey = inputs.answerKeyManifest;
  if (answerKey?.month !== 11 || answerKey.pageCount !== 3 || answerKey.pages?.length !== 3) {
    errors.push("Answer Key manifest must contain exactly three November pages");
  }
  if (inputs.sourcePdfPageCount !== NOVEMBER_SOURCE_PAGE_COUNT) {
    errors.push(`source PDF must contain ${NOVEMBER_SOURCE_PAGE_COUNT} pages`);
  }

  const cover = inputs.coverManifest;
  if (cover?.month !== "November" || cover.cover_pages !== 1) errors.push("cover manifest must describe exactly one November cover page");
  if (cover?.checks?.reviewGate !== "approved") errors.push("cover approval gate is not approved");
  if (inputs.coverReport?.approval !== "approved") errors.push("November cover report must record explicit approval");
  if (inputs.coverVisualQa?.passed !== true) errors.push("cover visual QA must pass before release");
  if (!inputs.coverVisualQa?.artifacts?.length) errors.push("cover visual QA artifacts are required");
  if (inputs.finalPdfExists) errors.push("final PDF already exists; remove stale derived output before rerunning");

  return {
    valid: errors.length === 0,
    errors,
    sourcePageCount: NOVEMBER_SOURCE_PAGE_COUNT,
    finalPageCount: NOVEMBER_FINAL_PAGE_COUNT,
    coverPages: 1,
    pageOneRole: "worksheet-coversheet",
    mappings: buildNovemberPageMappings(),
    failureLoop: "optimize prompt/layout -> regenerate -> rerun complete QA",
  };
}

export async function mergeApprovedNovemberCover({ coverPdf, sourcePdf, finalPdf }) {
  const { PDFDocument } = await import("pdf-lib");
  const [coverBytes, sourceBytes] = await Promise.all([readFile(coverPdf), readFile(sourcePdf)]);
  const cover = await PDFDocument.load(coverBytes);
  const source = await PDFDocument.load(sourceBytes);
  if (cover.getPageCount() !== 1) throw new Error("cover PDF must contain exactly one page");
  if (source.getPageCount() !== NOVEMBER_SOURCE_PAGE_COUNT) throw new Error(`source PDF must contain ${NOVEMBER_SOURCE_PAGE_COUNT} pages`);
  const output = await PDFDocument.create();
  for (const document of [cover, source]) {
    const pages = await output.copyPages(document, document.getPageIndices());
    pages.forEach((page) => output.addPage(page));
  }
  if (output.getPageCount() !== NOVEMBER_FINAL_PAGE_COUNT) throw new Error(`final PDF must contain ${NOVEMBER_FINAL_PAGE_COUNT} pages`);
  await writeFile(finalPdf, await output.save({ useObjectStreams: false }));
  return { sourcePageCount: source.getPageCount(), finalPageCount: output.getPageCount() };
}

export async function fileExists(path) {
  try { await access(path); return true; } catch { return false; }
}
