import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const auditWorkflow = await readFile(new URL("../.github/workflows/pm-triage-queue-audit.yml", import.meta.url), "utf8");
const failureWorkflow = await readFile(new URL("../.github/workflows/queue-health-recovery.yml", import.meta.url), "utf8");

test("scheduled PM audit scans all Issues and all PR states for terminal drift", () => {
  assert.match(auditWorkflow, /issues\.listForRepo[\s\S]{0,180}state: 'all'/);
  assert.match(auditWorkflow, /pulls\.list[\s\S]{0,120}state: 'all'/);
  assert.match(auditWorkflow, /entry\.health/);
});

test("failed workflow recovery is idempotent and fail-closed", () => {
  assert.match(failureWorkflow, /workflow_run:/);
  assert.match(failureWorkflow, /conclusion != 'success'/);
  assert.match(failureWorkflow, /CODEX_WORKFLOW_FAILURE_RECOVERY:v1/);
  assert.match(failureWorkflow, /no role was inferred when the workflow evidence was ambiguous/i);
});
