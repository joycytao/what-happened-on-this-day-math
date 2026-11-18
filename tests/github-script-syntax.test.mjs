import assert from "node:assert/strict";
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
