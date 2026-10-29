import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

async function snapshot(directory) {
  const files = (await readdir(directory)).sort();
  return Object.fromEntries(await Promise.all(files.map(async (file) => [file, await readFile(join(directory, file), "base64")])));
}

test("regenerates the complete monthly thumbnail package deterministically", async () => {
  const first = await mkdtemp(join(tmpdir(), "monthly-thumbnail-package-a-"));
  const second = await mkdtemp(join(tmpdir(), "monthly-thumbnail-package-b-"));
  const run = (outputDir) => spawnSync(process.execPath, [
    "scripts/run-monthly-thumbnail-package.mjs",
    "--manifest", "examples/november-thumbnail-manifest.json",
    "--output-dir", outputDir,
  ], { encoding: "utf8" });

  const firstResult = run(first);
  assert.equal(firstResult.status, 0, firstResult.stderr || firstResult.stdout);
  const secondResult = run(second);
  assert.equal(secondResult.status, 0, secondResult.stderr || secondResult.stdout);

  const required = [
    "landing-page-handoff.json",
    "listing.md",
    "metadata.json",
    "monthly-thumbnail-report.json",
    "package-manifest.json",
    "visual-structure-qa.json",
    "november-v1.0-cover.png",
    "november-v1.0-whats-included.png",
    "november-v1.0-different-math.png",
    "november-v1.0-daily-practice.png",
    "november-v1.0-landing-page.png",
  ].sort();
  const actualFiles = (await readdir(first)).sort();
  for (const file of required) assert.ok(actualFiles.includes(file), file);
  assert.deepEqual(await snapshot(first), await snapshot(second));

  const metadata = JSON.parse(await readFile(join(first, "metadata.json"), "utf8"));
  assert.equal(metadata.package.id, "november-morning-work-math");
  assert.equal(metadata.package.dayCount, 30);
  assert.equal(metadata.qa.humanReviewRequired, true);
});
