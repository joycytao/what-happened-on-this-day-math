import fs from "node:fs";

import { expectedDaysInMonth, parseMonthlyContextComment } from "../src/monthly-context-input.mjs";

const CONTEXT_ISSUE_MARKER = /<!--\s*(?:monthly-context|monthly-production):\s*(\d{4}-\d{2})(?::context-source)?\s*-->/i;
const EVENT_YEAR_PATTERN = /\((\d{3,4})\)/;

function option(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function extractEventYear(day) {
  const match = `${day.title} ${day.context}`.match(EVENT_YEAR_PATTERN);
  return match ? Number(match[1]) : null;
}

export function validateMonthlyContextSource({ issue, comments }) {
  const marker = String(issue?.body || "").match(CONTEXT_ISSUE_MARKER);
  const errors = [];
  if (!marker) errors.push("issue body must contain a monthly-context or context-source marker");

  const parsed = parseMonthlyContextComment(comments);
  if (!parsed.valid) errors.push(...parsed.errors);
  if (marker && parsed.input && parsed.input.month !== marker[1]) {
    errors.push(`input month must be ${marker[1]}`);
  }

  const input = parsed.input;
  const expectedDays = marker ? expectedDaysInMonth(Number(marker[1].slice(0, 4)), Number(marker[1].slice(5))) : null;
  const entries = input?.days?.map((day) => ({
    date: day.date,
    title: day.title,
    eventYear: extractEventYear(day),
    hasContext: Boolean(day.context?.trim()),
    levels: ["level1", "level2", "level3"].map((level) => ({
      level,
      hasPrompt: Boolean(day.questions?.[level]?.prompt?.trim()),
      hasAnswer: Boolean(day.questions?.[level]?.answer?.trim()),
    })),
  })) || [];

  return {
    valid: errors.length === 0,
    issueNumber: issue?.number ?? null,
    month: input?.month || marker?.[1] || null,
    inputCommentId: parsed.commentId,
    expectedDays,
    actualDays: input?.days?.length || 0,
    entries,
    sourceInput: {
      status: errors.length === 0 ? "complete" : "invalid",
      meaning: "The raw context JSON is the source artifact for the next workstream.",
      externalCitations: "not part of the monthly-context-input schema; historical research must be recorded by the downstream content-validation workstream.",
    },
    errors,
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const issue = JSON.parse(fs.readFileSync(option("--issue"), "utf8"));
  const commentsPayload = JSON.parse(fs.readFileSync(option("--comments"), "utf8"));
  const comments = Array.isArray(commentsPayload) ? commentsPayload : commentsPayload.comments;
  const report = validateMonthlyContextSource({ issue, comments });
  const output = option("--output");
  if (output) fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  else process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.valid) process.exitCode = 1;
}
