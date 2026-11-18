import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowPath = new URL("../.github/workflows/pr-handoff.yml", import.meta.url);

test("PR workflow routes developer implementation to quality-engineer", async () => {
  const workflow = await readFile(workflowPath, "utf8");
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /hasDeveloperHandoff/);
  assert.match(workflow, /linkedIssueNumbers/);
  assert.match(workflow, /workItemNumber/);
  assert.match(workflow, /agent: quality-engineer/);
  assert.match(workflow, /status: qa/);
  assert.match(workflow, /CODEX_HANDOFF:v1/);
});

test("PR workflow detects conflicts and returns the work to developer", async () => {
  const workflow = await readFile(workflowPath, "utf8");
  assert.match(workflow, /mergeable_state/);
  assert.match(workflow, /CODEX_CONFLICT_ALERT:v1/);
  assert.match(workflow, /quality-engineer.*developer.*conflict|developer.*conflict/si);
  assert.match(workflow, /state: changes-requested/);
  assert.match(workflow, /isolated worktree/);
  assert.match(workflow, /mergeable.*unknown|unknown.*mergeable/si);
});

test("PR workflow consults architect and social expert by changed paths", async () => {
  const workflow = await readFile(workflowPath, "utf8");
  assert.match(workflow, /docs\/|src\/|\.github\//);
  assert.match(workflow, /agent: architect/);
  assert.match(workflow, /social|carousel|reel|template/);
  assert.match(workflow, /agent: social-expert/);
});

test("QA failure returns to developer and success stops at human gate", async () => {
  const workflow = await readFile(workflowPath, "utf8");
  assert.match(workflow, /status.*rejected|rejected/);
  assert.match(workflow, /agent: developer/);
  assert.match(workflow, /state: changes-requested/);
  assert.match(workflow, /ready-for-human/);
  assert.match(workflow, /issue_number: workItemNumber/);
  assert.match(workflow, /merge|human/i);
  assert.doesNotMatch(workflow, /github\.rest\.pulls\.merge|auto.?merge/i);
});
