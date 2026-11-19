const GOVERNANCE_OWNERS = new Set([
  "agent: pm-triage", "agent: product-manager", "agent: architect",
  "agent: social-expert", "agent: developer", "agent: quality-engineer",
]);
const GOVERNANCE_STATUSES = new Set([
  "status: pending review", "status: blocked", "status: ready to pickup",
  "status: qa", "status: paused", "status: ready to dispatch", "status: done",
]);

export const DEPRECATED_DERIVED_LABELS = new Set([
  "agent-requested", "needs-info", "needs-triage", "ready-for-agent",
  "state: decision-complete", "state: ready-to-pickup", "state: blocked",
  "state: qa", "state: human-review", "state: done",
  "status:pending review", "status:blocked", "status:ready to pickup",
  "status:qa", "status:paused", "status:ready to dispatch", "status:done",
  "status:ready to dispatch",
]);

const STATUS_ALIASES = Object.freeze({
  "status:pending review": "status: pending review",
  "status:blocked": "status: blocked",
  "status:ready to pickup": "status: ready to pickup",
  "status:qa": "status: qa",
  "status:paused": "status: paused",
  "status:ready to dispatch": "status: ready to dispatch",
  "status:done": "status: done",
  "state: blocked": "status: blocked",
  "state: qa": "status: qa",
  "state: done": "status: done",
});

function names(labels = []) {
  return labels.map((label) => typeof label === "string" ? label : label?.name).filter(Boolean);
}

function isDerived(label) {
  return GOVERNANCE_OWNERS.has(label)
    || GOVERNANCE_STATUSES.has(label)
    || label.startsWith("agent: ")
    || label.startsWith("state: ")
    || label.startsWith("status:")
    || label === "ready-for-human"
    || DEPRECATED_DERIVED_LABELS.has(label);
}

function canonicalize(label) {
  return STATUS_ALIASES[label] || (DEPRECATED_DERIVED_LABELS.has(label) ? null : label);
}

export function validateDerivedLabelInvariant(labels = []) {
  const current = names(labels);
  const owners = current.filter((label) => GOVERNANCE_OWNERS.has(label));
  const lifecycle = current.filter((label) => GOVERNANCE_STATUSES.has(label) || label.startsWith("state: ") || label === "ready-for-human");
  const deprecated = current.filter((label) => DEPRECATED_DERIVED_LABELS.has(label));
  const errors = [];
  if (owners.length > 1) errors.push("derived labels must contain exactly one owner at most");
  if (lifecycle.length > 1) errors.push("derived labels must contain exactly one workflow state at most");
  if (current.includes("status: ready to pickup") && owners.length !== 1) {
    errors.push("ready to pickup requires exactly one owner in the same label state");
  }
  if (deprecated.length) errors.push(`deprecated derived labels present: ${deprecated.join(", ")}`);
  return { valid: errors.length === 0, errors, owners, lifecycle, deprecated };
}

/**
 * Build the complete label replacement for entering developer pickup.
 *
 * GitHub's Issues API accepts a complete `labels` array atomically. Callers
 * must use the returned `labels` with one `issues.update`/`issues.create`
 * request; they must not remove the blocker and add the pickup status in
 * separate requests.
 */
export function buildAtomicReadyPickupLabels(currentLabels = [], owner = "agent: developer") {
  if (!GOVERNANCE_OWNERS.has(owner)) {
    return { valid: false, atomic: true, errors: [`unsupported ready-to-pickup owner: ${owner}`], labels: names(currentLabels), add: [], remove: [] };
  }
  const current = names(currentLabels);
  const preserved = current.filter((label) => !isDerived(label));
  const result = reconcileDerivedLabels(current, [...preserved, owner, "status: ready to pickup"]);
  return { ...result, atomic: true };
}

export function reconcileDerivedLabels(currentLabels = [], desiredDerivedLabels = null) {
  const current = names(currentLabels);
  const desired = desiredDerivedLabels === null
    ? current.map(canonicalize).filter(Boolean)
    : names(desiredDerivedLabels).map(canonicalize).filter(Boolean);
  const preserved = current.filter((label) => !isDerived(label));
  const next = [...new Set([...preserved, ...desired])];
  const invariant = validateDerivedLabelInvariant(next);
  if (!invariant.valid) return { valid: false, errors: invariant.errors, labels: current, add: [], remove: [] };
  return {
    valid: true,
    errors: [],
    labels: next,
    add: next.filter((label) => !current.includes(label)),
    remove: current.filter((label) => !next.includes(label)),
  };
}

export function canonicalDerivedLabelsForPlan(currentLabels, desiredDerivedLabels) {
  const result = reconcileDerivedLabels(currentLabels, desiredDerivedLabels);
  if (!result.valid) throw new Error(result.errors.join("; "));
  return result;
}
