import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import { validateMonthlyReleaseManifest, verifyMonthlyReleaseManifestFiles } from "../src/monthly-release-manifest.mjs";

const manifest = JSON.parse(fs.readFileSync("releases/december-2026.manifest.json", "utf8"));
const workstream = JSON.parse(fs.readFileSync("reports/december-tpt/workstream.json", "utf8"));
const inventory = JSON.parse(fs.readFileSync("output/tpt/december-morning-work-math/inventory.json", "utf8"));
const metadata = JSON.parse(fs.readFileSync("output/tpt/december-morning-work-math/metadata.json", "utf8"));

test("December TPT release manifest and files are eligible", () => {
  assert.equal(validateMonthlyReleaseManifest(manifest, { month: "December", year: 2026 }).valid, true);
  assert.equal(verifyMonthlyReleaseManifestFiles(manifest, process.cwd()).valid, true);
  assert.equal(workstream.status, "qa");
  assert.equal(inventory.deterministic, true);
  assert.equal(inventory.archiveIntegrity, true);
});

test("December TPT copy is release-scoped and human-QA gated", () => {
  assert.equal(metadata.package.id, "december-morning-work-math");
  assert.equal(metadata.listing.title, "December Morning Work Math");
  assert.equal(metadata.listing.contents.dailyModules, 31);
  assert.equal(metadata.listing.contents.answerKeys, 3);
  assert.equal(metadata.claims.humanQaRequired, true);
  assert.equal(metadata.claims.publicationStatus, "review");
  assert.equal(metadata.listing.sourceReferences.pageMappings, "reports/december-tpt/page-mappings.json");
  assert.equal(metadata.listing.sourceReferences.thumbnailQa, "reports/december-tpt/thumbnail-qa.json");
});

test("packaged cover checksum matches the release manifest", () => {
  const cover = manifest.artifacts.find((artifact) => artifact.id === "coverPdfPage");
  const bytes = fs.readFileSync(cover.path);
  assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), cover.sha256);
});
