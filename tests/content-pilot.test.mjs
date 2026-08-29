import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pilotPath = new URL('../examples/october-16-content-pilot.json', import.meta.url);

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

test('October 16 pilot contains a complete, differentiated daily record', async () => {
  const pilot = JSON.parse(await readFile(pilotPath, 'utf8'));
  const [day] = pilot.days;

  assert.equal(pilot.month, '1923-10');
  assert.equal(pilot.days.length, 1);
  assert.equal(day.date, '1923-10-16');
  assert.equal(day.theme, 'inventions_daily_life');
  assert.equal([...day.emoji].length, 1);
  assert.ok(wordCount(day.readingPassage) >= 150);
  assert.ok(wordCount(day.readingPassage) <= 250);
  assert.match(day.readingPassage, /^Have you ever/);
  assert.match(day.readingPassage, /Disney Brothers Cartoon Studio/);
  assert.match(day.readingPassage, /1923/);
  assert.match(day.readingPassage, /56 short films/);
  assert.match(day.readingPassage, /26 Oswald cartoons/);
  assert.match(day.mathLevels.level1.skill, /subtraction/);
  assert.match(day.mathLevels.level2.skill, /multiplication/);
  assert.match(day.mathLevels.level3.skill, /unit_conversion/);
  assert.equal(day.answers.level1.equation, '26 - 6 = 20');
  assert.equal(day.answers.level2.equation, '2 x 4 = 8');
  assert.equal(day.answers.level3.equation, '4 x 12 = 48');
  assert.deepEqual(day.sourceIds, ['d23-official-start-disney']);
});
