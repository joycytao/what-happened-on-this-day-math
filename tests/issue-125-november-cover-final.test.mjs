import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';

const run = promisify(execFile);
const root = new URL('..', import.meta.url).pathname;

test('November cover passes canonical fixed-region visual parity and is approved for assembly', async () => {
  const outputDir = await mkdtemp('/private/tmp/issue-125-cover-');
  await run(process.execPath, [
    'scripts/worksheet-cover-pipeline.mjs',
    '--config', 'examples/november-worksheet-cover.json',
    '--output-dir', outputDir,
  ], { cwd: root });
  await run('npm', [
    'run', 'cover:visual:validate', '--',
    '--reference', 'references /worksheet-assets/worksheet-cover-reference.png',
    '--candidate', `${outputDir}/november-worksheet-cover.png`,
    '--output-dir', `${outputDir}/qa`,
  ], { cwd: root });

  const qa = JSON.parse(await readFile(`${outputDir}/qa/visual-qa.json`, 'utf8'));
  const config = JSON.parse(await readFile(`${root}/examples/november-worksheet-cover.json`, 'utf8'));
  assert.equal(qa.passed, true);
  assert.ok(qa.fixedRegionSimilarity >= 0.98);
  assert.ok(Object.values(qa.regions).every((region) => region.exactRatio >= 0.95));
  assert.equal(config.approval.status, 'approved');
  assert.equal(config.illustration.name, 'turkey');
  await rm(outputDir, { recursive: true, force: true });
});
