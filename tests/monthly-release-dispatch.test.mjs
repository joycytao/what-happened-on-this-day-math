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
  assert.match(result.releaseIdentity, /^[a-f0-9]{64}$/);
  assert.deepEqual(result.workflows, ["Queue monthly social workstreams", "Start TPT from released monthly package"]);
});

test("keeps release identity stable when only non-release metadata changes", () => {
  const first = buildMonthlyReleaseDispatch({ manifest: validManifest, manifestPath: "releases/december-2026.manifest.json" });
  const second = buildMonthlyReleaseDispatch({
    manifest: { ...validManifest, workflowRun: 43962274826, generatedAt: "2026-11-18T00:00:00Z" },
    manifestPath: "releases/december-2026.manifest.json",
  });
  assert.equal(second.releaseIdentity, first.releaseIdentity);
});

test("changes release identity when a publishable artifact changes", () => {
  const first = buildMonthlyReleaseDispatch({ manifest: validManifest, manifestPath: "releases/december-2026.manifest.json" });
  const second = buildMonthlyReleaseDispatch({
    manifest: {
      ...validManifest,
      artifacts: validManifest.artifacts.map((artifact) => artifact.id === "finalPdf" ? { ...artifact, sha256: "f".repeat(64) } : artifact),
    },
    manifestPath: "releases/december-2026.manifest.json",
  });
  assert.notEqual(second.releaseIdentity, first.releaseIdentity);
});

test("rejects an unreleased manifest", () => {
  const result = buildMonthlyReleaseDispatch({ manifest: { ...validManifest, releaseStatus: "review" }, manifestPath: "releases/december-2026.manifest.json" });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("; "), /releaseStatus/);
});
