import { readFile } from "node:fs/promises";

const workflow = await readFile(new URL("../.github/workflows/pm-triage-queue-audit.yml", import.meta.url), "utf8");
const required = [
  "issues:", "opened", "edited", "labeled", "unlabeled", "closed", "reopened",
  "issue_comment:", "created", "deleted", "pull_request:", "synchronize",
  "pull_request_review:", "submitted", "dismissed", "workflow_run:", "completed",
  "repository_dispatch:", "source-asset-available", "dependency-closed",
  "push:", "assets/**", "content/**", "data/**", "concurrency:",
  "cancel-in-progress: false", "github.event_name != 'workflow_run'",
];
const errors = required.filter((token) => !workflow.includes(token)).map((token) => `PM audit missing event-driven contract token: ${token}`);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("Event-driven reconciliation contract passed");
