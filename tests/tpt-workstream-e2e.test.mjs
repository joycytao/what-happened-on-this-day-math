import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";

const root = process.cwd();
const contentPath = "content/monthly/month-10.json";
const taxonomy = JSON.parse(fs.readFileSync("examples/tpt-metadata-taxonomy.example.json", "utf8"));

function digest(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function fixture() {
  const relative = `.tmp-tpt-e2e-${process.pid}-${Date.now()}`;
  const directory = path.join(root, relative);
  const thumbnailDirectory = path.join(directory, "thumbnails");
  fs.mkdirSync(thumbnailDirectory, { recursive: true });
  for (const [name, value] of [["packet.pdf", "approved-pdf"], ["cover.pdf", "approved-cover"], ["mapping.json", "{}"], ["qa.json", '{"passed":true}']]) {
    fs.writeFileSync(path.join(directory, name), value);
  }
  fs.writeFileSync(path.join(thumbnailDirectory, "cover.png"), "approved-thumbnail");
  const artifact = (id, kind, file) => ({ id, kind, path: `${relative}/${file}`, sha256: digest(path.join(root, relative, file)), required: true });
  const manifest = {
    schemaVersion: "1.0.0",
    packageId: "october-morning-work-math",
    packageVersion: "v1.0.0",
    month: "October",
    year: 2026,
    sourceCommit: "fixture-commit",
    releaseStatus: "released",
    stale: false,
    artifacts: [
      artifact("finalPdf", "pdf", "packet.pdf"),
      artifact("coverPdfPage", "pdf-page", "cover.pdf"),
      artifact("pageMappings", "json", "mapping.json"),
      { id: "thumbnails", kind: "directory", path: `${relative}/thumbnails`, sha256: "0".repeat(64), required: true },
      artifact("thumbnailQa", "json", "qa.json")
    ],
    gates: { content: true, mathematics: true, source: true, layout: true, pdf: true, cover: true, derivedAssets: true }
  };
  const manifestPath = path.join(directory, "manifest.json");
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { relative, directory, manifestPath: `${relative}/manifest.json`, manifest };
}

function run(fixtureData, outputName, expectSuccess = true) {
  const outputDir = path.join(fixtureData.directory, outputName);
  try {
    execFileSync("node", ["scripts/run-tpt-workstream.mjs", "--month", "10", "--year", "2026", "--package-id", fixtureData.manifest.packageId, "--manifest", fixtureData.manifestPath, "--content", contentPath, "--output-dir", `${fixtureData.relative}/${outputName}`], { cwd: root, encoding: "utf8", stdio: "pipe" });
    if (!expectSuccess) assert.fail("expected the TPT run to fail");
  } catch (error) {
    if (expectSuccess) {
      error.message += `\nstdout: ${error.stdout ?? ""}\nstderr: ${error.stderr ?? ""}`;
      throw error;
    }
  }
  return outputDir;
}

test("runs the complete local TPT fixture and is idempotent", () => {
  const data = fixture();
  try {
    const first = run(data, "out-a");
    const second = run(data, "out-b");
    const firstReport = JSON.parse(fs.readFileSync(path.join(first, "workstream.json"), "utf8"));
    const secondReport = JSON.parse(fs.readFileSync(path.join(second, "workstream.json"), "utf8"));
    assert.equal(firstReport.status, "qa");
    assert.deepEqual({ ...firstReport, outputDir: "", reportPath: "" }, { ...secondReport, outputDir: "", reportPath: "" });
    assert.equal(JSON.parse(fs.readFileSync(path.join(first, "metadata.json"), "utf8")).package.id, data.manifest.packageId);
    assert.match(fs.readFileSync(path.join(first, "listing.md"), "utf8"), /Publication remains pending human QA/);
    assert.equal(JSON.parse(fs.readFileSync(path.join(first, "inventory.json"), "utf8")).archiveIntegrity, true);
  } finally {
    fs.rmSync(data.directory, { recursive: true, force: true });
  }
});

test("stale release fixtures stop before publish-ready", () => {
  const data = fixture();
  try {
    data.manifest.stale = true;
    fs.writeFileSync(path.join(data.directory, "manifest.json"), `${JSON.stringify(data.manifest, null, 2)}\n`);
    const output = run(data, "stale", false);
    const report = JSON.parse(fs.readFileSync(path.join(output, "workstream.json"), "utf8"));
    assert.equal(report.status, "blocked");
    assert.match(report.failureReason, /stale/);
  } finally {
    fs.rmSync(data.directory, { recursive: true, force: true });
  }
});

test("wrong-month and missing-asset fixtures stop before generation", () => {
  const data = fixture();
  try {
    data.manifest.month = "November";
    fs.writeFileSync(path.join(data.directory, "manifest.json"), `${JSON.stringify(data.manifest, null, 2)}\n`);
    const wrongMonth = run(data, "wrong-month", false);
    const wrongMonthReport = JSON.parse(fs.readFileSync(path.join(wrongMonth, "workstream.json"), "utf8"));
    assert.match(wrongMonthReport.failureReason, /month mismatch/);

    data.manifest.month = "October";
    data.manifest.artifacts[1].path = `${data.relative}/missing-cover.pdf`;
    fs.writeFileSync(path.join(data.directory, "manifest.json"), `${JSON.stringify(data.manifest, null, 2)}\n`);
    const missing = run(data, "missing-asset", false);
    const missingReport = JSON.parse(fs.readFileSync(path.join(missing, "workstream.json"), "utf8"));
    assert.match(missingReport.failureReason, /coverPdfPage/);
  } finally {
    fs.rmSync(data.directory, { recursive: true, force: true });
  }
});

test("keeps the TPT taxonomy fixture loadable", () => {
  assert.equal(taxonomy.schemaVersion, "1.0.0");
});
