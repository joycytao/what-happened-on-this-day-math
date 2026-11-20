import { canonicalDerivedLabelsForPlan } from "./derived-label-reconciliation.mjs";
import { dependencyReport, parseIssueContract } from "./issue-governance.mjs";

export const DEPENDENCY_EVENT_SCHEMA = "CODEX_DEPENDENCY_EVENT:v1";
export const DEPENDENCY_EVENT_KINDS = new Set([
  "dependency-closed",
  "source-asset-available",
  "dependency-reconcile",
]);

function labelNames(labels = []) {
  return labels.map((label) => typeof label === "string" ? label : label?.name).filter(Boolean);
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

export function validateDependencyEvent(event = {}) {
  const errors = [];
  if (event.schema !== DEPENDENCY_EVENT_SCHEMA) errors.push(`dependency event schema must be ${DEPENDENCY_EVENT_SCHEMA}`);
  if (typeof event.eventId !== "string" || !event.eventId.trim()) errors.push("dependency event eventId is required");
  if (!DEPENDENCY_EVENT_KINDS.has(event.kind)) errors.push("dependency event kind is unsupported");
  if (event.kind === "dependency-closed" && !numberOrNull(event.dependencyIssue)) {
    errors.push("dependency-closed event requires dependencyIssue");
  }
  if (event.kind === "source-asset-available" && !event.dependencyId && !event.sourceAssetId && !event.commit) {
    errors.push("source-asset-available event requires dependencyId, sourceAssetId, or commit");
  }
  if (event.paths !== undefined && (!Array.isArray(event.paths) || event.paths.some((path) => typeof path !== "string" || !path.trim()))) {
    errors.push("dependency event paths must be a non-empty string array when supplied");
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function parseDependencyEvent({ eventName = "workflow_dispatch", payload = {} } = {}) {
  const issue = payload.issue || {};
  const dispatch = payload.client_payload || {};
  if (eventName === "repository_dispatch") {
    const event = { ...dispatch, schema: dispatch.schema || dispatch.contract };
    return { ...event, valid: validateDependencyEvent(event).valid, errors: validateDependencyEvent(event).errors };
  }
  if (eventName === "issues") {
    const kind = payload.action === "closed" ? "dependency-closed" : "dependency-reconcile";
    const event = {
      schema: DEPENDENCY_EVENT_SCHEMA,
      eventId: `github:issues:${payload.action}:${issue.id || issue.number}:${issue.updated_at || "unknown"}`,
      kind,
      dependencyIssue: numberOrNull(issue.number),
    };
    return { ...event, valid: validateDependencyEvent(event).valid, errors: validateDependencyEvent(event).errors };
  }
  if (eventName === "push") {
    const event = {
      schema: DEPENDENCY_EVENT_SCHEMA,
      eventId: `github:push:${payload.after || "unknown"}`,
      kind: "source-asset-available",
      commit: payload.after || null,
      paths: (payload.commits || []).flatMap((commit) => [...(commit.added || []), ...(commit.modified || [])]),
    };
    return { ...event, valid: validateDependencyEvent(event).valid, errors: validateDependencyEvent(event).errors };
  }
  const workflowRun = payload.workflow_run || {};
  const event = {
    schema: DEPENDENCY_EVENT_SCHEMA,
    eventId: `github:${eventName}:${workflowRun.id || payload.after || "manual"}`,
    kind: "dependency-reconcile",
    conclusion: workflowRun.conclusion || null,
  };
  return { ...event, valid: validateDependencyEvent(event).valid, errors: validateDependencyEvent(event).errors };
}

function eventMatchesIssue(event, issue, contract) {
  if (event.kind === "dependency-reconcile") return true;
  if (event.kind === "dependency-closed") {
    const dependencyIssue = numberOrNull(event.dependencyIssue);
    return Boolean(dependencyIssue && contract.dependencies.some((dependency) => dependency.endsWith(`#${dependencyIssue}`)));
  }
  if (event.kind === "source-asset-available") {
    if (!contract.sourceAssetDependencies.length) return false;
    const id = event.dependencyId || event.sourceAssetId;
    return !id || contract.sourceAssetDependencies.some((dependency) => dependency.id === id);
  }
  return false;
}

function transitionLabels(issue, target) {
  const current = labelNames(issue.labels);
  const desired = target === "ready to pickup"
    ? ["agent: developer", "status: ready to pickup"]
    : ["agent: pm-triage", "status: pending review"];
  return canonicalDerivedLabelsForPlan(current, desired);
}

export function dependencyRecoveryPlan(issue, allIssues = [], event = {}) {
  const current = labelNames(issue.labels);
  const contract = parseIssueContract(issue);
  const base = { issue: issue.number, action: "none", valid: true, labels: current, reason: "no dependency recovery" };
  if (issue.state !== "open" || issue.pull_request) return { ...base, reason: "Issue is not open work" };
  if (!current.includes("status: blocked")) return { ...base, reason: "Issue is not blocked" };
  if (current.includes("ready-for-human")) return { ...base, reason: "human gate remains authoritative" };
  const eventValidation = validateDependencyEvent(event);
  if (!eventValidation.valid) return { ...base, valid: false, errors: eventValidation.errors, reason: "invalid dependency event" };
  if (!eventMatchesIssue(event, issue, contract)) return { ...base, reason: "event does not identify this dependency" };
  const report = dependencyReport(issue, allIssues);
  if (!report.satisfied) {
    return { ...base, reason: `dependency remains unresolved: ${[...report.missing, ...report.open, ...report.sourceAssetsMissing].join(", ") || "unknown"}` };
  }
  const ready = contract.reconcileTo === "developer"
    && contract.kind !== "parent"
    && contract.inputsValidated
    && contract.hasAcceptanceCriteria
    && contract.reviewGate === "routine"
    && contract.sourceAssetsSatisfied
    && contract.sourceAssetErrors.length === 0;
  const target = ready ? "ready to pickup" : "pending review";
  const labels = transitionLabels(issue, target);
  return {
    issue: issue.number,
    action: "transition",
    valid: labels.valid,
    labels: labels.labels,
    add: labels.add,
    remove: labels.remove,
    target,
    reason: ready
      ? "all machine-readable dependencies and required inputs are satisfied"
      : "dependency closure is complete but PM must re-check readiness evidence",
    report,
  };
}

export function renderDependencyRecoveryComment({ issue, event, target, reason, report }) {
  const fingerprint = `<!-- CODEX_DEPENDENCY_RECOVERY:${issue}:${event.eventId}:${target} -->`;
  return `${fingerprint}\nCODEX_DEPENDENCY_RECOVERY:v1\n\n- Issue: #${issue}\n- Event: ${event.kind} (${event.eventId})\n- Transition: status: blocked -> ${target}\n- Reason: ${reason}\n- Dependency evidence: ${[...(report?.dependencies || []).map((item) => item.satisfied ? `${item.dependency} satisfied` : `${item.dependency} unresolved`), ...((report?.sourceAssets || []).map((item) => `${item.id}=${item.status}`))].join(", ") || "none"}\n- Human decision needed: no\n- Next action: ${target === "ready to pickup" ? "developer may claim the Issue after the normal PR/QA gates" : "pm-triage re-checks the remaining readiness evidence"}\n- Return path: developer -> quality-engineer; missing or ambiguous evidence -> pm-triage.`;
}
