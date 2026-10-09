import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Carousel handoff workflow uses the same approval and idempotency gates", () => {
  const workflow = fs.readFileSync(".github/workflows/product-confirmed-carousel-handoff.yml", "utf8");
  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /--template carousel/);
  assert.match(workflow, /status: ready to dispatch/);
  assert.match(workflow, /approval_label_missing/);
  assert.match(workflow, /product-handoff-id/);
  assert.match(workflow, /status: ready to pickup/);
  assert.match(workflow, /type: feature/);
});
