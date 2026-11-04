import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePortfolioArchitecture } from '../src/portfolio-architecture.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(root, '..', 'examples', 'portfolio-architecture.example.json');

test('the portfolio architecture defines standalone monthly products and a future bundle', () => {
  const architecture = JSON.parse(fs.readFileSync(source, 'utf8'));
  const result = validatePortfolioArchitecture(architecture);

  assert.equal(result.valid, true, result.errors.join('\n'));
  assert.equal(architecture.products.monthly.identifierPattern, 'morning-work-math-{year}-{month}');
  assert.equal(architecture.products.bundle.identifier, 'morning-work-math-year-bundle');
  assert.equal(architecture.referenceProduct.month, 10);
  assert.ok(architecture.products.monthly.inclusionRules.includes('answerKeys'));
  assert.ok(architecture.products.monthly.inclusionRules.includes('worksheetCoversheetPng'));
  assert.ok(architecture.products.monthly.inclusionRules.includes('worksheetCoversheetPdf'));
});

test('portfolio validation rejects an October record with the wrong identifier', () => {
  const architecture = JSON.parse(fs.readFileSync(source, 'utf8'));
  architecture.referenceProduct.identifier = 'october-packet';

  const result = validatePortfolioArchitecture(architecture);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('referenceProduct.identifier')));
});
