import assert from "node:assert/strict";
import test from "node:test";

import { auditIssue } from "../src/pm-triage-audit.mjs";
import { listEligibleWork } from "../src/agent-pickup.mjs";
import { routeHandoff } from "../src/agent-handoff-routing.mjs";
import { renderCompactHandoff, validateHandoff } from "../src/agent-handoff.mjs";
import { planIssueStateTransition } from "../src/issue-state-writer.mjs";
import { auditQueueHealth } from "../src/queue-health-recovery.mjs";
import { validateDerivedLabelInvariant } from "../src/derived-label-reconciliation.mjs";

const outputKinds = {
  "pm-triage": "triage-decision",
  developer: "implementation",
  "quality-engineer": "qa-result",
};

const fixture = () => ({
  number: 9001,
  state: "open",
  body: [
    "# Deterministic lifecycle fixture",
    "CODEX_WORK_ITEM_KIND: implementation",
    "CODEX_INPUTS_VALIDATED: true",
    "CODEX_RECONCILE_TO: developer",
    "Review gate: final-merge",
    "## Acceptance Criteria",
    "- exercise every state transition",
  ].join("\n"),
  labels: ["type: bug", "agent: pm-triage", "status: pending review"],
  comments: [],
  pullRequests: [],
  snapshots: [],
});

function handoff(overrides = {}) {
  const from = overrides.from || "developer";
  const to = overrides.to || (from === "pm-triage" ? "developer" : from === "developer" ? "quality-engineer" : "ready-for-human");
  const status = overrides.status || "completed";
  const rejected = status === "rejected" || status === "blocked";
  return {
    handoffId: `fixture:9001:${from}:${to}:${overrides.id || "1"}`,
    from,
    to,
    workItem: "joycytao/what-happened-on-this-day-math#9001",
    status,
    completed: rejected ? [] : [overrides.completed || `${from} output recorded`],
    requiredNextAction: [overrides.next || `continue ${to}`],
    evidence: [overrides.evidence || "deterministic fixture evidence"],
    constraints: ["preserve canonical state"],
    blockers: [rejected ? (overrides.blocker || "fixture QA failure") : "none"],
    expectedOutput: [outputKinds[from] || "qa-result"],
    outputKind: outputKinds[from] || "qa-result",
    returnPath: overrides.returnPath || (from === "quality-engineer" && to === "ready-for-human" ? "developer" : "pm-triage"),
    prerequisitesSatisfied: ["fixture inputs are present"],
    prerequisitesMissing: [],
  };
}

function snapshot(issue, phase, expectedLabels) {
  assert.deepEqual(issue.labels, expectedLabels, `${phase}: labels`);
  const invariant = validateDerivedLabelInvariant(issue.labels);
  assert.equal(invariant.valid, true, `${phase}: ${invariant.errors.join("; ")}`);
  const owners = issue.labels.filter((label) => label.startsWith("agent: "));
  const terminal = issue.labels.includes("status: done");
  assert.ok(terminal ? owners.length === 0 : owners.length <= 1, `${phase}: owner cardinality`);
  issue.snapshots.push({ phase, labels: [...issue.labels], comments: issue.comments.map((comment) => comment.body) });
}

function applyLabels(issue, phase, nextLabels) {
  const plan = planIssueStateTransition({
    currentLabels: issue.labels,
    expectedLabels: issue.labels,
    nextLabels,
    body: issue.body,
    comments: issue.comments,
  });
  assert.equal(plan.valid, true, `${phase}: ${plan.errors.join("; ")}`);
  issue.labels = plan.labels;
  snapshot(issue, phase, nextLabels);
}

function applyHandoff(issue, phase, eventHandoff, context) {
  assert.equal(validateHandoff(eventHandoff).valid, true);
  const routed = routeHandoff(eventHandoff, { labels: issue.labels, ...context });
  assert.equal(routed.valid, true, `${phase}: ${routed.errors.join("; ")}`);
  const next = issue.labels.filter((label) => !routed.removeLabels.includes(label)).concat(routed.addLabels);
  issue.comments.push({ body: renderCompactHandoff(eventHandoff) });
  applyLabels(issue, phase, [...new Set(next)]);
  return routed;
}

