import test from "node:test";
import assert from "node:assert/strict";
import { buildMonthlyReleaseDispatch } from "../scripts/build-monthly-release-dispatch.mjs";

const validManifest = {
  schemaVersion: "1.0.0",
  packageId: "december-morning-work-math",
  packageVersion: "v1.0.0",
  month: "December",
  year: 2026,
  sourceCommit: "6369faa",
  releaseStatus: "released",
  stale: false,
  artifacts: [
    { id: "finalPdf", kind: "pdf", path: "output/pdf/december-2026-final.pdf", sha256: "a".repeat(64), required: true },
    { id: "coverPdfPage", kind: "png", path: "output/tpt/december-morning-work-math/visual-assets/2026-12-cover.png", sha256: "b".repeat(64), required: true },
    { id: "pageMappings", kind: "json", path: "reports/december-tpt/page-mappings.json", sha256: "c".repeat(64), required: true },
    { id: "thumbnails", kind: "directory", path: "output/tpt/december-morning-work-math/visual-assets", sha256: "0".repeat(64), required: true },
    { id: "thumbnailQa", kind: "json", path: "reports/december-tpt/thumbnail-qa.json", sha256: "d".repeat(64), required: true },
  ],
  gates: { content: true, mathematics: true, source: true, layout: true, pdf: true, cover: true, derivedAssets: true },
};

test("maps a released manifest to both downstream workflows", () => {
  const result = buildMonthlyReleaseDispatch({ manifest: validManifest, manifestPath: "releases/december-2026.manifest.json" });
  assert.equal(result.valid, true);
  assert.equal(result.month, "December");
  assert.equal(result.contentPath, "data/monthly/2026-12-content-v2.json");
  assert.equal(result.thumbnailManifestPath, "examples/december-thumbnail-manifest.json");
  assert.deepEqual(result.workflows, ["Queue monthly social workstreams", "Start TPT from released monthly package"]);
});

test("rejects an unreleased manifest", () => {
  const result = buildMonthlyReleaseDispatch({ manifest: { ...validManifest, releaseStatus: "review" }, manifestPath: "releases/december-2026.manifest.json" });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("; "), /releaseStatus/);
});
