import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/tpt-workstream.yml", "utf8");

test("TPT workflow exposes Project configuration and persists a sync plan", () => {
  assert.match(workflow, /project_owner:/);
  assert.match(workflow, /project_number:/);
  assert.match(workflow, /repository-projects: write/);
  assert.match(workflow, /write-tpt-project-plan\.mjs/);
  assert.match(workflow, /updateProjectV2ItemFieldValue/);
});
