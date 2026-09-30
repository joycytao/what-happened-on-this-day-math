import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMonthlyReleaseWorkflow } from '../src/monthly-release-workflow.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = 'examples/monthly-release-workflow.example.json';
const workflow = JSON.parse(fs.readFileSync(path.join(root, input), 'utf8'));
const result = validateMonthlyReleaseWorkflow(workflow);
const report = { issue: 82, input, valid: result.valid, errors: result.errors, gates: { content: result.valid, mathematics: 'not_applicable_workflow_contract', layout: 'not_applicable_documentation_contract' } };
fs.writeFileSync(path.join(root, 'reports/issue-82-monthly-release-workflow.json'), `${JSON.stringify(report, null, 2)}\n`);
if (!result.valid) { console.error(result.errors.join('\n')); process.exit(1); }
console.log('Monthly release workflow valid: ordered gates and downstream invalidation rules');
