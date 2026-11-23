import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const testFiles = [
  "tests/issue-59-november-pdf.test.mjs",
  "tests/final-follow-up-validation.test.mjs",
  "tests/monthly-package-assembly.test.mjs",
  "tests/monthly-worksheet-package.test.mjs",
  "tests/monthly-worksheet-renderer.test.mjs",
  "tests/november-final-package-assembly.test.mjs",
  "tests/thumbnail-visual-parity-contract.test.mjs",
  "tests/worksheet-cover-visual-qa.test.mjs",
];

const missing = testFiles.filter((path) => !existsSync(path));
if (missing.length > 0) {
  console.error(`visual/PDF verification contract is missing test files: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`Running visual/PDF verification contract: ${testFiles.join(", ")}`);
const result = spawnSync(process.execPath, ["--test", ...testFiles], { stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
