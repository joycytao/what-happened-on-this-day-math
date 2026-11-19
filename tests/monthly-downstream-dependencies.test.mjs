import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const tptTrigger = fs.readFileSync(".github/workflows/tpt-release-trigger.yml", "utf8");
const tpt = fs.readFileSync(".github/workflows/tpt-workstream.yml", "utf8");
const social = fs.readFileSync(".github/workflows/social-monthly-queue.yml", "utf8");

test("TPT and social consume the exact release commit and validate the same package identity", () => {
  assert.match(tpt, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(social, /ref: \$\{\{ github\.sha \}\}/);
  for (const workflow of [tpt, social]) {
    assert.match(workflow, /validateMonthlyReleaseManifest/);
    assert.match(workflow, /packageId mismatch/);
  }
});

test("downstream triggers remain release-gated and preserve the package id", () => {
  assert.doesNotMatch(tptTrigger, /workflow_run:/);
  assert.match(tptTrigger, /workflow_dispatch:/);
  assert.match(tptTrigger, /package_id:/);
  assert.doesNotMatch(social, /workflow_run:/);
  assert.match(social, /workflow_dispatch:/);
  assert.match(social, /PACKAGE_ID:/);
  assert.match(social, /concurrency:/);
});
