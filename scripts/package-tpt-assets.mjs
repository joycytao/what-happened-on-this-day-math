import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTptAssetPackage, writeTptAssetInventory } from '../src/tpt-asset-packager.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = process.argv[2] ?? 'examples/monthly-release-manifest.example.json';
const outputDir = process.argv[3] ?? 'output/tpt/asset-bundle';
const manifest = JSON.parse(fs.readFileSync(path.join(root, manifestPath), 'utf8'));
const result = buildTptAssetPackage({ manifest, baseDir: root, outputDir: path.join(root, outputDir) });
if (!result.valid) {
  console.error(result.errors.join('\n'));
  process.exit(1);
}
const inventoryPath = writeTptAssetInventory(result.inventory, path.join(root, outputDir));
const report = { issue: 110, valid: true, inventory: inventoryPath, packageId: result.inventory.packageId, assetCount: result.inventory.assets.length, answerKeyPolicy: result.inventory.answerKeyPolicy };
fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/issue-110-tpt-assets.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
