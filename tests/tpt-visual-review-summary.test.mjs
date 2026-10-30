import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("writes one review link record per thumbnail and fails closed for missing evidence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tpt-review-summary-"));
  const visual = path.join(root, "visual-assets");
  fs.mkdirSync(visual);
  const names = ["cover", "whats-included", "different-math", "daily-practice", "landing-page"];
  for (const name of names) fs.writeFileSync(path.join(visual, `${name}.png`), `${name}-fixture`);
  fs.writeFileSync(path.join(visual, "landing-page-handoff.json"), JSON.stringify({
    templateVersion: "thumbnail-template-v1",
    sourcePdf: { path: "release.pdf", sha256: "a".repeat(64), pageCount: 125 },
    assets: names.map((id) => ({ id, path: path.join(visual, `${id}.png`), width: 1260, height: 1260 })),
    qa: { deterministic: true, dimensions: true },
  }));
  fs.writeFileSync(path.join(visual, "visual-structure-qa.json"), JSON.stringify({ results: names.map((asset) => ({ asset, passed: true })) }));
  fs.writeFileSync(path.join(visual, "monthly-thumbnail-report.json"), JSON.stringify({ design: "thumbnail-template-v1" }));
  const output = path.join(root, "review-summary.json");
  execFileSync("node", ["scripts/write-tpt-visual-review-summary.mjs", visual, output], {
    cwd: process.cwd(),
    env: { ...process.env, ARTIFACT_NAME: "tpt-fixture", RUN_URL: "https://github.com/example/repo/actions/runs/1" },
  });
  const summary = JSON.parse(fs.readFileSync(output, "utf8"));
  assert.equal(summary.valid, true);
  assert.deepEqual(summary.assets.map((asset) => asset.id), names);
  assert.ok(summary.assets.every((asset) => /^[a-f0-9]{64}$/.test(asset.sha256)));
  assert.match(fs.readFileSync(output.replace(/\.json$/, ".md"), "utf8"), /one review link|download artifact/);
  fs.rmSync(root, { recursive: true, force: true });
});

test("summary returns a non-zero exit for missing thumbnail evidence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tpt-review-summary-missing-"));
  const visual = path.join(root, "visual-assets");
  fs.mkdirSync(visual);
  fs.writeFileSync(path.join(visual, "landing-page-handoff.json"), JSON.stringify({ assets: [], qa: {} }));
  fs.writeFileSync(path.join(visual, "visual-structure-qa.json"), JSON.stringify({ results: [] }));
  fs.writeFileSync(path.join(visual, "monthly-thumbnail-report.json"), JSON.stringify({ design: "thumbnail-template-v1" }));
  assert.throws(
    () => execFileSync("node", ["scripts/write-tpt-visual-review-summary.mjs", visual, path.join(root, "summary.json")], { cwd: process.cwd() }),
    (error) => error.status === 1,
  );
  fs.rmSync(root, { recursive: true, force: true });
});
