import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("PM triage audit runs immediately after a merged pull request", async () => {
  const workflow = await readFile(new URL("../.github/workflows/pm-triage-queue-audit.yml", import.meta.url), "utf8");
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /types: \[closed\]/);
  assert.match(workflow, /github\.event\.pull_request\.merged == true/);
});
