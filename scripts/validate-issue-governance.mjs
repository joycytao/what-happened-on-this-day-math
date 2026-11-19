import fs from "node:fs";
import { GOVERNANCE_OWNERS, GOVERNANCE_STATUSES, selectVerifiedQueue, validateGovernanceIssue } from "../src/issue-governance.mjs";

const fixtures = JSON.parse(fs.readFileSync(new URL("../tests/fixtures/issue-governance-fixtures.json", import.meta.url), "utf8"));
const errors = [];
for (const issue of fixtures) {
  const result = validateGovernanceIssue(issue, fixtures);
  const labels = issue.labels || [];
  const owners = labels.filter((label) => GOVERNANCE_OWNERS.has(label));
  if (owners.length > 1) errors.push(`#${issue.number}: multiple owners`);
  for (const label of labels.filter((label) => label.startsWith("status: "))) {
    if (!GOVERNANCE_STATUSES.has(label)) errors.push(`#${issue.number}: unsupported status ${label}`);
  }
  if (issue.expectedValid !== result.valid) errors.push(`#${issue.number}: expected valid=${issue.expectedValid}, got ${result.valid}: ${result.errors.join("; ")}`);
}
const queue = selectVerifiedQueue(fixtures);
if (!queue.developerPickup.some((issue) => issue.number === 2)) errors.push("fixture #2 must be a verified developer pickup candidate");
if (queue.developerPickup.some((issue) => issue.number === 1)) errors.push("fixture #1 parent must not be a pickup candidate");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Governance invariants passed for ${fixtures.length} fixtures; ${queue.developerPickup.length} verified pickup candidate(s).`);
