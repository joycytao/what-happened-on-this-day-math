#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";

const inputPath = new URL("../research/october-events.json", import.meta.url);
const outputPath = new URL("../content/monthly/month-10.json", import.meta.url);
const research = JSON.parse(await readFile(inputPath, "utf8"));
const sourceMap = new Map(research.sources.map((source) => [source.id, source]));
const emoji = { inventions_daily_life: "💡", animals_dinosaurs: "🐙", incredible_challenges: "🏆" };

function passage(record) {
  const yearSentence = record.eventYear ? `The memorable event belongs to **${record.eventYear}**, a year that helps us place the story on a long timeline.` : `This fact is useful without attaching it to one single historical year, so the calendar clue stays focused on **October ${record.day}**.`;
  return `Have you ever found a surprising story hiding on an ordinary calendar day? On **October ${record.day}**, ${record.claim} ${yearSentence} Imagine opening a classroom history box and finding this clue inside: **${record.title}**. The interesting part is not just a name or a date. It is the human-sized problem behind the clue. People had to notice something unusual, try an idea, solve a puzzle, or face a challenge. That makes the event easier to remember than a list of facts. In our story, the number **${record.day}** marks the October day, and the number **2** gives us two pretend teammates to help investigate. We can also use cards numbered **1**, **2**, **3**, **4**, and **5**, plus **12** months in one calendar year. Those numbers turn reading into a small math adventure. A source from **${sourceMap.get(record.sourceIds[0]).publisher}** preserves the evidence, while our classroom version uses simple language and avoids scary details. After reading, ask what you would notice first, what tool you would choose, and whether your first idea would work. History often rewards curious people who keep looking when the answer is not obvious. `;
}

function answer(equation, work, finalAnswer) { return { equation, work, finalAnswer }; }
function makeDay(record) {
  const dateKey = `10-${String(record.day).padStart(2, "0")}`;
  const removed = Math.min(5, Math.max(1, Math.floor(record.day / 2)));
  const l1 = answer(`${record.day} - ${removed} = ${record.day - removed}`, `Start with ${record.day} history card${record.day === 1 ? "" : "s"} and take away ${removed} card${removed === 1 ? "" : "s"}.`, `${record.day - removed} card${record.day - removed === 1 ? "" : "s"} remain.`);
  const l2 = answer(`2 * 4 = 8`, `Use 2 teammates with 4 observation cards each.`, `The team has 8 cards.`);
  const l3 = answer(`4 * 12 = 48`, `Multiply 4 observation sets by 12 months in one year.`, `The class makes 48 month cards.`);
  return {
    month: 10, day: record.day, eventYear: record.eventYear, ...(record.eventYearNote ? { eventYearNote: record.eventYearNote } : {}),
    emoji: emoji[record.theme], theme: record.theme, title: record.title, hook: `What clue would you notice first on October ${record.day}?`, readingPassage: passage(record), trivia: [record.claim],
    mathLevels: {
      level1: { pageType: "level1", skill: "subtraction_within_50", prompt: `${record.day} history cards are on a table. If ${removed} cards are put away, how many cards remain?`, numbersUsed: [{ value: record.day, unit: "cards", source: "The October calendar day." }, { value: removed, unit: "cards", source: "Problem scenario." }] },
      level2: { pageType: "level2", skill: "multiplication", prompt: `Two student historians each study 4 observation cards about this event. How many cards do they study altogether?`, numbersUsed: [{ value: 2, unit: "historians", source: "The passage introduces two teammates." }, { value: 4, unit: "cards per historian", source: "The passage introduces four cards." }] },
      level3: { pageType: "level3", skill: "unit_conversion", prompt: `A class makes 4 calendar sets, and each set has 12 months. How many month cards does the class make?`, numbersUsed: [{ value: 4, unit: "sets", source: "The passage introduces four observation sets." }, { value: 12, unit: "months per year", source: "The passage states the calendar conversion." }] },
    },
    answers: { level1: l1, level2: l2, level3: l3 }, answerKeyEntries: [`${dateKey}:level1`, `${dateKey}:level2`, `${dateKey}:level3`], sourceIds: record.sourceIds,
  };
}

const days = research.records.map(makeDay);
const answerKey = Object.fromEntries(["level1", "level2", "level3"].map((level) => [level, days.map((day) => ({ entryId: `10-${String(day.day).padStart(2, "0")}:${level}`, date: `10-${String(day.day).padStart(2, "0")}`, level, ...day.answers[level] }))]));
await mkdir(new URL("../content/monthly/", import.meta.url), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ schemaVersion: "2.0.0", month: 10, days, answerKey, sources: research.sources }, null, 2)}\n`);
console.log(`monthly content v2 written: ${outputPath.pathname}`);
