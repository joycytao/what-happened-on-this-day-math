import fs from "node:fs";

const source = fs.readFileSync("tests/state-machine-lifecycle.e2e.test.mjs", "utf8");
const errors = [];
for (const phase of ["issue-created", "pm-audit", "developer-pickup", "pr-created", "conflict", "developer-repair", "qa-pass", "post-merge"]) {
  if (!source.includes(phase)) errors.push(`e2e lifecycle fixture missing phase ${phase}`);
}
for (const token of ["auditIssue", "listEligibleWork", "routeHandoff", "planIssueStateTransition", "auditQueueHealth", "CODEX_HANDOFF:v1", "CODEX_CONFLICT_ALERT:v1", "CODEX_POST_MERGE_RECONCILIATION:v1"]) {
  if (!source.includes(token)) errors.push(`e2e lifecycle fixture missing ${token}`);
}
if (!source.includes("status: done") || !source.includes("state, \"closed\"")) errors.push("e2e lifecycle fixture must assert terminal closed/done state");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("End-to-end state-machine lifecycle contract passed");
