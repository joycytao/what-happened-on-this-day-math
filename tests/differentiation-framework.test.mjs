import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDifferentiationFramework } from '../src/differentiation-framework.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const frameworkPath = path.join(here, '..', 'examples', 'differentiation-framework.example.json');

test('the reusable differentiation framework is valid and includes three October progression examples', () => {
  const framework = JSON.parse(fs.readFileSync(frameworkPath, 'utf8'));
  const result = validateDifferentiationFramework(framework);

  assert.equal(result.valid, true, result.errors.join('\n'));
  assert.deepEqual(Object.keys(framework.levels), ['level1', 'level2', 'level3']);
  assert.equal(framework.examples.length, 3);
  assert.ok(framework.examples.every((example) => example.date.startsWith('October ')));
  assert.ok(framework.examples.every((example) => example.sharedStory === true));
  assert.notEqual(framework.examples[0].levels.level1.skillFamily, framework.examples[0].levels.level2.skillFamily);
  assert.notEqual(framework.examples[0].levels.level2.skillFamily, framework.examples[0].levels.level3.skillFamily);
});

test('framework validation rejects a level 1 number range above 50', () => {
  const framework = JSON.parse(fs.readFileSync(frameworkPath, 'utf8'));
  framework.levels.level1.numberRange.max = 51;

  const result = validateDifferentiationFramework(framework);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('level1.numberRange.max')));
});
