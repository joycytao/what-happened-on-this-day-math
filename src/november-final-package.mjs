import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
import { buildMonthlyPackageContract } from './monthly-package-assembly.mjs';

export const NOVEMBER_DAY_COUNT = 30;
export const NOVEMBER_SOURCE_PAGE_COUNT = 123;

export function buildNovemberFinalPackagePlan({ sourcePageCount } = {}) {
  if (sourcePageCount !== NOVEMBER_SOURCE_PAGE_COUNT) {
    throw new Error(`source packet must contain exactly ${NOVEMBER_SOURCE_PAGE_COUNT} pages`);
  }
  const contract = buildMonthlyPackageContract(NOVEMBER_DAY_COUNT);
  return {
    contract,
    pageRanges: {
      cover: [1, 1],
      daily: [2, 121],
      answerKey: [122, 124],
      followUp: [125, 125],
    },
    firstPageRole: 'worksheet-coversheet',
    finalPageRole: 'follow-up',
  };
}

export function buildNovemberDailyManifest(sourceManifest) {
  if (!Array.isArray(sourceManifest?.pages) || sourceManifest.pages.length !== 120) {
    throw new Error('November daily worksheet manifest must contain exactly 120 pages');
  }
  return {
    pageCount: 120,
    pages: sourceManifest.pages.map(({ day, pageType }) => ({ role: 'daily', day, pageType })),
  };
}

export function buildNovemberAnswerKeyManifest(sourceManifest) {
  if (!Array.isArray(sourceManifest?.pages) || sourceManifest.pages.length !== 3) {
    throw new Error('November Answer Key manifest must contain exactly three pages');
  }
  const pages = sourceManifest.pages.map(({ level }) => ({ role: 'answer_key', level }));
  if (JSON.stringify(pages.map(({ level }) => level)) !== JSON.stringify(['level1', 'level2', 'level3'])) {
    throw new Error('November Answer Key pages must be level1, level2, level3');
  }
  return { pageCount: 3, pages };
}

export async function assembleNovemberFinalPackage({ sourcePdf, coverPdf, followUpPng, outputPdf } = {}) {
  const source = await PDFDocument.load(await readFile(sourcePdf));
  const cover = await PDFDocument.load(await readFile(coverPdf));
  if (source.getPageCount() !== NOVEMBER_SOURCE_PAGE_COUNT) throw new Error('November source packet must contain exactly 123 pages');
  if (cover.getPageCount() !== 1) throw new Error('November cover must contain exactly one page');

  const output = await PDFDocument.create();
  for (const document of [cover, source]) {
    const pages = await output.copyPages(document, document.getPageIndices());
    pages.forEach((page) => output.addPage(page));
  }
  const followUp = output.addPage([1158.75, 1500]);
  const image = await output.embedPng(await readFile(followUpPng));
  followUp.drawImage(image, { x: 0, y: 0, width: 1158.75, height: 1500 });
  if (output.getPageCount() !== 125) throw new Error('November final packet must contain exactly 125 pages');
  const bytes = await output.save({ useObjectStreams: false });
  await writeFile(outputPdf, bytes);
  return {
    pageCount: output.getPageCount(),
    pageOneRole: 'worksheet-coversheet',
    pageRanges: { cover: [1, 1], daily: [2, 121], answerKey: [122, 124], followUp: [125, 125] },
    finalPageRole: 'follow-up',
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}
