import { readFileSync, existsSync } from "node:fs";

const workflowPath = ".github/workflows/repository-verification.yml";
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const errors = [];

if (!existsSync(workflowPath)) errors.push(`${workflowPath} is missing`);
if (!existsSync("package-lock.json")) errors.push("package-lock.json is required for npm ci");
if (!existsSync("scripts/verify-visual-pdf.mjs")) errors.push("visual/PDF verification script is missing");

const workflow = existsSync(workflowPath) ? readFileSync(workflowPath, "utf8") : "";
for (const required of ["npm ci", "npm test", "npm run verification:visual-pdf", "npm run governance:validate", "python -m pip install", "sudo apt-get install --yes poppler-utils", "npx playwright install --with-deps chromium", "TMPDIR: /tmp"]) {
  if (!workflow.includes(required)) errors.push(`repository verification workflow must run ${required}`);
}
if (!packageJson.scripts?.test?.includes("node --test tests/*.test.mjs")) {
  errors.push("package test script must run the complete tests/*.test.mjs suite");
}
if (packageJson.scripts?.["verification:visual-pdf"] !== "node scripts/verify-visual-pdf.mjs") {
  errors.push("verification:visual-pdf must point to the visual/PDF contract runner");
}
if (!/name: Repository-wide verification/.test(workflow)) {
  errors.push("repository verification job must be explicitly named Repository-wide verification");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("Repository-wide verification contract is valid");
