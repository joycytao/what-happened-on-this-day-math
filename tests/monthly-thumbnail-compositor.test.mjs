import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("renders only the unique source pages declared by the October manifest", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "monthly-thumbnail-pages-"));
  const result = spawnSync(process.env.PYTHON_BIN || "python3", [
    "scripts/render_monthly_thumbnail_pages.py",
    "--manifest", "examples/monthly-thumbnail.example.json",
    "--output-dir", outputDir,
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual((await readdir(outputDir)).sort(), [
    "page-001.png",
    "page-002.png",
    "page-003.png",
    "page-004.png",
    "page-125.png",
    "source-pages.json",
  ]);

  const report = JSON.parse(await readFile(join(outputDir, "source-pages.json"), "utf8"));
  assert.deepEqual(report.pages.map(({ page, types }) => [page, types]), [
    [1, ["whats_included.story"]],
    [2, ["daily_practice.worksheet", "different_math.level1", "whats_included.level1"]],
    [3, ["different_math.level2", "whats_included.level2"]],
    [4, ["different_math.level3", "whats_included.level3"]],
    [125, ["whats_included.answer_key"]],
  ]);
});
