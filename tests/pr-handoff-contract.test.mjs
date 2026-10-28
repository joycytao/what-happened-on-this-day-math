import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowPath = new URL("../.github/workflows/pr-handoff.yml", import.meta.url);

test("PR workflow routes developer implementation to quality-engineer", async () => {
  const workflow = await readFile(workflowPath, "utf8");
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /hasDeveloperHandoff/);
  assert.match(workflow, /agent: quality-engineer/);
  assert.match(workflow, /state: qa/);
  assert.match(workflow, /CODEX_HANDOFF:v1/);
});

test("PR workflow consults architect and social expert by changed paths", async () => {
  const workflow = await readFile(workflowPath, "utf8");
  assert.match(workflow, /docs\/|src\/|\.github\//);
  assert.match(workflow, /agent: architect/);
  assert.match(workflow, /social|carousel|reel|template/);
  assert.match(workflow, /agent: social-expert/);
});

test("QA failure returns to developer and success stops at human review", async () => {
  const workflow = await readFile(workflowPath, "utf8");
  assert.match(workflow, /status.*rejected|rejected/);
  assert.match(workflow, /agent: developer/);
  assert.match(workflow, /state: changes-requested/);
  assert.match(workflow, /state: human-review/);
  assert.match(workflow, /merge|human/i);
  assert.doesNotMatch(workflow, /merge.*true|auto.?merge/i);
});
