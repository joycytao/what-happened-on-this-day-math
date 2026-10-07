import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/tpt-workstream.yml", "utf8");
const triggerWorkflow = fs.readFileSync(".github/workflows/tpt-release-trigger.yml", "utf8");

test("TPT workflow exposes Project configuration and persists a sync plan", () => {
  assert.match(workflow, /project_owner:/);
  assert.match(workflow, /project_number:/);
  assert.match(workflow, /repository-projects: write/);
  assert.match(workflow, /write-tpt-project-plan\.mjs/);
  assert.match(workflow, /updateProjectV2ItemFieldValue/);
});

test("release trigger starts TPT only after a successful monthly release", () => {
  assert.match(triggerWorkflow, /workflow_run:/);
  assert.match(triggerWorkflow, /workflows: \[Monthly package release\]/);
  assert.match(triggerWorkflow, /types: \[completed\]/);
  assert.match(triggerWorkflow, /conclusion == 'success'/);
  assert.match(triggerWorkflow, /uses: \.\/\.github\/workflows\/tpt-workstream\.yml/);
  assert.match(triggerWorkflow, /thumbnail_manifest_path:/);
});

test("successful TPT runs persist the complete generated package, not only the handoff directory", () => {
  assert.match(workflow, /name: Commit complete TPT package to main/);
  assert.match(workflow, /PACKAGE_DIR: output\/tpt\/\$\{\{ inputs\.package_id \}\}/);
  assert.match(workflow, /git add "\$PACKAGE_DIR"/);
  assert.doesNotMatch(workflow, /git add "\$HANDOFF_DIR"/);
  assert.match(workflow, /git commit -m "Publish TPT package for \$\{PACKAGE_ID\}"/);
});
