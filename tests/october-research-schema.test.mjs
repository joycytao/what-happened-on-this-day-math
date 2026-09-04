import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const schema = JSON.parse(await readFile(new URL('../schemas/october-research.schema.json', import.meta.url), 'utf8'));
const example = JSON.parse(await readFile(new URL('../examples/october-research.example.json', import.meta.url), 'utf8'));
const docs = await readFile(new URL('../docs/october-research-schema.md', import.meta.url), 'utf8');

test('October research contract defines month/day separately from eventYear', () => {
  assert.equal(schema.properties.month.const, 10);
  assert.deepEqual(schema.$defs.record.required, [
    'month', 'day', 'dateQualifier', 'eventYear', 'title', 'claim', 'theme', 'sourceIds',
  ]);
  assert.deepEqual(example, {
    month: 10,
    records: [{
      month: 10, day: 16, dateQualifier: 'exact', eventYear: 1923,
      title: 'Disney Brothers Cartoon Studio begins',
      claim: 'Walt and Roy Disney signed a contract on October 16, 1923.',
      theme: 'inventions_daily_life', sourceIds: ['example-source'],
    }],
    sources: [{
      id: 'example-source', title: 'Example source', publisher: 'Example publisher',
      url: 'https://example.com/source', accessedDate: '2026-09-04',
    }],
  });
  for (const phrase of ['research/october-events.json', 'month/day', 'eventYear', 'year-independent', 'disputed', 'Source_ID']) {
    assert.match(docs, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
