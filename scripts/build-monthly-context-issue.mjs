import fs from "node:fs";
import { expectedDaysInMonth, targetMonthFromSchedulerDate } from "../src/monthly-context-input.mjs";

const TIME_ZONE = "America/Chicago";

function centralParts(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("scheduler date must be valid");
  return Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

export function isThirdMondayAt0900Central(value) {
  const parts = centralParts(value);
  const localDate = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
  return parts.weekday === "Mon" && localDate.getUTCDay() === 1 && Number(parts.day) >= 15 && Number(parts.day) <= 21 && parts.hour === "09" && parts.minute === "00";
}

function targetMonthFromCentralDate(value) {
  const parts = centralParts(value);
  return targetMonthFromSchedulerDate(new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day))));
}

export function buildMonthlyContextIssue({ now, repository, runUrl }) {
  const target = targetMonthFromCentralDate(now);
  const marker = `<!-- monthly-context: ${target.isoMonth} -->`;
  const body = [
    marker,
    `# Monthly context input: ${target.isoMonth}`,
    "",
    `- Target month: \`${target.isoMonth}\``,
    `- Expected calendar days: ${expectedDaysInMonth(target.year, target.month)}`,
    `- Source repository: \`${repository}\``,
    `- Scheduler run: ${runUrl}`,
    "- Approval: apply `status: ready to pickup` only after the JSON input comment is complete.",
    "",
    "## Input comment protocol",
    "",
    "Post exactly one comment containing the marked JSON block below. Raw context, questions, and answers may be written in Chinese; production converts student-facing content to English.",
    "",
    "<!-- monthly-content-input: YYYY-MM -->",
    "```json",
    JSON.stringify({ month: target.isoMonth, days: [{ date: "M/D", title: "", context: "", questions: { level1: { prompt: "", answer: "" }, level2: { prompt: "", answer: "" }, level3: { prompt: "", answer: "" } } }] }, null, 2),
    "```",
    "",
    "The workflow validates day coverage, duplicate dates, required context, all three levels, and answers before creating production Issues.",
  ].join("\n");
  return {
    marker,
    targetMonth: target.isoMonth,
    title: `[Monthly context] ${target.isoMonth}`,
    body,
    labels: ["type: feature", "content:monthly", "status: pending review"],
  };
}

function option(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const plan = buildMonthlyContextIssue({ now: option("--now", new Date().toISOString()), repository: option("--repository", process.env.GITHUB_REPOSITORY || ""), runUrl: option("--run-url", "") });
  const output = option("--output");
  if (output) fs.writeFileSync(output, `${JSON.stringify(plan, null, 2)}\n`);
  else process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
}
