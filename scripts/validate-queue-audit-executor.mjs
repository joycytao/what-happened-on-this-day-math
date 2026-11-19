import fs from "node:fs";

const audit = fs.readFileSync("src/pm-triage-audit.mjs", "utf8");
const executor = fs.readFileSync(".github/workflows/agent-pickup-queue.yml", "utf8");
const errors = [];
if (!audit.includes("executionPlan") || !audit.includes("buildQueueExecutionPlan")) errors.push("queue audit must emit the shared execution plan");
if (!audit.includes("diagnostics") || !audit.includes("fingerprint")) errors.push("execution plan must include diagnostics and a stable fingerprint");
if (!executor.includes("pm-triage-audit.mjs") || !executor.includes("audit.auditQueue")) errors.push("queue executor must consume pm-triage audit output");
if (!executor.includes("auditResult.executionPlan")) errors.push("queue executor must consume the audit executionPlan, not recompute eligibility");
if (executor.includes("selectVerifiedQueue")) errors.push("queue executor must not maintain a second eligibility implementation");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("Queue audit/executor contract passed");
