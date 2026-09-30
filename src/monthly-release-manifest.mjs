import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const RELEASE_MANIFEST_SCHEMA_VERSION = '1.0.0';

const REQUIRED_ARTIFACT_IDS = ['finalPdf', 'coverPdfPage', 'pageMappings', 'thumbnails', 'thumbnailQa'];
const REQUIRED_GATES = ['content', 'mathematics', 'source', 'layout', 'pdf', 'cover', 'derivedAssets'];
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function addError(errors, message) {
  if (!errors.includes(message)) errors.push(message);
}

function validateArtifact(artifact, index, errors, seenIds, seenPaths) {
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) {
    addError(errors, `artifact ${index + 1} must be an object`);
    return;
  }
  const prefix = `artifact ${index + 1}`;
  if (typeof artifact.id !== 'string' || artifact.id.trim() === '') addError(errors, `${prefix} must declare an id`);
  else if (seenIds.has(artifact.id)) addError(errors, `duplicate artifact id: ${artifact.id}`);
  else seenIds.add(artifact.id);
  if (typeof artifact.path !== 'string' || artifact.path.trim() === '' || path.isAbsolute(artifact.path)) {
    addError(errors, `${prefix} must declare a relative path`);
  } else if (seenPaths.has(artifact.path)) addError(errors, `duplicate artifact path: ${artifact.path}`);
  else seenPaths.add(artifact.path);
  if (typeof artifact.kind !== 'string' || artifact.kind.trim() === '') addError(errors, `${prefix} must declare a kind`);
  if (typeof artifact.sha256 !== 'string' || !SHA256_PATTERN.test(artifact.sha256)) addError(errors, `${prefix} sha256 must be a lowercase 64-character checksum`);
  if (artifact.required !== true) addError(errors, `${prefix} must be required`);
}

export function validateMonthlyReleaseManifest(manifest, expected = {}) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) return { valid: false, releaseEligible: false, errors: ['manifest must be an object'] };
  if (manifest.schemaVersion !== RELEASE_MANIFEST_SCHEMA_VERSION) addError(errors, `schemaVersion must be ${RELEASE_MANIFEST_SCHEMA_VERSION}`);
  for (const field of ['packageId', 'packageVersion', 'month', 'sourceCommit']) {
    if (typeof manifest[field] !== 'string' || manifest[field].trim() === '') addError(errors, `${field} is required`);
  }
  if (!Number.isInteger(manifest.year) || manifest.year < 2000 || manifest.year > 9999) addError(errors, 'year must be a four-digit integer');
  if (manifest.releaseStatus !== 'released') addError(errors, 'releaseStatus must be released');
  if (manifest.stale !== false) addError(errors, 'stale must be false');
  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0) addError(errors, 'artifacts must be a non-empty array');
  const seenIds = new Set();
  const seenPaths = new Set();
  for (const [index, artifact] of (manifest.artifacts ?? []).entries()) validateArtifact(artifact, index, errors, seenIds, seenPaths);
  for (const id of REQUIRED_ARTIFACT_IDS) {
    const artifact = manifest.artifacts?.find((candidate) => candidate?.id === id);
    if (!artifact) addError(errors, `required artifact missing: ${id}`);
  }
  if (!manifest.gates || typeof manifest.gates !== 'object' || Array.isArray(manifest.gates)) addError(errors, 'gates must be an object');
  for (const gate of REQUIRED_GATES) {
    if (manifest.gates?.[gate] !== true) addError(errors, `required gate failed or missing: ${gate}`);
  }
  if (expected.month && manifest.month !== expected.month) addError(errors, `month mismatch: expected ${expected.month}, got ${manifest.month}`);
  if (expected.year && manifest.year !== expected.year) addError(errors, `year mismatch: expected ${expected.year}, got ${manifest.year}`);
  const releaseEligible = errors.length === 0;
  return { valid: releaseEligible, releaseEligible, errors };
}

export function verifyMonthlyReleaseManifestFiles(manifest, baseDir) {
  const errors = [];
  if (!baseDir || typeof baseDir !== 'string') return { valid: false, errors: ['baseDir is required for file verification'] };
  for (const artifact of manifest?.artifacts ?? []) {
    const artifactPath = path.resolve(baseDir, artifact.path);
    if (!artifactPath.startsWith(`${path.resolve(baseDir)}${path.sep}`)) {
      addError(errors, `artifact path escapes baseDir: ${artifact.id}`);
      continue;
    }
    if (!fs.existsSync(artifactPath)) {
      addError(errors, `artifact file missing: ${artifact.id} (${artifact.path})`);
      continue;
    }
    if (!fs.statSync(artifactPath).isFile()) continue;
    const actual = crypto.createHash('sha256').update(fs.readFileSync(artifactPath)).digest('hex');
    if (actual !== artifact.sha256) addError(errors, `artifact checksum mismatch: ${artifact.id}`);
  }
  return { valid: errors.length === 0, errors };
}
