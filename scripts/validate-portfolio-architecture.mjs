import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePortfolioArchitecture } from '../src/portfolio-architecture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = 'examples/portfolio-architecture.example.json';
const architecture = JSON.parse(fs.readFileSync(path.join(root, input), 'utf8'));
const result = validatePortfolioArchitecture(architecture);
const report = {
  issue: 80,
  input,
  checkedAt: new Date().toISOString(),
  valid: result.valid,
  errors: result.errors,
  gates: { content: result.valid, mathematics: 'not_applicable_portfolio_contract', layout: 'not_applicable_documentation_only' }
};
const output = path.join(root, 'reports', 'issue-80-portfolio-architecture.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
if (!result.valid) {
  console.error(result.errors.join('\n'));
  process.exit(1);
}
console.log('Portfolio architecture valid: standalone monthly product and future bundle contract');
