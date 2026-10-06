import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const monthly = fs.readFileSync(".github/workflows/social-monthly-queue.yml", "utf8");
const utility = fs.readFileSync(".github/workflows/social-utility-queue.yml", "utf8");
const unblock = fs.readFileSync(".github/workflows/social-dependency-unblock.yml", "utf8");
const docs = fs.readFileSync("docs/social-orchestration.md", "utf8");

test("monthly queue is release-driven and manually dispatchable, not a production cron", () => {
  assert.match(monthly, /workflow_run:/);
  assert.match(monthly, /workflows: \[Monthly package release\]/);
  assert.match(monthly, /workflow_dispatch:/);
  assert.match(monthly, /build-social-issue-plan\.mjs/);
  assert.match(monthly, /addProjectV2ItemById/);
  assert.doesNotMatch(monthly, /schedule:/);
  assert.match(docs, /Codex automation is the only production worker/);
});

test("utility queue requires owner-ready intake and keeps later weeks blocked", () => {
  assert.match(utility, /issues:/);
  assert.match(utility, /types: \[labeled\]/);
  assert.match(utility, /status:ready to pickup/);
  assert.match(utility, /\[Utility Reel intake\]/);
  assert.match(utility, /build-social-issue-plan\.mjs/);
  assert.match(unblock, /codex-social-utility/);
  assert.match(unblock, /status:ready to pickup/);
});
