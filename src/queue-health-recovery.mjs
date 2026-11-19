import { GOVERNANCE_OWNERS, GOVERNANCE_STATUSES } from "./issue-governance.mjs";

export const DEFAULT_STALE_CLAIM_MS = 4 * 60 * 60 * 1000;
const ACTIVE_STATE_LABELS = new Set(["state: claimed", "state: implementation", "state: changes-requested", "state: decision-requested", "state: paused"]);
const HUMAN_GATE_LABELS = new Set(["ready-for-human"]);
const FAILED_CONCLUSIONS = new Set(["failure", "cancelled", "timed_out", "action_required", "startup_failure"]);
const ROLE_STATE = Object.freeze({
  "pm-triage": ["agent: pm-triage", "status: pending review"],
  developer: ["agent: developer", "state: implementation"],
  "quality-engineer": ["agent: quality-engineer", "status: qa"],
});

function labelsFor(issue) {
  return (issue?.labels ?? []).map((label) => typeof label === "string" ? label : label?.name).filter(Boolean);
}

function activeLabels(labels) {
  return labels.filter((label) => GOVERNANCE_OWNERS.has(label) || GOVERNANCE_STATUSES.has(label) || ACTIVE_STATE_LABELS.has(label) || HUMAN_GATE_LABELS.has(label));
}

function repairForTarget(labels, targetLabels) {
  const target = new Set(targetLabels);
  return {
    add: targetLabels.filter((label) => !labels.includes(label)),
    remove: activeLabels(labels).filter((label) => !target.has(label)),
  };
}

function claimAge(issue, now) {
  const claim = issue?.claim;
  if (!claim || !claim.claimedAt) return { valid: false, ageMs: null };
  const claimedAt = Date.parse(claim.claimedAt);
  const nowMs = Date.parse(now);
  if (!Number.isFinite(claimedAt) || !Number.isFinite(nowMs)) return { valid: false, ageMs: null };
  return { valid: true, ageMs: nowMs - claimedAt };
}

function workflowRole(workflowRun = {}) {
  if (ROLE_STATE[workflowRun.role]) return workflowRun.role;
  const name = `${workflowRun.name || ""} ${workflowRun.workflowName || ""}`.toLowerCase();
  const matches = Object.keys(ROLE_STATE).filter((role) => name.includes(role));
  return matches.length === 1 ? matches[0] : null;
}

function base(category, nextRole = null, blockers = [], evidence = []) {
  return { category, nextRole, blockers, evidence, repair: { add: [], remove: [] }, action: "no autonomous mutation" };
}

export function auditQueueHealth(issue = {}, options = {}) {
  const labels = labelsFor(issue);
  const result = base("healthy");
  const mergedPr = (issue.pullRequests ?? []).find((pr) => String(pr.state).toLowerCase() === "merged" || pr.mergedAt || pr.merged_at);

  if (issue.state === "closed") {
    const active = activeLabels(labels);
    if (active.length) {
      result.category = "closed-active-owner";
      result.repair = repairForTarget(labels, ["status: done"]);
      result.action = "remove active owner/workflow labels and add terminal status: done; preserve the closed Issue";
      result.evidence.push("Issue state is closed", `active labels: ${active.join(", ")}`);
    }
    return result;
  }

  if (mergedPr) {
    result.category = "merged-pr-terminal-drift";
    result.repair = repairForTarget(labels, ["status: done"]);
    result.action = "reconcile the linked Issue to status: done; do not close or dispatch it automatically";
    result.evidence.push(`merged PR #${mergedPr.number ?? "unknown"}`);
    return result;
  }

  if (labels.includes("state: claimed")) {
    const age = claimAge(issue, options.now || new Date().toISOString());
    const owner = labels.find((label) => GOVERNANCE_OWNERS.has(label));
    const role = owner?.slice("agent: ".length);
    if (!age.valid) {
      return { ...base("claim-age-unknown", null, ["claim_timestamp_missing"], ["state: claimed is present but no valid claim timestamp was supplied"]), action: "pm-triage requests claim evidence; do not release the claim by guessing" };
    }
    if (!ROLE_STATE[role] || issue.claim?.role !== role) {
      return { ...base("claim-owner-mismatch", null, ["claim_owner_mismatch"], [`claim role=${issue.claim?.role || "missing"}; label owner=${role || "missing"}`]), action: "pm-triage reconciles the claim owner from the latest handoff" };
    }
    if (age.ageMs >= (options.staleAfterMs ?? DEFAULT_STALE_CLAIM_MS)) {
      result.category = "stale-role-claim";
      result.nextRole = role;
      result.repair = { add: [], remove: ["state: claimed"] };
      result.action = `release stale claim and return the Issue to ${role} without changing its canonical owner/status`;
      result.evidence.push(`claim age ${age.ageMs}ms exceeds ${options.staleAfterMs ?? DEFAULT_STALE_CLAIM_MS}ms`);
    } else {
      result.category = "active-role-claim";
      result.nextRole = role;
      result.evidence.push(`claim age ${age.ageMs}ms is within the stale threshold`);
    }
    return result;
  }

  const workflowRun = issue.workflowRun;
  if (workflowRun && FAILED_CONCLUSIONS.has(String(workflowRun.conclusion).toLowerCase())) {
    if (labels.includes("ready-for-human")) {
      return { ...base("workflow-failure-human-gated", null, ["human_gate_active"], [`failed workflow ${workflowRun.id ?? "unknown"} cannot override ready-for-human`]), action: "preserve the human gate and wait for human revision" };
    }
    const role = workflowRole(workflowRun);
    if (!role) {
      return { ...base("workflow-failure-owner-unknown", null, ["failed_workflow_role_missing"], [`failed workflow ${workflowRun.id ?? "unknown"} has no unambiguous role`]), action: "pm-triage identifies the failed role from the handoff and workflow evidence" };
    }
    const desired = ROLE_STATE[role];
    result.category = "workflow-run-failed-recovery";
    result.nextRole = role;
    result.repair = repairForTarget(labels, desired);
    result.action = `restore the canonical ${role} owner/state and require that role to investigate the failed run before handoff`;
    result.evidence.push(`workflow ${workflowRun.id ?? "unknown"} concluded ${workflowRun.conclusion}`, `role=${role}`);
    return result;
  }

  return result;
}

export function auditQueueHealthBatch(issues = [], options = {}) {
  const entries = issues.map((issue) => ({ number: issue.number ?? null, ...auditQueueHealth(issue, options) }));
  return {
    entries,
    repairable: entries.filter((entry) => entry.repair.add.length || entry.repair.remove.length),
    blockers: entries.flatMap((entry) => entry.blockers.map((blocker) => `#${entry.number}: ${blocker}`)),
  };
}
