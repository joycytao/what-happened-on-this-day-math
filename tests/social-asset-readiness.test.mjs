import test from "node:test";
import assert from "node:assert/strict";

import { buildMonthlySocialIssuePlan, validateAssetResources } from "../src/social-orchestration.mjs";

const base = {
  month: "October",
  year: "2026",
  packageId: "october-v1.0",
  manifestPath: "releases/october-v1.0.manifest.json",
  contentPath: "content/monthly/month-10.json",
  thumbnailManifestPath: "output/tpt/october-v1.0/visual-assets/landing-page-handoff.json",
  runUrl: "https://github.com/example/actions/runs/1",
};

test("asset readiness rejects missing, empty, and placeholder resources", () => {
  for (const resources of [undefined, [], [""], ["TBD"], ["placeholder.png"], ["<attach resource>"]]) {
    const result = validateAssetResources(resources);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  }
});

test("asset readiness accepts usable repository paths and URLs", () => {
  const result = validateAssetResources(["output/worksheet.png", "https://example.com/reference.png"]);
  assert.deepEqual(result, { valid: true, errors: [], resources: ["output/worksheet.png", "https://example.com/reference.png"] });
});

test("monthly social pickup remains blocked until resources are declared", () => {
  const blocked = buildMonthlySocialIssuePlan({ ...base, assetResources: [] });
  assert.equal(blocked.valid, true);
  assert.equal(blocked.assetReady, false);
  assert.ok(blocked.issues.slice(1).every((issue) => issue.labels.includes("status:blocked")));
  const ready = buildMonthlySocialIssuePlan({ ...base, assetResources: [base.manifestPath, base.contentPath, base.thumbnailManifestPath] });
  assert.equal(ready.assetReady, true);
  assert.ok(ready.issues[1].labels.includes("status:ready to pickup"));
});
