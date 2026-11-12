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
  assert.match(workflow, /\.\.\. on ProjectV2Field \{ id name \}/);
  assert.match(workflow, /\.\.\. on ProjectV2SingleSelectField \{ id name options \{ id name \} \}/);
  assert.doesNotMatch(workflow, /nodes \{\s+__typename\s+id\s+name/);
});

test("TPT visual generation has portable fonts and does not continue after a failed workstream", () => {
  const generator = fs.readFileSync("scripts/generate_monthly_thumbnails.py", "utf8");
  assert.match(workflow, /fonts-dejavu/);
  assert.match(workflow, /test -f \/usr\/share\/fonts\/truetype\/dejavu\/DejaVuSans-Bold\.ttf/);
  assert.match(generator, /DejaVuSans-Bold\.ttf/);
  assert.match(generator, /No supported production font found/);
  assert.match(workflow, /name: Block incomplete TPT workstream[\s\S]*if: steps\.workstream\.outcome != 'success'/);
  assert.match(workflow, /name: Build deterministic Project sync plan[\s\S]*if: steps\.visual-assets\.outcome == 'success' && steps\.visual-review\.outcome == 'success' && steps\.workstream\.outcome == 'success'/);
  assert.match(workflow, /name: Dispatch landing-page thumbnail handoff[\s\S]*if: steps\.project-plan\.outcome == 'success'/);
});

test("landing-page copy is rendered into canonical typography boxes", () => {
  const generator = fs.readFileSync("scripts/generate_monthly_thumbnails.py", "utf8");
  assert.match(generator, /def landing_text_box\(canvas, text, box, bold=True\)/);
  assert.match(generator, /landing_text_box\(canvas, month\.title\(\), \(310, 63, 952, 190\)\)/);
  assert.match(generator, /landing_text_box\(canvas, "Morning Work Math", \(71, 200, 1189, 339\)\)/);
  assert.match(generator, /landing_text_box\(canvas, f"\{day_count\} Daily Word Problems · 3 Levels", \(127, 349, 1130, 418\),?\)/);
});

test("release router is the single explicit TPT dispatcher", () => {
  assert.doesNotMatch(triggerWorkflow, /workflow_run:/);
  assert.match(triggerWorkflow, /workflow_dispatch:/);
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
