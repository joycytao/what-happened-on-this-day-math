import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { loadThumbnailRegressionFixtures } from "../src/thumbnail-regression-fixtures.mjs";

test("registers every observed thumbnail failure mode against contract regions", () => {
  const result = loadThumbnailRegressionFixtures();
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.deepEqual(result.fixtures.map((fixture) => fixture.id), [
    "daily-practice-frame",
    "different-math-fan",
    "whats-included-screenshot-only",
    "landing-page-card-seam",
    "cover-typography-doodle",
  ]);
  assert.ok(result.fixtures.every((fixture) => fixture.failure_modes.length > 0));
});

test("fixture validation fails when a renderer references an undeclared region", async () => {
  const directory = await mkdtemp(join(tmpdir(), "thumbnail-fixtures-"));
  const fixtures = JSON.parse(await readFile("examples/thumbnail-regression-fixtures.example.json", "utf8"));
  fixtures.fixtures[0].fixed_regions.push("missing-region");
  const fixturesPath = join(directory, "fixtures.json");
  await writeFile(fixturesPath, `${JSON.stringify(fixtures)}\n`);
  const result = loadThumbnailRegressionFixtures({ fixturesPath });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /unknown fixed region missing-region/);
});
