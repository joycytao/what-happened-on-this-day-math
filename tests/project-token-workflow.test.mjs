import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workflows = [
  ".github/workflows/monthly-production-queue-v2.yml",
  ".github/workflows/social-monthly-queue.yml",
  ".github/workflows/social-utility-queue.yml",
  ".github/workflows/product-confirmed-reel-handoff.yml",
  ".github/workflows/product-confirmed-carousel-handoff.yml",
  ".github/workflows/tpt-workstream.yml",
];

test("Project sync workflows authenticate with the user-project token", () => {
  for (const filename of workflows) {
    const workflow = fs.readFileSync(filename, "utf8");
    assert.match(workflow, /github-token:\s*\$\{\{ secrets\.GITHUB_PROJECTS_TOKEN \}\}/, filename);
  }
});
