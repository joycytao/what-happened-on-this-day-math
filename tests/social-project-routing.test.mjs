import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const files = [
  ".github/workflows/social-monthly-queue.yml",
  ".github/workflows/social-utility-queue.yml",
  ".github/workflows/product-confirmed-reel-handoff.yml",
  ".github/workflows/product-confirmed-carousel-handoff.yml",
];

test("all social producers route through configurable Social Project settings", () => {
  for (const filename of files) {
    const workflow = fs.readFileSync(filename, "utf8");
    assert.match(workflow, /SOCIAL_PROJECT_OWNER/, filename);
    assert.match(workflow, /SOCIAL_PROJECT_NUMBER/, filename);
    assert.match(workflow, /repository-projects: write/, filename);
    assert.match(workflow, /addProjectV2ItemById/, filename);
    assert.doesNotMatch(workflow, /updateProjectV2ItemFieldValue/, filename);
  }
});

test("handoffs retain approval and idempotency behavior while adding social labels", () => {
  const reel = fs.readFileSync(files[2], "utf8");
  const carousel = fs.readFileSync(files[3], "utf8");
  for (const workflow of [reel, carousel]) {
    assert.match(workflow, /status: ready to dispatch/);
    assert.match(workflow, /product-handoff-id/);
    assert.match(workflow, /github\.rest\.issues\.update/);
    assert.match(workflow, /github\.rest\.issues\.create/);
  }
  assert.match(reel, /social:product-reel/);
  assert.match(carousel, /social:carousel/);
});
