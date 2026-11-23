const OWNER_PREFIX = "agent: ";
const STATUS_PREFIX = "status: ";
import { classifyHumanReview } from "./human-review-policy.mjs";
import { humanGateSubtypeFromBody, validateReadyForHumanGate } from "./human-gate-integrity.mjs";
import { validateDerivedLabelInvariant } from "./derived-label-reconciliation.mjs";
import { parseSourceAssetDependencies, requiresSourceAssetDependency } from "./source-asset-dependency.mjs";
import { GOVERNANCE_OWNERS, GOVERNANCE_STATUSES } from "./governance-schema.mjs";
export { GOVERNANCE_OWNERS, GOVERNANCE_STATUSES } from "./governance-schema.mjs";

export const GOVERNANCE_TRANSITIONS = new Map([
  ["status: pending review", new Set([
    "state: decision-requested",
    "status: blocked",
    "status: ready to pickup",
    "ready-for-human",
  ])],
  ["ready-for-human", new Set([
    "status: ready to pickup",
    "status: ready to dispatch",
  ])],
  ["status: ready to pickup", new Set(["state: implementation"])],
  ["state: implementation", new Set(["status: qa"])],
  ["status: qa", new Set(["state: changes-requested", "ready-for-human"])],
  ["state: changes-requested", new Set(["state: implementation"])],
  ["status: blocked", new Set(["status: pending review"])],
  ["status: ready to dispatch", new Set(["status: done"])],
]);

export function validateGovernanceTransition(from, to) {
  const allowed = GOVERNANCE_TRANSITIONS.get(from);
  return {
    valid: Boolean(allowed?.has(to)),
    from,
    to,
    errors: allowed?.has(to) ? [] : [`unsupported transition: ${from} -> ${to}`],
  };
}

const VALUE = (name) => new RegExp(`^${name}:\\s*(.+)$`, "im");

function labelNames(labels = []) {
  return labels.map((label) => typeof label === "string" ? label : label?.name).filter(Boolean);
}

function firstValue(body, name) {
  const match = String(body || "").match(VALUE(name));
  return match?.[1]?.trim() || null;
}

function reviewPolicy(body) {
  const reviewGate = firstValue(body, "Review gate") || "routine";
  try {
    return { ...classifyHumanReview({ reviewGate }), errors: [] };
  } catch (error) {
    return { reviewGate, humanDecisionRequired: false, humanActionRequired: false, errors: [error.message] };
  }
}

