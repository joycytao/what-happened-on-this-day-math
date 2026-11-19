import fs from "node:fs";
import { buildMonthlyProductionPlan } from "../src/monthly-production-orchestration.mjs";
import { parseMonthlyContextComment } from "../src/monthly-context-input.mjs";

const CONTEXT_MARKER = /<!--\s*monthly-context:\s*(\d{4}-\d{2})\s*-->/i;

export function isMonthlyContextReadyIssue(issue, label = "status: ready to pickup") {
  return Boolean(issue && !issue.pull_request && issue.state === "open" &&
    Array.isArray(issue.labels) && issue.labels.some((item) => (typeof item === "string" ? item : item?.name) === label) &&
    CONTEXT_MARKER.test(issue.body || ""));
}

export function buildMonthlyProductionQueuePlan({ issue, comments, inputArtifact, runUrl, project }) {
  if (!isMonthlyContextReadyIssue(issue)) return { actionable: false, valid: false, errors: [], plan: null };
  const marker = (issue.body || "").match(CONTEXT_MARKER);
  const parsed = parseMonthlyContextComment(comments);
  if (!parsed.valid) return {
    actionable: true,
    valid: false,
    errors: parsed.errors,
    plan: null,
    commentId: parsed.commentId,
    month: marker?.[1] || null,
  };
  if (parsed.input.month !== marker[1]) return { actionable: true, valid: false, errors: [`input month must be ${marker[1]}`], plan: null, commentId: parsed.commentId, month: marker[1] };
  const plan = buildMonthlyProductionPlan({
    month: parsed.input.month,
    inputIssue: issue.number,
    inputArtifact: inputArtifact || `issue-comment:${issue.number}:${parsed.commentId}`,
    runUrl,
    project,
  });
  return { actionable: true, valid: plan.valid, errors: plan.errors, plan, commentId: parsed.commentId, month: parsed.input.month };
}

function option(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const issue = JSON.parse(fs.readFileSync(option("--issue"), "utf8"));
  const comments = JSON.parse(fs.readFileSync(option("--comments"), "utf8"));
  const result = buildMonthlyProductionQueuePlan({
    issue,
    comments,
    runUrl: option("--run-url"),
    project: option("--project-owner") && option("--project-number")
      ? { owner: option("--project-owner"), number: option("--project-number") }
      : undefined,
  });
  const output = option("--output");
  if (output) fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
  else process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
