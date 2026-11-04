import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

test("prepares the approved December follow-up artifact and visual evidence", async () => {
  const root = new URL("..", import.meta.url).pathname;
  const output = await mkdtemp(join(tmpdir(), "monthly-follow-up-"));
  await run("node", [join(root, "scripts/prepare-monthly-follow-up.mjs"), "2026-12", output], { cwd: root });
  const artifact = JSON.parse(await readFile(join(output, "follow-up-artifact.json"), "utf8"));
  const visual = JSON.parse(await readFile(join(output, "visual-qa.json"), "utf8"));
  assert.equal(artifact.pageCount, 1);
  assert.equal(artifact.position, "after-answer-key");
  assert.equal(artifact.assetSha256, "47a58a4831063ae84d99ccecc77efe9dbf7b9084154decd328bab20233e3e83e");
  assert.equal(visual.passed, true);
  assert.equal(visual.fixedRegionSimilarity, 1);
  assert.deepEqual(visual.artifacts, ["side-by-side.png", "overlay.png", "pixel-diff-heatmap.png"]);
});
