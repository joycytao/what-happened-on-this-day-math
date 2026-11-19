import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNovemberFinalPackagePlan } from '../src/november-final-package.mjs';

test('derives the complete November component order and 125-page ranges', () => {
  const plan = buildNovemberFinalPackagePlan({ sourcePageCount: 123 });
  assert.deepEqual(plan.contract, { dayCount: 30, coverPages: 1, dailyPages: 120, answerKeyPages: 3, followUpPages: 1, totalPages: 125 });
  assert.deepEqual(plan.pageRanges, { cover: [1, 1], daily: [2, 121], answerKey: [122, 124], followUp: [125, 125] });
  assert.equal(plan.firstPageRole, 'worksheet-coversheet');
  assert.equal(plan.finalPageRole, 'follow-up');
});

test('rejects a source packet that is not the approved November baseline', () => {
  assert.throws(() => buildNovemberFinalPackagePlan({ sourcePageCount: 124 }), /source packet must contain exactly 123 pages/);
});
