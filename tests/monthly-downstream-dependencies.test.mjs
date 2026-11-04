import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const tptTrigger = fs.readFileSync(".github/workflows/tpt-release-trigger.yml", "utf8");
const tpt = fs.readFileSync(".github/workflows/tpt-workstream.yml", "utf8");
const social = fs.readFileSync(".github/workflows/social-monthly-queue.yml", "utf8");

test("TPT and social consume the exact release commit and validate the same package identity", () => {
  assert.match(tpt, /ref: \$\{\{ github\.event\.workflow_run\.head_sha \|\| github\.sha \}\}/);
  assert.match(social, /ref: \$\{\{ github\.event\.workflow_run\.head_sha \|\| github\.sha \}\}/);
  for (const workflow of [tpt, social]) {
    assert.match(workflow, /validateMonthlyReleaseManifest/);
    assert.match(workflow, /packageId mismatch/);
  }
});

test("downstream triggers remain release-gated and preserve the package id", () => {
  assert.match(tptTrigger, /workflows: \[Monthly package release\]/);
  assert.match(tptTrigger, /conclusion == 'success'/);
  assert.match(tptTrigger, /package_id:/);
  assert.match(social, /workflows: \[Monthly package release\]/);
  assert.match(social, /PACKAGE_ID:/);
  assert.match(social, /concurrency:/);
});
