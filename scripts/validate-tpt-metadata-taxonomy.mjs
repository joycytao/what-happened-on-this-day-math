import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateTptMetadataTaxonomy } from '../src/tpt-metadata-taxonomy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = 'examples/tpt-metadata-taxonomy.example.json';
const taxonomy = JSON.parse(fs.readFileSync(path.join(root, input), 'utf8'));
const result = validateTptMetadataTaxonomy(taxonomy);
const report = {
  issue: 81,
  input,
  checkedAt: new Date().toISOString(),
  valid: result.valid,
  errors: result.errors,
  gates: { content: result.valid, mathematics: 'not_applicable_metadata_taxonomy', layout: 'not_applicable_documentation_only' }
};
const output = path.join(root, 'reports', 'issue-81-tpt-metadata-taxonomy.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
if (!result.valid) {
  console.error(result.errors.join('\n'));
  process.exit(1);
}
console.log('TPT metadata taxonomy valid: October reference record and bundle relationship rules');
