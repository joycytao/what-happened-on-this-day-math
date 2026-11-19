import { DEFAULT_STALE_CLAIM_MS, auditQueueHealth } from "../src/queue-health-recovery.mjs";

const checks = [
  ["default stale claim threshold", DEFAULT_STALE_CLAIM_MS > 0],
  ["stale claim fixture", auditQueueHealth({ state: "open", labels: ["agent: developer", "status: ready to pickup", "state: claimed"], claim: { role: "developer", claimedAt: "2026-11-18T00:00:00Z" } }, { now: "2026-11-19T00:00:00Z", staleAfterMs: 60 * 60 * 1000 }).category === "stale-role-claim"],
  ["closed terminal fixture", auditQueueHealth({ state: "closed", labels: ["agent: developer"] }).repair.add.includes("status: done")],
  ["merged PR terminal fixture", auditQueueHealth({ state: "open", labels: ["agent: quality-engineer"], pullRequests: [{ state: "merged", number: 1 }] }).category === "merged-pr-terminal-drift"],
  ["failed workflow recovery fixture", auditQueueHealth({ state: "open", labels: ["agent: developer", "state: implementation"], workflowRun: { id: 1, conclusion: "failure", role: "developer" } }).nextRole === "developer"],
  ["ambiguous failure fails closed", auditQueueHealth({ state: "open", labels: ["agent: developer"], workflowRun: { id: 2, conclusion: "failure" } }).category === "workflow-failure-owner-unknown"],
];

const failures = checks.filter(([, valid]) => !valid).map(([name]) => name);
if (failures.length) {
  console.error(`Queue health recovery contract failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("Queue health recovery contract passed");