export function parseIssueContract(issue = {}) {
  const body = String(issue.body || "");
  const labels = labelNames(issue.labels);
  const review = reviewPolicy(body);
  const gateSubtype = humanGateSubtypeFromBody(body);
  const sourceAssets = parseSourceAssetDependencies(body);
  const sourceAssetErrors = [...sourceAssets.errors];
  if (requiresSourceAssetDependency(labels) && sourceAssets.dependencies.length === 0) {
    sourceAssetErrors.push("social work requires a CODEX_SOURCE_ASSET_DEPENDENCY contract");
  }
  const marker = body.match(/<!--\s*monthly-production:([^:]+):([^\s]+)\s*-->/i);
  const exactDependencies = [...body.matchAll(/^CODEX_DEPENDS_ON:\s*([^\s]+#\d+)\s*$/gim)].map((match) => match[1]);
  const keyDependencies = [...body.matchAll(/^CODEX_DEPENDS_ON_KEY:\s*([^\s]+)\s*$/gim)].map((match) => match[1]);
  const dependencySection = body.match(/(?:^|\n)##?\s+Dependencies\s*\n([\s\S]*?)(?=\n##?\s+|$)/i)?.[1] || "";
  const legacyDependencies = [...dependencySection.matchAll(/^\s*-\s+([a-z][a-z0-9-]+)\s*$/gim)].map((match) => match[1]);
  const dependencies = [...new Set([...exactDependencies, ...keyDependencies, ...legacyDependencies])];
  return {
    number: issue.number,
    state: issue.state || "open",
    labels,
    owners: labels.filter((label) => label.startsWith(OWNER_PREFIX) && GOVERNANCE_OWNERS.has(label)),
    statuses: labels.filter((label) => label.startsWith(STATUS_PREFIX)),
    status: labels.find((label) => label.startsWith(STATUS_PREFIX)) || null,
    marker: marker ? `monthly-production:${marker[1]}:${marker[2]}` : null,
    month: marker?.[1] || null,
    key: marker?.[2] || null,
    kind: firstValue(body, "CODEX_WORK_ITEM_KIND") || (marker?.[2] === "parent" ? "parent" : "implementation"),
    parentKey: firstValue(body, "CODEX_PARENT_KEY"),
    exactDependencies,
    keyDependencies,
    legacyDependencies,
    dependencies,
    inputsValidated: /^(true|yes)$/i.test(firstValue(body, "CODEX_INPUTS_VALIDATED") || "") || Boolean(marker),
    reconcileTo: firstValue(body, "CODEX_RECONCILE_TO"),
    hasAcceptanceCriteria: /(^|\n)##?\s+(acceptance criteria|completion evidence)\b/i.test(body),
    readable: body.trim().length > 0 && /(^|\n)#\s+|(^|\n)##?\s+/m.test(body),
    reviewGate: review.reviewGate,
    sourceAssetDependencies: sourceAssets.dependencies,
    sourceAssetErrors: [...new Set(sourceAssetErrors)],
    sourceAssetsSatisfied: sourceAssets.satisfied && sourceAssetErrors.length === 0,
    humanDecisionRequired: review.humanDecisionRequired,
    humanActionRequired: review.humanActionRequired,
    humanGateSubtype: gateSubtype.subtype,
    humanGateSubtypeSource: gateSubtype.source,
    reviewErrors: review.errors,
  };
}

function findDependency(dep, issue, allIssues) {
  const exact = dep.match(/#(\d+)$/)?.[1];
  if (exact) return allIssues.find((candidate) => String(candidate.number) === exact) || null;
  return allIssues.find((candidate) => {
    const contract = parseIssueContract(candidate);
    return contract.month === issue.month && (contract.key === dep || contract.marker === dep);
  }) || null;
}

export function dependencyReport(issue, allIssues = []) {
  const contract = parseIssueContract(issue);
  const dependencies = contract.dependencies.map((dependency) => {
    const resolved = findDependency(dependency, issue, allIssues);
    return { dependency, resolved, satisfied: Boolean(resolved && resolved.state === "closed") };
  });
  return {
    dependencies,
    missing: dependencies.filter((item) => !item.resolved).map((item) => item.dependency),
    open: dependencies.filter((item) => item.resolved && !item.satisfied).map((item) => item.dependency),
    sourceAssets: contract.sourceAssetDependencies,
    sourceAssetsMissing: contract.sourceAssetDependencies.filter((item) => item.status !== "available").map((item) => item.id),
    satisfied: dependencies.every((item) => item.satisfied) && contract.sourceAssetsSatisfied && contract.sourceAssetErrors.length === 0,
  };
}

export function validateGovernanceIssue(issue, allIssues = []) {
  const contract = parseIssueContract(issue);
  const errors = [];
  errors.push(...validateDerivedLabelInvariant(contract.labels).errors);
  if (contract.owners.length > 1) errors.push("exactly one supported agent owner is required");
  if (contract.status && !GOVERNANCE_STATUSES.has(contract.status)) errors.push(`unsupported workflow status: ${contract.status}`);
  if (contract.status === "status: ready to pickup" && contract.owners[0] !== "agent: developer") errors.push("ready to pickup requires agent: developer");
  if (contract.status === "status: ready to pickup" && contract.kind === "parent") errors.push("parent Issues cannot be developer pickup work");
  const dependencies = dependencyReport(issue, allIssues);
  if (dependencies.missing.length) errors.push(`unresolved dependencies: ${dependencies.missing.join(", ")}`);
  if (contract.status === "status: ready to pickup" && !dependencies.satisfied) errors.push(`open dependencies: ${dependencies.open.join(", ")}`);
  if (contract.status === "status: ready to pickup" && !contract.inputsValidated) errors.push("required inputs are not marked validated");
  if (contract.status === "status: ready to pickup" && !contract.hasAcceptanceCriteria) errors.push("acceptance criteria are missing");
  errors.push(...contract.reviewErrors);
  errors.push(...contract.sourceAssetErrors);
  if (contract.status === "status: ready to pickup" && !contract.sourceAssetsSatisfied) {
    errors.push(`source asset dependency unresolved: ${contract.sourceAssetDependencies.filter((item) => item.status !== "available").map((item) => item.id).join(", ") || "missing contract"}`);
  }
  const humanGate = contract.labels.includes("ready-for-human");
  errors.push(...validateReadyForHumanGate({ labels: contract.labels, body: issue.body, comments: issue.comments }).errors);
  if (contract.status === "status: ready to pickup" && contract.reviewGate !== "routine") errors.push("human review gates cannot be routed to routine pickup");
  if (contract.humanDecisionRequired && !humanGate) errors.push("explicit human review gate requires ready-for-human");
  return { valid: errors.length === 0, errors, contract, dependencies };
}

export function isRoleRemediationCandidate(issue) {
  const contract = parseIssueContract(issue);
  return (issue?.state === undefined || issue?.state === "open")
    && !issue.pull_request
    && contract.status === "status: pending review"
    && contract.kind !== "parent"
    && contract.readable
    && (contract.owners.length === 0 || contract.owners[0] === "agent: pm-triage");
}

export function selectVerifiedQueue(issues = []) {
  const open = issues.filter((issue) => issue.state === "open" && !issue.pull_request);
  const pmIntake = [];
  const developerPickup = [];
  for (const issue of open) {
    const contract = parseIssueContract(issue);
    if (isRoleRemediationCandidate(issue)) pmIntake.push(issue);
    const validation = validateGovernanceIssue(issue, issues);
    if (validation.valid && contract.status === "status: ready to pickup" && contract.owners[0] === "agent: developer" && contract.kind !== "parent") developerPickup.push(issue);
  }
  return { pmIntake, developerPickup };
}
