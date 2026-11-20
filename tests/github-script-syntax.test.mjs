import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateGithubScriptSyntax, validateWorkflowGithubScripts } from "../scripts/validate-github-scripts.mjs";

test("rejects invalid nested template syntax before GitHub Actions runs", () => {
  const result = validateGithubScriptSyntax("const body = `Handoff `${id}` routed`;\n");
  assert.equal(result.valid, false);
});

test("accepts the fixed routed-comment template", () => {
  const result = validateGithubScriptSyntax("const body = `Handoff ${id} routed`;\n");
  assert.equal(result.valid, true);
});

test("all repository GitHub Script blocks compile", () => {
  const result = validateWorkflowGithubScripts(".github/workflows");
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("handoff router accepts ready-for-human as the QE terminal state", async () => {
  const workflow = await readFile(".github/workflows/handoff-router.yml", "utf8");
  assert.match(workflow, /'quality-engineer', 'ready-for-human'/);
  assert.match(workflow, /handoff\.from === 'quality-engineer' && handoff\.status === 'completed'/);
});

test("PR handoff workflow delegates human-gate validation to the shared validator", async () => {
  const workflow = await readFile(".github/workflows/pr-handoff.yml", "utf8");
  assert.match(workflow, /validateReadyForHumanGate/);
  assert.match(workflow, /labels: \[\.\.\.linkedIssue\.data\.labels\.map\(label => label\.name\), 'ready-for-human'\]/);
  assert.match(workflow, /\|\| 'routine'/);
  assert.doesNotMatch(workflow, /\|\| 'final-merge'/);
});

test("PR handoff workflow ignores the developer-to-QE review handoff", async () => {
  const workflow = await readFile(".github/workflows/pr-handoff.yml", "utf8");
  assert.match(workflow, /isDeveloperToQualityHandoff/);
  assert.match(workflow, /if \(isDeveloperToQualityHandoff\) return;/);
});

test("PR synchronize can resume QA routing after a rejected handoff", async () => {
  const workflow = await readFile(".github/workflows/pr-handoff.yml", "utf8");
  assert.match(workflow, /issueAlreadyNeedsRepair/);
  assert.match(workflow, /!hasDeveloperHandoff && !issueAlreadyNeedsRepair/);
});

test("PR consultation handoffs preserve the live QA state", async () => {
  const workflow = await readFile(".github/workflows/pr-handoff.yml", "utf8");
  assert.match(workflow, /const currentLabels = async \(\) =>/);
  assert.doesNotMatch(workflow, /stateTransition\(linkedIssue\.data\.labels\.map\(label => label\.name\), body\(id, 'pm-triage', '(?:architect|social-expert)'/);
});
