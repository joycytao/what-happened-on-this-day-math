import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMonthlySocialIssuePlan, buildUtilitySocialIssuePlan } from "../src/social-orchestration.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? "" : "";
};
const mode = value("--mode");
const output = path.resolve(root, value("--output") || "social-issue-plan.json");
const input = mode === "monthly"
  ? buildMonthlySocialIssuePlan({
      month: value("--month"),
      year: value("--year"),
      packageId: value("--package-id"),
      manifestPath: value("--manifest-path"),
      contentPath: value("--content-path"),
      thumbnailManifestPath: value("--thumbnail-manifest-path"),
      runUrl: value("--run-url"),
    })
  : buildUtilitySocialIssuePlan({
      cycleId: value("--cycle-id"),
      intakeIssueNumber: Number(value("--intake-issue")),
      runUrl: value("--run-url"),
    });

if (!mode || !["monthly", "utility"].includes(mode)) {
  console.error("Usage: node scripts/build-social-issue-plan.mjs --mode monthly|utility ...");
  process.exit(2);
}
fs.writeFileSync(output, `${JSON.stringify(input, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(root, output), valid: input.valid, issues: input.issues.length, errors: input.errors }, null, 2));
if (!input.valid) process.exit(1);
