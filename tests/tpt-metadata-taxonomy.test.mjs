import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateTptMetadataTaxonomy } from '../src/tpt-metadata-taxonomy.mjs';

test('taxonomy contains complete October reference metadata and monthly/bundle rules', () => {
  const taxonomy = JSON.parse(fs.readFileSync('examples/tpt-metadata-taxonomy.example.json', 'utf8'));
  const result = validateTptMetadataTaxonomy(taxonomy);
  assert.equal(result.valid, true, result.errors.join('\n'));
  assert.equal(taxonomy.referenceRecord.title, 'October Morning Work Math');
  assert.equal(taxonomy.referenceRecord.productType, 'monthly standalone');
  assert.ok(taxonomy.fields.required.includes('subjectArea'));
  assert.ok(taxonomy.keywordGroups.history.includes('historical mini-stories'));
});

test('taxonomy rejects missing required grade-band terminology', () => {
  const taxonomy = JSON.parse(fs.readFileSync('examples/tpt-metadata-taxonomy.example.json', 'utf8'));
  taxonomy.fields.allowedValues.gradeBand = [];
  const result = validateTptMetadataTaxonomy(taxonomy);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('gradeBand')));
});
