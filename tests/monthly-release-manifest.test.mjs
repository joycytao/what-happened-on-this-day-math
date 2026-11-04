import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateMonthlyReleaseManifest } from '../src/monthly-release-manifest.mjs';
import { verifyMonthlyReleaseManifestFiles } from '../src/monthly-release-manifest.mjs';

const validManifest = {
  schemaVersion: '1.0.0',
  packageId: 'october-morning-work-math',
  packageVersion: 'v1.0.0',
  month: 'October',
  year: 2026,
  sourceCommit: 'abcdef1234567890',
  releaseStatus: 'released',
  stale: false,
  artifacts: [
    { id: 'finalPdf', kind: 'pdf', path: 'output/pdf/october.pdf', sha256: 'a'.repeat(64), required: true },
    { id: 'coverPdfPage', kind: 'pdf-page', path: 'output/cover/october.pdf', sha256: 'b'.repeat(64), required: true },
    { id: 'pageMappings', kind: 'json', path: 'reports/october/pages.json', sha256: 'c'.repeat(64), required: true },
    { id: 'thumbnails', kind: 'directory', path: 'output/thumbnails/october', sha256: 'd'.repeat(64), required: true },
    { id: 'thumbnailQa', kind: 'json', path: 'reports/october/thumbnails.json', sha256: 'e'.repeat(64), required: true }
  ],
  gates: {
    content: true,
    mathematics: true,
    source: true,
    layout: true,
    pdf: true,
    cover: true,
    derivedAssets: true
  }
};

test('validates one released monthly package and returns release eligibility', () => {
  const result = validateMonthlyReleaseManifest(validManifest, { month: 'October', year: 2026 });
  assert.equal(result.valid, true, result.errors.join('\n'));
  assert.equal(result.releaseEligible, true);
});

test('rejects missing artifacts and failed gates with actionable errors', () => {
  const manifest = structuredClone(validManifest);
  manifest.artifacts = manifest.artifacts.filter(({ id }) => id !== 'thumbnailQa');
  manifest.gates.pdf = false;
  const result = validateMonthlyReleaseManifest(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('thumbnailQa')));
  assert.ok(result.errors.some((error) => error.includes('pdf')));
  assert.equal(result.releaseEligible, false);
});

test('rejects stale or wrong-month manifests before downstream consumption', () => {
  const manifest = structuredClone(validManifest);
  manifest.stale = true;
  manifest.month = 'November';
  const result = validateMonthlyReleaseManifest(manifest, { month: 'October', year: 2026 });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('stale')));
  assert.ok(result.errors.some((error) => error.includes('month')));
});

test('rejects duplicate artifact identity and invalid checksums', () => {
  const manifest = structuredClone(validManifest);
  manifest.artifacts[1].id = 'finalPdf';
  manifest.artifacts[1].sha256 = 'not-a-checksum';
  const result = validateMonthlyReleaseManifest(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('duplicate artifact id')));
  assert.ok(result.errors.some((error) => error.includes('sha256')));
});

test('detects a changed released artifact when checksums are verified', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'monthly-release-manifest-'));
  const artifactPath = path.join(root, 'final.pdf');
  fs.writeFileSync(artifactPath, 'changed final package');
  const manifest = structuredClone(validManifest);
  manifest.artifacts = [{ ...manifest.artifacts[0], path: 'final.pdf' }];
  const result = verifyMonthlyReleaseManifestFiles(manifest, root);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('checksum mismatch')));
});
