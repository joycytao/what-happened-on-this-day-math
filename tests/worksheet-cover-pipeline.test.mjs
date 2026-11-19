import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = new URL("..", import.meta.url).pathname;

test("worksheet cover pipeline emits reusable artifacts and a draft gate", async () => {
  const output = await mkdtemp(join(tmpdir(), "worksheet-cover-"));
  try {
    await run(process.execPath, [join(root, "scripts/worksheet-cover-pipeline.mjs"), "--output-dir", output], { cwd: root });
    const manifest = JSON.parse(await readFile(join(output, "cover-manifest.json"), "utf8"));
    assert.deepEqual(manifest.page, { width: 1158.75, height: 1500 });
    assert.deepEqual(manifest.raster, { width: 1545, height: 2000 });
    assert.equal(manifest.cover_pages, 1);
    assert.equal(manifest.checks.reviewGate, "draft");
    assert.match(await readFile(manifest.artifacts.svg, "utf8"), /MORNING WORK MATH/);
  } finally { await rm(output, { recursive: true, force: true }); }
});

test("worksheet cover merge cannot bypass explicit approval", async () => {
  const output = await mkdtemp(join(tmpdir(), "worksheet-cover-"));
  try {
    await assert.rejects(() => run(process.execPath, [join(root, "scripts/worksheet-cover-pipeline.mjs"), "--output-dir", output, "--source-pdf", "output/pdf/october-worksheet-packet.pdf"], { cwd: root }), /approval.status=approved/);
  } finally { await rm(output, { recursive: true, force: true }); }
});
