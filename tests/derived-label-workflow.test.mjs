import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const files = [
  ".github/workflows/agent-handoff-queue.yml",
  ".github/workflows/handoff-router.yml",
  ".github/workflows/pr-handoff.yml",
  ".github/workflows/social-dependency-unblock.yml",
  ".github/workflows/social-monthly-queue.yml",
  ".github/workflows/social-utility-queue.yml",
];

test("derived-label producers reconcile deprecated labels before idempotent exits", () => {
  const source = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(source, /addLabels\([\s\S]{0,220}agent-requested/);
  assert.match(source, /deprecated = new Set/);
  assert.match(source, /current\.filter\(derived\)/);
});

test("social label producers emit canonical spaced statuses", () => {
  const source = [
    ".github/workflows/social-dependency-unblock.yml",
    ".github/workflows/social-monthly-queue.yml",
    ".github/workflows/social-utility-queue.yml",
  ].map((file) => fs.readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(source, /labels:\s*\[[^\]]*status:ready to pickup/);
  assert.doesNotMatch(source, /labels:\s*\[[^\]]*status:pending review/);
  assert.doesNotMatch(source, /labels:\s*\[[^\]]*status:blocked/);
  assert.doesNotMatch(source, /addLabels\([\s\S]{0,220}status:(?:ready to pickup|pending review|blocked)/);
});
