import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { promisify } from "node:util";

import test from "node:test";
import { PNG } from "pngjs";

const run = promisify(execFile);

test("December cover is 1260x1260 and deterministic", async () => {
  const root = new URL("..", import.meta.url).pathname;
  const firstDir = await mkdtemp(`${tmpdir()}/monthly-cover-a-`);
  const secondDir = await mkdtemp(`${tmpdir()}/monthly-cover-b-`);
  const script = `${root}/scripts/generate_monthly_cover.py`;
  const content = `${root}/data/monthly/2026-12-content.json`;
  const python = process.env.PYTHON || "python3";
  await run(python, [script, "--content", content, "--output-dir", firstDir], { cwd: root });
  await run(python, [script, "--content", content, "--output-dir", secondDir], { cwd: root });
  const first = JSON.parse(await readFile(`${firstDir}/monthly-cover-report.json`, "utf8"));
  const second = JSON.parse(await readFile(`${secondDir}/monthly-cover-report.json`, "utf8"));
  assert.deepEqual({ ...first, output: "" }, { ...second, output: "" });
  assert.deepEqual(first.dimensions, { width: 1260, height: 1260 });
  assert.deepEqual(first.copy, ["DECEMBER", "MORNING WORK MATH", "31 DAILY WORD PROBLEMS", "3 LEVELS"]);
  const png = PNG.sync.read(await readFile(`${firstDir}/2026-12-cover.png`));
  assert.equal(png.width, 1260);
  assert.equal(png.height, 1260);
});
