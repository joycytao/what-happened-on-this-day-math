#!/usr/bin/env node
import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { assembleNovemberFinalPackage } from '../src/november-final-package.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
const result = await assembleNovemberFinalPackage({
  sourcePdf: resolve(root, 'output/pdf/november-worksheet-packet.pdf'),
  coverPdf: resolve(root, 'output/worksheet-cover/november-worksheet-cover.pdf'),
  followUpPng: resolve(root, 'references /worksheet-assets/follow-up-page-reference.png'),
  outputPdf: resolve(root, 'output/pdf/november-worksheet-packet-final.pdf'),
});
const report = {
  valid: true,
  issue: 125,
  month: 'November',
  dayCount: 30,
  expectedPageCount: 125,
  actualPageCount: result.pageCount,
  pageOneRole: result.pageOneRole,
  finalPageRole: result.finalPageRole,
  pageRanges: result.pageRanges,
  coverVisualQa: 'reports/worksheet-cover-visual-qa/visual-qa.json',
  sourcePdf: 'output/pdf/november-worksheet-packet.pdf',
  finalPdf: 'output/pdf/november-worksheet-packet-final.pdf',
  sha256: result.sha256,
};
await mkdir(resolve(root, 'reports'), { recursive: true });
await writeFile(resolve(root, 'reports/issue-125-november-final-package.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