test("runs the complete deterministic Issue-to-terminal lifecycle", () => {
  const issue = fixture();
  const phaseMarkers = [];
  issue.comments.push({ body: "CODEX_AGENT_INTAKE:v1\nIssue creation fixture" });
  phaseMarkers.push("issue-created");
  snapshot(issue, "issue-created", ["type: bug", "agent: pm-triage", "status: pending review"]);

  const audit = auditIssue(issue, [issue], []);
  assert.equal(audit.category, "pm-triage-intake");
  assert.equal(audit.eligible, true);
  issue.comments.push({ body: "CODEX_TRIAGE_AUDIT:v1\nPM audit selected the oldest eligible Issue" });
  phaseMarkers.push("pm-audit");

  applyLabels(issue, "pm-routes-developer", ["type: bug", "agent: developer", "status: ready to pickup"]);
  const pickup = listEligibleWork([issue], { role: "developer", connectivityValid: true });
  assert.deepEqual(pickup.items.map((item) => item.number), [9001]);
  phaseMarkers.push("developer-pickup");

  applyHandoff(issue, "developer-implementation", handoff({ from: "pm-triage", to: "developer", id: "pm" }), { isPullRequest: false });
  assert.deepEqual(issue.labels, ["type: bug", "agent: developer", "state: implementation"]);

  issue.pullRequests.push({ number: 9901, state: "open", body: "Fixes #9001" });
  issue.comments.push({ body: "CODEX_PR_CREATED:v1\nPR #9901 created" });
  phaseMarkers.push("pr-created");
  snapshot(issue, "pr-created", ["type: bug", "agent: developer", "state: implementation"]);

  applyHandoff(issue, "qa-started", handoff({ from: "developer", to: "quality-engineer", id: "dev-qa" }), { isPullRequest: true });
  phaseMarkers.push("qa-started");

  const conflict = handoff({ from: "quality-engineer", to: "developer", status: "rejected", id: "conflict", blocker: "PR merge conflict", next: "resolve PR conflict" });
  applyHandoff(issue, "pr-conflict", conflict, { isPullRequest: true });
  issue.comments.push({ body: "CODEX_CONFLICT_ALERT:v1\nDeveloper must resolve PR conflict" });
  phaseMarkers.push("conflict");
  assert.deepEqual(issue.labels, ["type: bug", "agent: developer", "state: changes-requested"]);

  applyHandoff(issue, "developer-repair", handoff({ from: "developer", to: "quality-engineer", id: "repair" }), { isPullRequest: true });
  issue.comments.push({ body: "CODEX_CONFLICT_RESOLVED:v1\nConflict resolution summary recorded" });
  phaseMarkers.push("developer-repair");
  assert.deepEqual(issue.labels, ["type: bug", "agent: quality-engineer", "status: qa"]);

  applyHandoff(issue, "qa-pass-human-gate", handoff({ from: "quality-engineer", to: "ready-for-human", id: "qa-pass" }), { isPullRequest: true, reviewGate: "final-merge" });
  phaseMarkers.push("qa-pass");
  assert.deepEqual(issue.labels, ["type: bug", "ready-for-human"]);

  issue.state = "closed";
  issue.pullRequests[0] = { ...issue.pullRequests[0], state: "merged", mergedAt: "2026-01-01T00:00:00Z" };
  const health = auditQueueHealth(issue);
  assert.equal(health.category, "closed-active-owner");
  const terminal = planIssueStateTransition({ currentLabels: issue.labels, expectedLabels: issue.labels, nextLabels: ["type: bug", "status: done"], body: issue.body, comments: issue.comments });
  assert.equal(terminal.valid, true, terminal.errors.join("; "));
  issue.labels = terminal.labels;
  issue.comments.push({ body: "CODEX_POST_MERGE_RECONCILIATION:v1\nIssue closed and terminal state verified" });
  phaseMarkers.push("post-merge");
  snapshot(issue, "post-merge", ["type: bug", "status: done"]);

  assert.deepEqual(phaseMarkers, ["issue-created", "pm-audit", "developer-pickup", "pr-created", "qa-started", "conflict", "developer-repair", "qa-pass", "post-merge"]);
  assert.equal(issue.state, "closed");
  assert.equal(issue.labels.includes("ready-for-human"), false);
  assert.equal(issue.labels.filter((label) => label.startsWith("agent: ")).length, 0);
  assert.equal(issue.comments.filter((comment) => comment.body.includes("CODEX_HANDOFF:v1")).length, 5);
  assert.equal(new Set(issue.comments.filter((comment) => comment.body.includes("Handoff ID:")).map((comment) => comment.body.match(/Handoff ID: `([^`]+)`/)?.[1])).size, 5);
  assert.ok(issue.comments.some((comment) => comment.body.includes("CODEX_CONFLICT_ALERT:v1")));
  assert.ok(issue.comments.some((comment) => comment.body.includes("CODEX_POST_MERGE_RECONCILIATION:v1")));
  assert.equal(issue.snapshots.length, phaseMarkers.length);
});
