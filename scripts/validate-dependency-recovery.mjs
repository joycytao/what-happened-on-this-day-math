import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/reconcile-issue-governance.yml", "utf8");
const moduleSource = fs.readFileSync("src/dependency-recovery.mjs", "utf8");
const errors = [];
for (const token of ["repository_dispatch:", "dependency-closed", "source-asset-available", "dependency-reconcile", "push:", "schedule:", "CODEX_DEPENDENCY_EVENT:v1", "transitionIssueState", "cancel-in-progress: false"]) {
  if (!workflow.includes(token) && !moduleSource.includes(token)) errors.push(`dependency recovery contract missing ${token}`);
}
if (!workflow.includes("src/dependency-recovery.mjs") || !workflow.includes("dependencyRecoveryPlan")) errors.push("dependency watcher must use dependencyRecoveryPlan");
if (!workflow.includes("src/issue-state-writer.mjs") || !workflow.includes("transitionIssueState")) errors.push("dependency watcher must use the authoritative state writer");
if (/github\.rest\.issues\.(update|addLabels|removeLabel|createComment)\s*\(/.test(workflow)) errors.push("dependency watcher contains a direct Issue mutation");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("Dependency recovery contract passed");
