import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(new URL("../.github/workflows/pm-triage-queue-audit.yml", import.meta.url), "utf8");

test("queue audit runs on every state-changing event and retains schedule as fallback", () => {
  for (const token of [
    "issues:", "issue_comment:", "pull_request:", "pull_request_review:",
    "workflow_run:", "repository_dispatch:", "push:", "schedule:",
  ]) assert.match(workflow, new RegExp(token.replace(":", "\\s*:")));
  for (const token of ["opened", "edited", "labeled", "unlabeled", "closed", "reopened", "created", "deleted", "synchronize", "submitted", "dismissed", "completed", "source-asset-available", "dependency-closed", "assets/**", "content/**", "data/**"]) {
    assert.match(workflow, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("workflow-run reconciliation excludes its own successful completion and serializes audits", () => {
  assert.match(workflow, /github\.event_name != 'workflow_run'/);
  assert.match(workflow, /cancel-in-progress: false/);
});

test("workflow-run reconciliation still audits failed completion of this workflow", () => {
  assert.match(
    workflow,
    /github\.event\.workflow_run\.conclusion == 'failure'/,
    "failed workflow completion must remain eligible even when the failed run is this workflow",
  );
});
