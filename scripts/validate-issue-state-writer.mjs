import fs from "node:fs";

const workflows = [
  ".github/workflows/handoff-router.yml",
  ".github/workflows/pr-handoff.yml",
  ".github/workflows/pm-triage-queue-audit.yml",
  ".github/workflows/release-approval-queue.yml",
  ".github/workflows/queue-health-recovery.yml",
  ".github/workflows/reconcile-issue-governance.yml",
  ".github/workflows/agent-handoff-queue.yml",
  ".github/workflows/dependency-unblock.yml",
  ".github/workflows/social-dependency-unblock.yml",
];
const errors = [];
for (const file of workflows) {
  const text = fs.readFileSync(file, "utf8");
  if (!text.includes("src/issue-state-writer.mjs") || !text.includes("transitionIssueState")) {
    errors.push(`${file} must use src/issue-state-writer.mjs transitionIssueState`);
  }
  if (!text.includes("concurrency:") || !text.includes("cancel-in-progress: false")) {
    errors.push(`${file} must serialize issue-state transitions with workflow concurrency`);
  }
  if (/github\.rest\.issues\.(update|addLabels|removeLabel|createComment)\s*\(/.test(text)) {
    errors.push(`${file} contains a direct Issue mutation outside the authoritative state writer`);
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Issue state writer contract valid for ${workflows.length} transition workflows`);
