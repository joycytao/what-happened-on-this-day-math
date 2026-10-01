import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildTptMetadata, renderTptMetadataMarkdown, writeTptMetadataOutputs } from '../src/tpt-input-adapter.mjs';

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

test('TPT adapter maps one released monthly package into deterministic metadata and copy', () => {
  const manifest = read('examples/monthly-release-manifest.example.json');
  const content = read('content/monthly/month-10.json');
  const taxonomy = read('examples/tpt-metadata-taxonomy.example.json');
  const result = buildTptMetadata({ manifest, content, taxonomy });
  assert.equal(result.valid, true, result.errors.join('\n'));
  assert.equal(result.payload.listing.title, 'October Morning Work Math');
  assert.equal(result.payload.listing.contents.dailyModules, 31);
  assert.ok(result.payload.listing.keywords.includes('historical mini-stories'));
  assert.equal(result.payload.claims.unsupported.length, 0);
  assert.equal(result.payload.idempotencyKey, 'october-morning-work-math@v1.0.0');
  assert.equal(renderTptMetadataMarkdown(result.payload), renderTptMetadataMarkdown(buildTptMetadata({ manifest, content, taxonomy }).payload));
});

test('TPT adapter rejects stale, wrong-month, and invalid taxonomy inputs before writing', () => {
  const manifest = read('examples/monthly-release-manifest.example.json');
  const content = read('content/monthly/month-10.json');
  const taxonomy = read('examples/tpt-metadata-taxonomy.example.json');
  manifest.stale = true;
  const stale = buildTptMetadata({ manifest, content, taxonomy });
  assert.equal(stale.valid, false);
  assert.ok(stale.errors.some((error) => error.includes('stale')));
  manifest.stale = false;
  manifest.month = 'November';
  const wrongMonth = buildTptMetadata({ manifest, content, taxonomy });
  assert.equal(wrongMonth.valid, false);
  assert.ok(wrongMonth.errors.some((error) => error.includes('content month')));
  manifest.month = 'October';
  taxonomy.fields.allowedValues.gradeBand = [];
  const invalidTaxonomy = buildTptMetadata({ manifest, content, taxonomy });
  assert.equal(invalidTaxonomy.valid, false);
  assert.ok(invalidTaxonomy.errors.some((error) => error.includes('gradeBand')));
});

test('TPT adapter writes idempotent JSON, Markdown, and a machine-readable report path', () => {
  const manifest = read('examples/monthly-release-manifest.example.json');
  const content = read('content/monthly/month-10.json');
  const taxonomy = read('examples/tpt-metadata-taxonomy.example.json');
  const result = buildTptMetadata({ manifest, content, taxonomy });
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tpt-metadata-'));
  const first = writeTptMetadataOutputs({ payload: result.payload, outputDir });
  const firstJson = fs.readFileSync(first.jsonPath, 'utf8');
  const second = writeTptMetadataOutputs({ payload: result.payload, outputDir });
  assert.equal(fs.readFileSync(second.jsonPath, 'utf8'), firstJson);
  assert.match(fs.readFileSync(second.markdownPath, 'utf8'), /Publication remains pending human QA/);
});
