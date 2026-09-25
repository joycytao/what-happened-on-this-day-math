import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateMonthlyReleaseWorkflow } from '../src/monthly-release-workflow.mjs';

test('monthly release workflow defines ordered gates and cover-aware outputs', () => {
  const workflow = JSON.parse(fs.readFileSync('examples/monthly-release-workflow.example.json', 'utf8'));
  const result = validateMonthlyReleaseWorkflow(workflow);
  assert.equal(result.valid, true, result.errors.join('\n'));
  assert.equal(workflow.stages[4].id, 'worksheet-coversheet');
  assert.equal(workflow.stages[5].id, 'final-pdf-qa');
  assert.ok(workflow.stages[5].inputs.includes('coverPdfPage'));
});

test('workflow rejects a release path that omits downstream invalidation', () => {
  const workflow = JSON.parse(fs.readFileSync('examples/monthly-release-workflow.example.json', 'utf8'));
  workflow.invalidationRules = [];
  const result = validateMonthlyReleaseWorkflow(workflow);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('invalidationRules')));
});
