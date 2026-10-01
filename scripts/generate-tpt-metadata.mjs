import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTptMetadata, writeTptMetadataOutputs } from '../src/tpt-input-adapter.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = process.argv[2] ?? 'examples/monthly-release-manifest.example.json';
const contentPath = process.argv[3] ?? 'content/monthly/month-10.json';
const outputDir = process.argv[4] ?? `output/tpt/${JSON.parse(fs.readFileSync(path.join(root, manifestPath), 'utf8')).packageId}`;
const manifest = JSON.parse(fs.readFileSync(path.join(root, manifestPath), 'utf8'));
const content = JSON.parse(fs.readFileSync(path.join(root, contentPath), 'utf8'));
const taxonomy = JSON.parse(fs.readFileSync(path.join(root, 'examples/tpt-metadata-taxonomy.example.json'), 'utf8'));
const result = buildTptMetadata({ manifest, content, taxonomy, releaseManifestPath: manifestPath, contentPath });
if (!result.valid) {
  console.error(result.errors.join('\n'));
  process.exit(1);
}
const outputs = writeTptMetadataOutputs({ payload: result.payload, outputDir: path.join(root, outputDir) });
const report = { issue: 112, valid: true, packageId: result.payload.package.id, packageVersion: result.payload.package.version, output: outputs, idempotencyKey: result.payload.idempotencyKey, claims: result.payload.claims };
fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/issue-112-tpt-metadata.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
