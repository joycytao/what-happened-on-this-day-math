import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Product Reel handoff workflow is approval-gated and idempotent", () => {
  const workflow = fs.readFileSync(".github/workflows/product-confirmed-reel-handoff.yml", "utf8");
  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /status: ready to dispatch/);
  assert.match(workflow, /approval_label_missing/);
  assert.match(workflow, /product-handoff-id/);
  assert.match(workflow, /status: ready to pickup/);
  assert.match(workflow, /type: feature/);
  assert.match(workflow, /github\.rest\.issues\.update/);
  assert.match(workflow, /github\.rest\.issues\.create/);
});
