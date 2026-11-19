import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("monthly production queue listens for ready labels and writes no guessed project field options", () => {
  const workflow = fs.readFileSync(new URL("../.github/workflows/monthly-production-queue-v2.yml", import.meta.url), "utf8");
  assert.match(workflow, /issues:/);
  assert.match(workflow, /types:\s*\[labeled\]/);
  assert.match(workflow, /status: ready to pickup/);
  assert.match(workflow, /monthly-context/);
  assert.match(workflow, /addProjectV2ItemById/);
  assert.match(workflow, /status fields remain human-managed/);
  assert.doesNotMatch(workflow, /updateProjectV2ItemFieldValue/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /if:\s*"github\.event_name.*monthly-context:/);
  assert.match(workflow, /MATH_PROJECT_OWNER/);
  assert.match(workflow, /Math Project routing is not configured/);
});
