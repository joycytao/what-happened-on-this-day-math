import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const PYTHON = process.env.PYTHON_BIN || (
  existsSync("/Users/jtao/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3")
    ? "/Users/jtao/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"
    : "python3"
);

test("generic thumbnail parity emits deterministic fixed/variable QA artifacts", async () => {
  const generatedDir = await mkdtemp(join(tmpdir(), "thumbnail-parity-generated-"));
  const qaDir = await mkdtemp(join(tmpdir(), "thumbnail-parity-qa-"));
  const generated = spawnSync(PYTHON, [
    "scripts/generate_monthly_thumbnails.py",
    "--manifest", "examples/november-thumbnail-manifest.json",
    "--output-dir", generatedDir,
  ], { encoding: "utf8" });
  assert.equal(generated.status, 0, generated.stderr || generated.stdout);

  const qa = spawnSync(PYTHON, [
    "scripts/validate_thumbnail_visual_parity.py",
    "--type", "different_math",
    "--reference", "references /thumbnail-assets/thumbnail-3-reference.png",
    "--generated", join(generatedDir, "november-v1.0-different-math.png"),
    "--output-dir", qaDir,
  ], { encoding: "utf8" });
  assert.equal(qa.status, 0, qa.stderr || qa.stdout);
  const report = JSON.parse(await readFile(join(qaDir, "different_math-visual-qa.json"), "utf8"));
  assert.equal(report.visualAcceptance.passed, true);
  assert.equal(report.normalized.size[0], 1260);
  assert.ok(report.outsideVariableRegions.changed_pixel_count >= 0);
  for (const artifact of report.artifacts) assert.ok(existsSync(join(qaDir, artifact)), artifact);
});
