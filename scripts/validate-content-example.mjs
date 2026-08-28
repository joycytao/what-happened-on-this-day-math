#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const schemaPath = new URL('../schemas/monthly-content.schema.json', import.meta.url);
const examplePath = new URL('../examples/monthly-content.example.json', import.meta.url);
const docsPath = new URL('../docs/content-schema.md', import.meta.url);

const requiredTopLevel = [
  'schemaVersion',
  'month',
  'days',
  'answerKey',
  'sources',
];

const requiredDailyFields = [
  'date',
  'emoji',
  'theme',
  'title',
  'hook',
  'readingPassage',
  'trivia',
  'mathLevels',
  'answers',
  'answerKeyEntries',
  'sourceIds',
];

const requiredMathLevels = ['level1', 'level2', 'level3'];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readJson(url) {
  return JSON.parse(await readFile(url, 'utf8'));
}

function assertRequiredFields(record, fields, label) {
  for (const field of fields) {
    assert(Object.hasOwn(record, field), `${label} is missing required field: ${field}`);
  }
}

function assertIsoDate(value, label) {
  assert(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), `${label} must use YYYY-MM-DD`);
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function validateSourceIds(sourceIds, sources, label) {
  assert(Array.isArray(sourceIds) && sourceIds.length > 0, `${label} must cite at least one source`);
  for (const source of sources) {
    assert(typeof source.id === 'string' && source.id.length > 0, 'source needs id');
    assert(typeof source.title === 'string' && source.title.length > 0, `${source.id} needs title`);
    assert(typeof source.publisher === 'string' && source.publisher.length > 0, `${source.id} needs publisher`);
    assert(typeof source.url === 'string' && source.url.startsWith('https://'), `${source.id} needs https url`);
    assert(typeof source.accessedDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(source.accessedDate), `${source.id} needs accessedDate`);
  }
  const validIds = new Set(sources.map((source) => source.id));
  for (const sourceId of sourceIds) {
    assert(validIds.has(sourceId), `${label} cites unknown source: ${sourceId}`);
  }
}

function validateMathLevel(level, levelName, date) {
  assert(typeof level.prompt === 'string' && level.prompt.length > 0, `${date} ${levelName} needs a prompt`);
  assert(typeof level.skill === 'string' && level.skill.length > 0, `${date} ${levelName} needs a skill`);
  assert(Array.isArray(level.numbersUsed) && level.numbersUsed.length > 0, `${date} ${levelName} needs numbersUsed`);
  assert(typeof level.pageType === 'string' && level.pageType === levelName, `${date} ${levelName} needs matching pageType`);
}

function validateAnswer(answer, levelName, date) {
  assert(typeof answer.equation === 'string' && answer.equation.length > 0, `${date} ${levelName} answer needs equation`);
  assert(typeof answer.work === 'string' && answer.work.length > 0, `${date} ${levelName} answer needs work`);
  assert(typeof answer.finalAnswer === 'string' && answer.finalAnswer.length > 0, `${date} ${levelName} answer needs finalAnswer`);
}

function validateExample(example, schema) {
  assert(schema.$schema === 'https://json-schema.org/draft/2020-12/schema', 'schema must declare draft 2020-12');
  assert(schema.title === 'What Happened on This Day Monthly Worksheet Content', 'schema title changed unexpectedly');
  assertRequiredFields(example, requiredTopLevel, 'monthly content');

  assert(example.schemaVersion === '1.0.0', 'example schemaVersion must be 1.0.0');
  assert(/^\d{4}-\d{2}$/.test(example.month), 'month must use YYYY-MM');
  assert(Array.isArray(example.days) && example.days.length === 1, 'example must include exactly one daily record');
  assert(Array.isArray(example.sources) && example.sources.length > 0, 'example must include sources');

  const [dailyRecord] = example.days;
  assertRequiredFields(dailyRecord, requiredDailyFields, 'daily record');
  assertIsoDate(dailyRecord.date, 'daily record date');
  assert(dailyRecord.date.startsWith(example.month), 'daily record date must be inside the month');
  assert(typeof dailyRecord.emoji === 'string' && [...dailyRecord.emoji].length === 1, 'daily record needs exactly one emoji');
  assert(['inventions_daily_life', 'animals_dinosaurs', 'incredible_challenges'].includes(dailyRecord.theme), 'theme must be approved');
  assert(Array.isArray(dailyRecord.trivia) && dailyRecord.trivia.length >= 1 && dailyRecord.trivia.length <= 2, 'trivia must contain one or two items');

  const passageWords = wordCount(dailyRecord.readingPassage);
  assert(passageWords >= 150 && passageWords <= 250, `reading passage must be 150-250 words; saw ${passageWords}`);

  for (const levelName of requiredMathLevels) {
    validateMathLevel(dailyRecord.mathLevels[levelName], levelName, dailyRecord.date);
    validateAnswer(dailyRecord.answers[levelName], levelName, dailyRecord.date);
    assert(
      dailyRecord.answerKeyEntries.includes(`${dailyRecord.date}:${levelName}`),
      `${dailyRecord.date} answerKeyEntries must include ${levelName}`,
    );
  }

  validateSourceIds(dailyRecord.sourceIds, example.sources, dailyRecord.date);
  assert(Array.isArray(example.answerKey.level1) && example.answerKey.level1.length === 1, 'answerKey.level1 needs the daily answer');
  assert(Array.isArray(example.answerKey.level2) && example.answerKey.level2.length === 1, 'answerKey.level2 needs the daily answer');
  assert(Array.isArray(example.answerKey.level3) && example.answerKey.level3.length === 1, 'answerKey.level3 needs the daily answer');
  assert(example.answerKey.level1[0].entryId === `${dailyRecord.date}:level1`, 'level1 answer key entry id mismatch');
  assert(example.answerKey.level2[0].entryId === `${dailyRecord.date}:level2`, 'level2 answer key entry id mismatch');
  assert(example.answerKey.level3[0].entryId === `${dailyRecord.date}:level3`, 'level3 answer key entry id mismatch');
}

function validateDocs(docs) {
  for (const phrase of [
    'Required Fields',
    'Invalid Fields',
    'Daily Page Model',
    'Answer Key Model',
    'Validation Rules',
  ]) {
    assert(docs.includes(phrase), `documentation must include ${phrase}`);
  }
}

function validateSchemaShape(schema) {
  assert(schema.type === 'object', 'schema root must be an object');
  assert(Array.isArray(schema.required), 'schema root must define required fields');
  for (const field of requiredTopLevel) {
    assert(schema.required.includes(field), `schema required fields must include ${field}`);
  }
  assert(schema.additionalProperties === false, 'schema must reject invalid top-level fields');
  assert(schema.properties.days.items.$ref === '#/$defs/dailyRecord', 'days must reference dailyRecord definition');
  assert(schema.$defs.dailyRecord.additionalProperties === false, 'dailyRecord must reject invalid fields');
  assert(schema.$defs.mathLevel.additionalProperties === false, 'mathLevel must reject invalid fields');
  assert(schema.$defs.answer.additionalProperties === false, 'answer must reject invalid fields');
}

const [schema, example, docs] = await Promise.all([
  readJson(schemaPath),
  readJson(examplePath),
  readFile(docsPath, 'utf8'),
]);

validateExample(example, schema);
validateSchemaShape(schema);
validateDocs(docs);

console.log('content schema example is valid');
