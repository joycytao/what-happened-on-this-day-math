import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateMonthlyReleaseManifest,
  verifyMonthlyReleaseManifestFiles
} from '../src/monthly-release-manifest.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = process.argv[2] ?? 'examples/monthly-release-manifest.example.json';
const expectedMonth = process.argv.find((arg) => arg.startsWith('--month='))?.split('=')[1];
const expectedYearValue = process.argv.find((arg) => arg.startsWith('--year='))?.split('=')[1];
const expectedYear = expectedYearValue ? Number(expectedYearValue) : undefined;
const verifyFiles = process.argv.includes('--verify-files');
const resolvedManifestPath = path.resolve(root, manifestPath);
const manifest = JSON.parse(fs.readFileSync(resolvedManifestPath, 'utf8'));
const result = validateMonthlyReleaseManifest(manifest, { month: expectedMonth, year: expectedYear });
const fileVerification = verifyFiles
  ? verifyMonthlyReleaseManifestFiles(manifest, root)
  : { valid: true, errors: [], skipped: true };
const report = {
  issue: 115,
  manifest: manifestPath,
  valid: result.valid && fileVerification.valid,
  releaseEligible: result.releaseEligible && fileVerification.valid,
  errors: [...result.errors, ...fileVerification.errors],
  fileVerification
};
const reportPath = path.join(root, 'reports/monthly-release-manifest.json');
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.valid) {
  console.error(report.errors.join('\n'));
  process.exit(1);
}
console.log(`Monthly release manifest valid and ${report.releaseEligible ? 'eligible' : 'not eligible'}: ${manifest.packageId}@${manifest.packageVersion}`);
