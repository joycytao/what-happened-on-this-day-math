#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";

const inputPath = new URL("../research/october-events.json", import.meta.url);
const outputPath = new URL("../content/monthly/month-10.json", import.meta.url);
const research = JSON.parse(await readFile(inputPath, "utf8"));
const sourceMap = new Map(research.sources.map((source) => [source.id, source]));
const emoji = { inventions_daily_life: "💡", animals_dinosaurs: "🐙", incredible_challenges: "🏆" };

function lessonNumbers(record) {
  const removed = Math.min(record.day, (record.day % 4) + 1);
  const groups = (record.day % 3) + 2;
  const items = (record.day % 5) + 3;
  const startYear = record.eventYear ? record.eventYear - ((record.day % 7) + 8) : 2000 + record.day;
  const yearGap = record.eventYear ? record.eventYear - startYear : (record.day % 4) + 3;
  return { removed, groups, items, startYear, yearGap };
}

function passage(record, numbers) {
  const source = sourceMap.get(record.sourceIds[0]);
  const yearSentence = record.eventYear
    ? `The research record places this event in ${record.eventYear}, so the class can compare that year with a nearby starting year of ${numbers.startYear}.`
    : `This is a recurring observance or a year-independent fact, so the class keeps the calendar day ${record.day} as the main date clue and uses ${numbers.startYear} only for a pretend timeline.`;
  return `Have you ever wondered why a small calendar box can open a much bigger story? On October ${record.day}, ${record.claim} ${yearSentence} The title card says “${record.title},” and it invites readers to look for the problem, invention, creature, or challenge behind the headline. A history detective does not need to memorize every detail; the detective notices which clues can be checked and which numbers can be used carefully. In this classroom version, ${numbers.groups} teams each receive ${numbers.items} evidence cards, and the passage also names ${numbers.removed} cards that can be set aside after the first round. The timeline comparison uses ${numbers.startYear} and a gap of ${numbers.yearGap} years, while the October label ${record.day} helps us connect the math back to the story. The source is ${source.publisher}, so the event claim is not invented for the worksheet. We keep the explanation friendly and avoid frightening details. After reading, ask what you would check first, whether the evidence cards tell the same story, and how a number can describe a real event without becoming the whole event. History becomes easier to remember when a reader asks a question, checks a source, and then explains the clue in their own words. `;
}

function answer(equation, work, finalAnswer) { return { equation, work, finalAnswer }; }

function makeDay(record) {
  const dateKey = `10-${String(record.day).padStart(2, "0")}`;
  const numbers = lessonNumbers(record);
  const l1Result = record.day - numbers.removed;
  const l2Result = numbers.groups * numbers.items;
  const l3Result = numbers.yearGap + record.day;
  const l1 = answer(`${record.day} - ${numbers.removed} = ${l1Result}`, `Start with ${record.day} story cards and set aside ${numbers.removed}.`, `${l1Result} story cards remain.`);
  const l2 = answer(`${numbers.groups} * ${numbers.items} = ${l2Result}`, `Multiply ${numbers.groups} teams by ${numbers.items} evidence cards per team.`, `The teams study ${l2Result} evidence cards.`);
  const l3 = answer(`${numbers.yearGap} + ${record.day} = ${l3Result}`, `The timeline gap is ${numbers.yearGap} years; add the October label ${record.day}.`, `The two-step timeline total is ${l3Result}.`);
  return {
    month: 10, day: record.day, eventYear: record.eventYear, ...(record.eventYearNote ? { eventYearNote: record.eventYearNote } : {}),
    emoji: emoji[record.theme], theme: record.theme, title: record.title,
    hook: `What clue would you check first on October ${record.day}?`, readingPassage: passage(record, numbers), trivia: [record.claim],
    mathLevels: {
      level1: { pageType: "level1", skill: "subtraction_within_50", prompt: `The October ${record.day} history card set has ${record.day} cards. If ${numbers.removed} cards are set aside, how many remain?`, numbersUsed: [{ value: record.day, unit: "cards", source: "The October calendar day." }, { value: numbers.removed, unit: "cards", source: "The event-specific card task." }] },
      level2: { pageType: "level2", skill: "multiplication", prompt: `For “${record.title},” ${numbers.groups} student teams each study ${numbers.items} evidence cards. How many cards do they study altogether?`, numbersUsed: [{ value: numbers.groups, unit: "teams", source: "The event-specific team task in the passage." }, { value: numbers.items, unit: "cards per team", source: "The event-specific evidence-card task in the passage." }] },
      level3: { pageType: "level3", skill: "multi_step_timeline", prompt: `The timeline comparison uses a ${numbers.yearGap}-year gap, then adds the October ${record.day} label. What is the total?`, numbersUsed: [{ value: numbers.yearGap, unit: "years", source: "The event-specific timeline gap in the passage." }, { value: record.day, unit: "label", source: "The October calendar day." }] },
    },
    answers: { level1: l1, level2: l2, level3: l3 }, answerKeyEntries: [`${dateKey}:level1`, `${dateKey}:level2`, `${dateKey}:level3`], sourceIds: record.sourceIds,
  };
}

const days = research.records.map(makeDay);
const citedIds = new Set(days.flatMap((day) => day.sourceIds));
const sources = research.sources.filter((source) => citedIds.has(source.id));
const answerKey = Object.fromEntries(["level1", "level2", "level3"].map((level) => [level, days.map((day) => ({ entryId: `10-${String(day.day).padStart(2, "0")}:${level}`, date: `10-${String(day.day).padStart(2, "0")}`, level, ...day.answers[level] }))]));
await mkdir(new URL("../content/monthly/", import.meta.url), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ schemaVersion: "2.0.0", month: 10, days, answerKey, sources }, null, 2)}\n`);
console.log(`monthly content v2 written: ${outputPath.pathname}`);
