import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { validateMonthlyReleaseManifest } from './monthly-release-manifest.mjs';

const PACKAGE_SCHEMA_VERSION = '1.0.0';
const DEFAULT_PUBLIC_IDS = ['coverPdfPage', 'pageMappings', 'thumbnails', 'thumbnailQa'];

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function add(errors, message) {
  if (!errors.includes(message)) errors.push(message);
}

function fileEntries(root) {
  if (!fs.statSync(root).isDirectory()) return [root];
  return fs.readdirSync(root).flatMap((entry) => fileEntries(path.join(root, entry)));
}

function copyArtifact(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

export function buildTptAssetPackage({ manifest, baseDir, outputDir, publicArtifactIds = DEFAULT_PUBLIC_IDS, allowAnswerKeys = false }) {
  const errors = [];
  const manifestResult = validateMonthlyReleaseManifest(manifest);
  if (!manifestResult.valid) manifestResult.errors.forEach((error) => add(errors, `release manifest: ${error}`));
  if (!baseDir || !outputDir) add(errors, 'baseDir and outputDir are required');
  const selected = new Set(publicArtifactIds);
  if (selected.has('finalPdf') && !allowAnswerKeys) add(errors, 'finalPdf is not public until allowAnswerKeys is explicitly true');
  const assets = [];
  for (const artifact of manifest?.artifacts ?? []) {
    if (!selected.has(artifact.id)) continue;
    const source = path.resolve(baseDir, artifact.path);
    if (!source.startsWith(`${path.resolve(baseDir)}${path.sep}`) || !fs.existsSync(source)) {
      add(errors, `approved public asset is missing: ${artifact.id}`);
      continue;
    }
    if (fs.statSync(source).isFile() && sha256(source) !== artifact.sha256) {
      add(errors, `source checksum mismatch: ${artifact.id}`);
      continue;
    }
    const target = path.join(outputDir, 'assets', artifact.id);
    copyArtifact(source, target);
    const sources = fileEntries(source);
    for (const sourceFile of sources) {
      if (!fs.statSync(sourceFile).isFile()) continue;
      const relative = path.relative(outputDir, path.join(target, path.relative(source, sourceFile)));
      const targetFile = path.join(outputDir, relative);
      assets.push({ id: artifact.id, kind: artifact.kind, source: artifact.path, target: relative, bytes: fs.statSync(targetFile).size, sha256: sha256(targetFile) });
    }
  }
  for (const id of publicArtifactIds) if (!manifest?.artifacts?.some((artifact) => artifact.id === id)) add(errors, `approved public asset is not declared: ${id}`);
  if (!assets.length) add(errors, 'public asset package is empty');
  const inventory = {
    schemaVersion: PACKAGE_SCHEMA_VERSION,
    packageId: manifest?.packageId,
    packageVersion: manifest?.packageVersion,
    month: manifest?.month,
    sourceCommit: manifest?.sourceCommit,
    answerKeyPolicy: allowAnswerKeys ? 'explicitly-approved' : 'excluded-by-default',
    assets,
    deterministic: true,
    archiveIntegrity: assets.every((asset) => fs.existsSync(path.join(outputDir, asset.target)))
  };
  return { valid: errors.length === 0, errors, inventory };
}

export function writeTptAssetInventory(inventory, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const inventoryPath = path.join(outputDir, 'inventory.json');
  fs.writeFileSync(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`);
  return inventoryPath;
}

export { DEFAULT_PUBLIC_IDS, PACKAGE_SCHEMA_VERSION };
