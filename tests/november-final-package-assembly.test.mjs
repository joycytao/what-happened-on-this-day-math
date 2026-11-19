import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { assembleNovemberFinalPackage } from '../src/november-final-package.mjs';

test('assembles the approved November cover, source packet, and final follow-up into 125 pages', async () => {
  const root = new URL('..', import.meta.url).pathname;
  const temp = await mkdtemp('/private/tmp/november-final-assembly-');
  const outputPdf = join(temp, 'november-worksheet-packet-final.pdf');
  try {
    const result = await assembleNovemberFinalPackage({
      sourcePdf: join(root, 'output/pdf/november-worksheet-packet.pdf'),
      coverPdf: join(root, 'output/worksheet-cover/november-worksheet-cover.pdf'),
      followUpPng: join(root, 'references /worksheet-assets/follow-up-page-reference.png'),
      outputPdf,
    });
    assert.equal(result.pageCount, 125);
    assert.deepEqual(result.pageRanges, { cover: [1, 1], daily: [2, 121], answerKey: [122, 124], followUp: [125, 125] });
    assert.equal(result.pageOneRole, 'worksheet-coversheet');
    assert.equal(result.finalPageRole, 'follow-up');
    assert.ok((await readFile(outputPdf)).length > 100000);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
