#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { calculateEquation } from "../src/content-validation.mjs";
import { validateMonthlyContentV2 } from "../src/monthly-content-v2-validation.mjs";
import { validateExampleDrivenContent } from "../src/reusable-monthly-content-validation.mjs";

const root = new URL("../", import.meta.url);
const content = JSON.parse(await readFile(new URL("content/monthly/month-11.json", root), "utf8"));
const research = JSON.parse(await readFile(new URL("research/november-events.json", root), "utf8"));
const outputDir = new URL("reports/", root);
await mkdir(outputDir, { recursive: true });
const levels = ["level1", "level2", "level3"];
const words = (text) => text.trim().split(/\s+/).filter(Boolean);
const sentences = (text) => text.match(/[^.!?]+[.!?]+/g) ?? [];
const mentionsCalculatedResult = (text, value) => {
  const candidates = [String(value), value.toFixed(3), String(Math.round(value))];
  const normalized = text.replaceAll(",", "");
  return candidates.some((candidate) => new RegExp(`(?<![0-9])${candidate.replace(".", "\\.")}(?![0-9])`).test(normalized));
};
const result = (gate, valid, checks, errors = []) => ({ gate, valid, generatedAt: "2026-09-17", checks, errors });
const writeReport = async (name, report) => writeFile(new URL(name, outputDir), `${JSON.stringify(report, null, 2)}\n`);

const structural = validateMonthlyContentV2(content, { month: 11, dayCount: 30 });
const promptGate = validateExampleDrivenContent(content);
const readingErrors = [];
for (const day of content.days) {
  const count = words(day.readingPassage).length;
  if (count < 150 || count > 250) readingErrors.push(`11/${day.day} passage has ${count} words`);
  if (!/^\s*(Have you|What|If|Who|How|Would|Why|Can)\b/i.test(day.readingPassage)) readingErrors.push(`11/${day.day} passage does not open with a child-facing question`);
  if (/[㐀-鿿]/.test(day.readingPassage)) readingErrors.push(`11/${day.day} passage is not English`);
  if (sentences(day.readingPassage).some((sentence) => words(sentence).length > 35)) readingErrors.push(`11/${day.day} contains a sentence over 35 words`);
}
const contentReport = result("content", structural.valid && readingErrors.length === 0, { records: content.days.length, expectedRecords: 30, uniqueDays: new Set(content.days.map((day) => day.day)).size, structuralErrors: structural.errors, passageWordRange: [Math.min(...content.days.map((day) => words(day.readingPassage).length)), Math.max(...content.days.map((day) => words(day.readingPassage).length))], readingErrors });
await writeReport("issue-56-november-content-validation.json", contentReport);

const researchByDay = new Map(research.records.map((record) => [record.day, record]));
const sourceErrors = [];
for (const day of content.days) {
  const sourceRecord = researchByDay.get(day.day);
  if (!sourceRecord || day.title !== sourceRecord.title || day.trivia[0] !== sourceRecord.claim) sourceErrors.push(`11/${day.day} does not match the research record`);
  for (const sourceId of day.sourceIds) {
    const source = content.sources.find((candidate) => candidate.id === sourceId);
    if (!source || !/^https:\/\//.test(source.url) || !/^\d{4}-\d{2}-\d{2}$/.test(source.accessedDate)) sourceErrors.push(`11/${day.day} has invalid source metadata: ${sourceId}`);
  }
}
if (new Set(content.sources.map((source) => source.id)).size !== content.sources.length) sourceErrors.push("duplicate source IDs");
const sourceReport = result("sources", sourceErrors.length === 0, { researchRecords: research.records.length, contentRecords: content.days.length, linkedSourceRecords: new Set(content.days.flatMap((day) => day.sourceIds)).size, sourceErrors });
await writeReport("issue-56-november-source-validation.json", sourceReport);

const mathErrors = [];
for (const day of content.days) for (const level of levels) {
  const task = day.mathLevels[level];
  const answer = day.answers[level];
  for (const equation of answer.equation.split(/\s*;\s*/).filter(Boolean)) {
    const calculation = calculateEquation(equation);
    if (!calculation.valid || Math.abs(calculation.left - calculation.right) > 1e-3) mathErrors.push(`11/${day.day} ${level}: invalid equation ${equation}`);
    if (calculation.valid && !mentionsCalculatedResult(answer.finalAnswer, calculation.left)) mathErrors.push(`11/${day.day} ${level}: final answer does not state the exact or rounded result for ${calculation.left}`);
  }
  if (!task.prompt.includes("?") || !task.numbersUsed.length) mathErrors.push(`11/${day.day} ${level}: prompt or numbersUsed incomplete`);
}
const mathReport = result("mathematics", mathErrors.length === 0 && promptGate.valid, { promptErrors: promptGate.errors, recomputedEquations: content.days.length * levels.length, mathErrors });
await writeReport("issue-56-november-mathematics-validation.json", mathReport);
if (![contentReport, sourceReport, mathReport].every((report) => report.valid)) process.exitCode = 1;
console.log(JSON.stringify({ content: contentReport.valid, sources: sourceReport.valid, mathematics: mathReport.valid }));
