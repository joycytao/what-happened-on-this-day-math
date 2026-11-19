import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("all ready-for-human writers call the shared gate integrity validator", async () => {
  const [router, prHandoff, tpt] = await Promise.all([
    read(".github/workflows/handoff-router.yml"),
    read(".github/workflows/pr-handoff.yml"),
    read(".github/workflows/tpt-workstream.yml"),
  ]);
  for (const workflow of [router, prHandoff, tpt]) {
    assert.match(workflow, /validateReadyForHumanGate/);
    assert.match(workflow, /src\/human-gate-integrity\.mjs/);
  }
});

test("workflow writers validate the prospective label set, not only an existing label", async () => {
  const [router, prHandoff] = await Promise.all([
    read(".github/workflows/handoff-router.yml"),
    read(".github/workflows/pr-handoff.yml"),
  ]);
  assert.match(router, /labels:\s*\[\.\.\.issue\.data\.labels\.map\(label => label\.name\), 'ready-for-human'\]/);
  assert.match(prHandoff, /labels:\s*\[\.\.\.linkedIssue\.data\.labels\.map\(label => label\.name\), 'ready-for-human'\]/);
});

test("TPT human decision request is idempotently marked", async () => {
  const tpt = await read(".github/workflows/tpt-workstream.yml");
  assert.match(tpt, /tpt-human-gate-request:v1/);
  assert.match(tpt, /HUMAN_DECISION_REQUEST:v1/);
  assert.match(tpt, /existingComments\.some\(comment => \(comment\.body \|\| ''\)\.includes\('<!-- tpt-human-gate-request:v1 -->'\)\)/);
});
