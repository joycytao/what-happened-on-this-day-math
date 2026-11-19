import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { validateWorksheetCoverVisual } from "../src/worksheet-cover-visual-qa.mjs";

test("canonical reference self-check produces pixel artifacts and passes", async () => {
  const root = new URL("..", import.meta.url).pathname;
  const reference = join(root, "references /worksheet-assets/worksheet-cover-reference.png");
  const outputDir = await mkdtemp(join("/private/tmp", "worksheet-cover-qa-"));
  try {
    const report = await validateWorksheetCoverVisual({ referencePath: reference, candidatePath: reference, outputDir, promptVersion: "1.0.0", iteration: 1 });
    assert.equal(report.passed, true);
    assert.equal(report.fixedRegionSimilarity, 1);
    assert.deepEqual(report.artifacts, ["side-by-side.png", "overlay.png", "pixel-diff-heatmap.png"]);
    assert.match(await readFile(join(outputDir, "visual-qa.json"), "utf8"), /"passed": true/);
  } finally { await rm(outputDir, { recursive: true, force: true }); }
});
