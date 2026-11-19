import { GOVERNANCE_OWNERS, GOVERNANCE_STATUSES, parseIssueContract, dependencyReport } from "./issue-governance.mjs";
import { auditQueueHealth } from "./queue-health-recovery.mjs";

const STATUS_ALIASES = Object.freeze({
  "status:pending review": "status: pending review",
  "status:blocked": "status: blocked",
  "status:ready to pickup": "status: ready to pickup",
  "status:qa": "status: qa",
  "status:paused": "status: paused",
  "status:ready to dispatch": "status: ready to dispatch",
  "status:done": "status: done",
});

function labelsFor(issue) {
  return (issue?.labels ?? []).map((label) => typeof label === "string" ? label : label?.name).filter(Boolean);
}

function hasOpenPr(issue, openPullRequests) {
  const body = String(issue?.body ?? "");
  return (openPullRequests ?? []).some((pr) => {
    const number = String(pr.number);
    return body.includes(`#${number}`) || body.includes(String(pr.url ?? ""));
  });
}

function canonicalOwners(labels) {
  return labels.filter((label) => GOVERNANCE_OWNERS.has(label));
}

function canonicalStatuses(labels) {
  return labels.filter((label) => GOVERNANCE_STATUSES.has(label));
}

export function reconcileRoutineLabels(issue) {
  const labels = labelsFor(issue);
  const add = [];
  const remove = [];
  for (const label of labels) {
    const canonical = STATUS_ALIASES[label];
    if (canonical && !labels.includes(canonical)) {
      add.push(canonical);
      remove.push(label);
    }
  }
  return { add: [...new Set(add)], remove: [...new Set(remove)], changed: add.length > 0 || remove.length > 0 };
}

export function auditIssue(issue, allIssues = [], openPullRequests = [], healthOptions = {}) {
  const labels = labelsFor(issue);
  const contract = parseIssueContract(issue);
  const owners = canonicalOwners(labels);
  const statuses = canonicalStatuses(labels);
  const repair = reconcileRoutineLabels(issue);
  const health = auditQueueHealth(issue, healthOptions);
  const reasons = [];
  let category = "not-pickup-candidate";
  let eligible = false;
  let nextAction = "no autonomous action; preserve the current gate";

  if (issue?.state !== "open" || issue?.pull_request) {
    category = "closed-or-pr";
  } else if (hasOpenPr(issue, openPullRequests)) {
    category = "represented-by-open-pr";
    reasons.push("linked open PR exists");
    nextAction = "inspect the PR gate; do not dispatch another implementation role";
  } else if (labels.some((label) => label === "status: paused" || label === "state: paused")) {
    category = "paused";
    reasons.push("Issue is intentionally paused");
  } else if (labels.includes("ready-for-human")) {
    category = "human-gated";
    reasons.push("explicit human gate is active");
    nextAction = "wait for the named human decision; do not relabel autonomously";
  } else if (owners.length > 1 || statuses.length > 1) {
    category = "owner-or-status-conflict";
    reasons.push(`owners=${owners.join(",") || "none"}`, `statuses=${statuses.join(",") || "none"}`);
    nextAction = "pm-triage must reconcile from handoff/evidence; do not guess a status";
  } else if (labels.includes("status: blocked")) {
    category = "blocked";
    reasons.push("blocked status is active");
    nextAction = "re-check the named dependency, input, permission, or human decision";
  } else if (labels.includes("status: qa")) {
    category = "quality-engineer-active";
    reasons.push("quality-engineer owns QA");
    nextAction = "quality-engineer verifies the linked implementation";
  } else if (labels.includes("state: implementation") || labels.includes("state: changes-requested")) {
    category = "implementation-active";
    reasons.push("developer implementation or changes-requested state is active");
    nextAction = "developer continues the current implementation loop";
  } else if (contract.status === "status: pending review" && contract.readable) {
    category = owners.length === 0 || owners[0] === "agent: pm-triage" ? "pm-triage-intake" : "pending-owner-follow-up";
    eligible = category === "pm-triage-intake";
    reasons.push("readable pending-review Issue requires triage");
    nextAction = eligible ? "pm-triage records the decision register and routes one next role" : "named owner resolves the pending question";
  } else if (labels.includes("status: ready to pickup")) {
    category = "developer-ready";
    reasons.push("developer pickup status is active");
    nextAction = "developer pickup requires exactly one developer owner and validated inputs";
  } else if (issue?.state === "open") {
    category = "missing-or-noncanonical-workflow-state";
    reasons.push("open Issue has no canonical actionable workflow state");
    nextAction = "pm-triage inspects the Issue body and repairs routine metadata or records the blocker";
  }

  const dependencies = dependencyReport(issue, allIssues);
  if (dependencies.missing.length || dependencies.open.length) {
    reasons.push(`dependencies missing=${dependencies.missing.join(",") || "none"}`, `open=${dependencies.open.join(",") || "none"}`);
    if (category === "pm-triage-intake" || category === "developer-ready") {
      category = "dependency-blocked";
      eligible = false;
      nextAction = "name the dependency owner and keep the Issue blocked or pending review";
    }
  }

  return {
    number: issue?.number ?? null,
    category,
    eligible,
    owners,
    statuses,
    reasons,
    nextAction,
    repair,
    health,
  };
}

export function auditQueue(issues = [], openPullRequests = [], healthOptions = {}) {
  const entries = issues.filter((issue) => !issue?.pull_request).map((issue) => auditIssue(issue, issues, openPullRequests, healthOptions));
  const eligible = entries.filter((entry) => entry.eligible);
  const repairable = entries.filter((entry) => entry.repair.changed || entry.health.repair.add.length || entry.health.repair.remove.length);
  const byCategory = Object.fromEntries([...new Set(entries.map((entry) => entry.category))].sort().map((category) => [category, entries.filter((entry) => entry.category === category).length]));
  return {
    entries,
    eligible,
    repairable,
    noPickup: eligible.length === 0,
    byCategory,
    nextAction: eligible.length ? "pm-triage claims the oldest eligible intake" : "pm-triage reviews the category counts and repairs only routine metadata gaps",
  };
}

export function renderAuditComment(audit) {
  const rows = audit.entries.map((entry) => `- #${entry.number}: ${entry.category}; health=${entry.health.category}; next=${entry.nextAction}; healthAction=${entry.health.action}; reasons=${entry.reasons.join(" | ") || "none"}`);
  return [
    "<!-- CODEX_TRIAGE_AUDIT:v1 -->",
    "CODEX_TRIAGE_AUDIT:v1",
    "",
    `- Eligible pickup count: ${audit.eligible.length}`,
    `- No-pickup diagnosis: ${audit.noPickup ? "yes" : "no"}`,
    `- Category counts: ${Object.entries(audit.byCategory).map(([key, value]) => `${key}=${value}`).join(", ") || "none"}`,
    `- Next action: ${audit.nextAction}`,
    "- Entries:",
    ...rows,
  ].join("\n");
}
