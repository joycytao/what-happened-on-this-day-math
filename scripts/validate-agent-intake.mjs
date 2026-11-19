import { readFile } from "node:fs/promises";

import { agentIntakeFingerprint, buildAgentIntakeComment } from "../src/agent-intake-comment.mjs";

const workflow = await readFile(new URL("../.github/workflows/agent-pickup-queue.yml", import.meta.url), "utf8");
const errors = [];
if (!workflow.includes("concurrency:")) errors.push("agent pickup workflow must serialize runs");
if (!workflow.includes("github.event.issue.number")) errors.push("concurrency must be scoped to the Issue number");
if (!workflow.includes("intakeCommentPlan")) errors.push("workflow must use the intake idempotency planner");
if (!workflow.includes("issues.updateComment")) errors.push("workflow must update an existing intake comment");
if (!workflow.includes("issues.createComment")) errors.push("workflow must create only when no fingerprint exists");
if (!agentIntakeFingerprint(42).includes("codex-agent-intake:v1:issue-42")) errors.push("fingerprint format is not versioned");
if (!buildAgentIntakeComment(42, "CODEX_AGENT_INTAKE").startsWith("<!-- codex-agent-intake:v1:issue-42 -->")) errors.push("comment body must begin with the fingerprint");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Agent intake idempotency contract passed");
