import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const template = await readFile(new URL('../.github/ISSUE_TEMPLATE/monthly-workflow.md', import.meta.url), 'utf8');

test('monthly workflow template keeps the reusable sequence and required gates', () => {
  for (const token of ['{{MONTH_NAME}}', '{{MONTH_NUMBER}}', '{{CALENDAR_YEAR}}', '{{PARENT_ISSUE}}']) {
    assert.match(template, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  for (const heading of [
    'Research historical events',
    'Normalize source and content records',
    'Validate content and mathematics',
    'Render worksheet pages',
    'Render Answer Key pages',
    'Assemble and QA the monthly PDF',
    'Release gate',
  ]) {
    assert.match(template, new RegExp(heading));
  }
  for (const required of ['month/day', 'eventYear', 'Source_IDs', 'Independently recompute', '130 pages']) {
    assert.match(template, new RegExp(required));
  }
  assert.match(template, /Fixes #\{\{PARENT_ISSUE\}\}/);
});
