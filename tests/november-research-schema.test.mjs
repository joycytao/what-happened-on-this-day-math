import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const schema = JSON.parse(await readFile(new URL('../schemas/november-research.schema.json', import.meta.url), 'utf8'));
const example = JSON.parse(await readFile(new URL('../examples/november-research.example.json', import.meta.url), 'utf8'));
const docs = await readFile(new URL('../docs/november-research-schema.md', import.meta.url), 'utf8');

test('November research contract separates worksheet month/day from eventYear', () => {
  assert.equal(schema.properties.month.const, 11);
  assert.equal(schema.$defs.record.properties.month.const, 11);
  assert.deepEqual(example, {
    month: 11,
    records: [{
      month: 11, day: 1, dateQualifier: 'exact', eventYear: 1952,
      title: 'Example November event',
      claim: 'An example event happened on November 1, 1952.',
      theme: 'inventions_daily_life', sourceIds: ['example-source'],
    }],
    sources: [{
      id: 'example-source', title: 'Example source', publisher: 'Example publisher',
      url: 'https://example.com/source', accessedDate: '2026-09-16',
    }],
  });
  for (const phrase of [
    'research/november-events.json', 'month/day', 'eventYear',
    'year-independent', 'disputed', 'Source_ID', 'Issues #54 and #55',
  ]) {
    assert.match(docs, new RegExp(phrase.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')));
  }
});

