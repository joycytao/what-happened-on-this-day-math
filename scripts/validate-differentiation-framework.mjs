import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDifferentiationFramework } from '../src/differentiation-framework.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = path.join(root, 'examples', 'differentiation-framework.example.json');
const reportPath = path.join(root, 'reports', 'issue-79-differentiation-framework.json');
const framework = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const result = validateDifferentiationFramework(framework);
const report = {
  issue: 79,
  input: 'examples/differentiation-framework.example.json',
  checkedAt: new Date().toISOString(),
  valid: result.valid,
  errors: result.errors,
  exampleCount: result.examples,
  gates: {
    content: result.valid,
    mathematics: result.valid,
    layout: 'not_applicable_documentation_only'
  }
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!result.valid) {
  console.error(result.errors.join('\n'));
  process.exit(1);
}
console.log(`Differentiation framework valid: ${result.examples} October examples`);
