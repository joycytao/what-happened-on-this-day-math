import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const artifactPath = new URL('../research/october-events.json', import.meta.url);

test('October research artifact covers every day with resolved source metadata', async () => {
  const artifact = JSON.parse(await readFile(artifactPath, 'utf8'));
  assert.equal(artifact.month, 10);
  assert.equal(artifact.records.length, 31);

  const sourceIds = new Set(artifact.sources.map((source) => source.id));
  const days = artifact.records.map((record) => record.day);
  assert.deepEqual(days, Array.from({ length: 31 }, (_, index) => index + 1));

  for (const record of artifact.records) {
    assert.equal(record.month, 10);
    assert.ok(record.title && record.claim && record.theme);
    assert.ok(record.sourceIds.length > 0);
    for (const sourceId of record.sourceIds) assert.ok(sourceIds.has(sourceId), `${record.day}: ${sourceId}`);
    if (record.dateQualifier === 'exact') assert.ok(Number.isInteger(record.eventYear) && record.eventYear > 0);
    if (record.dateQualifier === 'year-independent') assert.ok(record.eventYearNote);
  }

  for (const source of artifact.sources) {
    assert.match(source.url, /^https:\/\//);
    assert.match(source.accessedDate, /^\d{4}-\d{2}-\d{2}$/);
  }
});
