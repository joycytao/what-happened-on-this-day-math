import assert from "node:assert/strict";
import test from "node:test";

import { loadAnswerKeyTemplate, renderAnswerKeyPages } from "../src/answer-key-renderer.mjs";

const day = {
  date: "1969-07-20", emoji: "🚀", theme: "incredible_challenges", title: "The Landing With Seconds to Spare",
  hook: "Have you ever tried to land a toy airplane exactly on a tiny spot without bumping anything?",
  readingPassage: "Have you ever tried to land a toy airplane exactly on a tiny spot without bumping anything? On **July 20, 1969**, **Neil Armstrong** had to do something much harder: land the Apollo 11 lunar module, called **Eagle**, on the Moon. The crew had launched on **July 16** with three astronauts: Armstrong, **Buzz Aldrin**, and **Michael Collins**. While Collins stayed in orbit, Armstrong and Aldrin rode Eagle toward the gray surface. Then the computer flashed alarms, and Armstrong saw that the planned landing area was too rocky. He steered past the boulders like a careful driver looking for the last open parking space. When Eagle finally touched down, NASA says only about **30 seconds** of fuel remained. Later that night, Armstrong climbed down the ladder and became the first person to step on the Moon. Around **650 million** people watched on television as a risky space trip turned into one of history's biggest exploration moments.",
  trivia: ["Apollo 11 carried three astronauts."],
  mathLevels: {
    level1: { pageType: "level1", skill: "subtraction_within_50", prompt: "Eagle had about 30 seconds of fuel left. If it had used 8 more seconds before landing, how many seconds would be left?", numbersUsed: [{ value: 30, unit: "seconds", source: "story" }, { value: 8, unit: "seconds", source: "Problem scenario." }] },
    level2: { pageType: "level2", skill: "multiplication", prompt: "Three astronauts flew on Apollo 11. If each packed 4 snacks, how many snacks?", numbersUsed: [{ value: 3, unit: "astronauts", source: "story" }, { value: 4, unit: "snacks", source: "Problem scenario." }] },
    level3: { pageType: "level3", skill: "elapsed_time_days", prompt: "How many days passed from July 16 to July 20?", numbersUsed: [{ value: 16, unit: "day", source: "story" }, { value: 20, unit: "day", source: "story" }] },
  },
  answers: {
    level1: { equation: "30 - 8 = 22", work: "Start with 30 seconds and subtract the 8 extra seconds.", finalAnswer: "22 seconds of fuel would be left." },
    level2: { equation: "3 x 4 = 12", work: "There are 3 astronauts, and each has 4 snacks.", finalAnswer: "They would have 12 snacks altogether." },
    level3: { equation: "20 - 16 = 4", work: "Count the calendar-day difference from July 16 to July 20.", finalAnswer: "4 days passed between launch day and Moon landing day." },
  },
  answerKeyEntries: ["1969-07-20:level1", "1969-07-20:level2", "1969-07-20:level3"], sourceIds: ["nasa"],
};

const content = {
  schemaVersion: "1.0.0", month: "1969-07", days: [day],
  answerKey: Object.fromEntries(["level1", "level2", "level3"].map((level) => [level, [{ entryId: `${day.date}:${level}`, date: day.date, level, ...day.answers[level] }]])),
  sources: [{ id: "nasa", title: "NASA", publisher: "NASA", url: "https://www.nasa.gov/", accessedDate: "2026-08-28" }],
};

test("renderAnswerKeyPages emits six level-ordered template pages", () => {
  const pages = renderAnswerKeyPages(content);
  assert.equal(pages.length, 6);
  assert.match(pages[0], /data-level="level1" data-page="1"/);
  assert.match(pages[1], /data-level="level1" data-page="2"/);
  assert.match(pages[2], /data-level="level2" data-page="1"/);
  assert.match(pages[4], /data-level="level3" data-page="1"/);
  assert.match(pages[0], /Answer Keys \(Level 1\)/);
  assert.match(pages[0], /Q1: 22 seconds of fuel would be left\./);
  assert.doesNotMatch(pages[0], /Equation:|Work:|Answer:/);
  assert.match(pages[0], /font-size="30"/);
  assert.equal((pages[0].match(/<rect x=/g) || []).length, 16);
  assert.match(pages[0], /width="1545" height="1999"/);
});

test("loadAnswerKeyTemplate returns the canonical manifest variant", async () => {
  const template = await loadAnswerKeyTemplate();
  assert.equal(template.filename, "template-05.png");
  assert.equal(template.version, "1.0.0");
});

test("renderAnswerKeyPages rejects answer text that cannot fit a grid cell", () => {
  const oversized = structuredClone(content);
  oversized.days[0].answers.level1.finalAnswer = "22 seconds of fuel would be left. " + "word ".repeat(80);
  oversized.answerKey.level1[0].finalAnswer = oversized.days[0].answers.level1.finalAnswer;
  assert.throws(() => renderAnswerKeyPages(oversized), /answer exceeds the template box capacity/);
});
