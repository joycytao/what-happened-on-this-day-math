import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildTptAssetPackage, writeTptAssetInventory } from '../src/tpt-asset-packager.mjs';

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tpt-assets-'));
  fs.mkdirSync(path.join(root, 'thumbs'));
  fs.writeFileSync(path.join(root, 'packet.pdf'), 'approved-pdf');
  fs.writeFileSync(path.join(root, 'cover.pdf'), 'approved-cover');
  fs.writeFileSync(path.join(root, 'mapping.json'), '{}');
  fs.writeFileSync(path.join(root, 'thumbs', 'cover.png'), 'png-fixture');
  fs.writeFileSync(path.join(root, 'qa.json'), '{"passed":true}');
  const digest = (file) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
  return { root, manifest: { schemaVersion: '1.0.0', packageId: 'october-morning-work-math', packageVersion: 'v1.0.0', month: 'October', year: 2026, sourceCommit: 'abc1234', releaseStatus: 'released', stale: false, artifacts: [
    { id: 'finalPdf', kind: 'pdf', path: 'packet.pdf', sha256: digest('packet.pdf'), required: true },
    { id: 'coverPdfPage', kind: 'pdf-page', path: 'cover.pdf', sha256: digest('cover.pdf'), required: true },
    { id: 'pageMappings', kind: 'json', path: 'mapping.json', sha256: digest('mapping.json'), required: true },
    { id: 'thumbnails', kind: 'directory', path: 'thumbs', sha256: '0'.repeat(64), required: true },
    { id: 'thumbnailQa', kind: 'json', path: 'qa.json', sha256: digest('qa.json'), required: true }
  ], gates: { content: true, mathematics: true, source: true, layout: true, pdf: true, cover: true, derivedAssets: true } } };
}

test('TPT asset package copies only allowlisted public assets and writes checksummed inventory', () => {
  const { root, manifest } = fixture();
  const outputDir = path.join(root, 'out');
  const result = buildTptAssetPackage({ manifest, baseDir: root, outputDir });
  assert.equal(result.valid, true, result.errors.join('\n'));
  assert.equal(result.inventory.answerKeyPolicy, 'excluded-by-default');
  assert.ok(result.inventory.assets.every((asset) => !asset.source.includes('packet.pdf')));
  assert.ok(result.inventory.assets.length >= 4);
  const inventoryPath = writeTptAssetInventory(result.inventory, outputDir);
  assert.equal(JSON.parse(fs.readFileSync(inventoryPath, 'utf8')).archiveIntegrity, true);
});

test('TPT asset package rejects missing assets, stale manifests, and unapproved final PDFs', () => {
  const { root, manifest } = fixture();
  manifest.stale = true;
  const stale = buildTptAssetPackage({ manifest, baseDir: root, outputDir: path.join(root, 'out') });
  assert.equal(stale.valid, false);
  assert.ok(stale.errors.some((error) => error.includes('stale')));
  manifest.stale = false;
  const unsafe = buildTptAssetPackage({ manifest, baseDir: root, outputDir: path.join(root, 'out2'), publicArtifactIds: ['finalPdf'] });
  assert.equal(unsafe.valid, false);
  assert.ok(unsafe.errors.some((error) => error.includes('allowAnswerKeys')));
  fs.rmSync(path.join(root, 'cover.pdf'));
  const missing = buildTptAssetPackage({ manifest, baseDir: root, outputDir: path.join(root, 'out3') });
  assert.equal(missing.valid, false);
  assert.ok(missing.errors.some((error) => error.includes('coverPdfPage')));
});
