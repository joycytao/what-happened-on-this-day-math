import { AGENT_ROLES, validateHandoff } from "./agent-handoff.mjs";

const REPO_SLUG = "what-happened-on-this-day-math";
const DECISION_ROLES = new Set(["product-manager", "architect", "social-expert"]);
const HANDOFF_TARGETS = Object.freeze({
  "pm-triage": "developer",
  "product-manager": "pm-triage",
  architect: "pm-triage",
  "social-expert": "pm-triage",
  developer: "quality-engineer",
  "quality-engineer": "developer",
});

function labelNames(item) {
  return new Set((item?.labels ?? []).map(label => typeof label === "string" ? label : label?.name).filter(Boolean));
}

function isEligible(item, role) {
  const labels = labelNames(item);
  if (labels.has("status: blocked") || labels.has("state: blocked") || labels.has("state: paused")) return false;
  if (labels.has("state: implementation")) return false;
  if (labels.has("state: changes-requested") && role !== "developer") return false;
  if (labels.has("state: qa") && role !== "quality-engineer") return false;
  if (labels.has("state: claimed")) return false;

  if (role === "developer") return labels.has("status: ready to pickup") && labels.has("agent: developer");
  if (DECISION_ROLES.has(role)) return labels.has(`agent: ${role}`) && labels.has("state: decision-requested");
  if (role === "quality-engineer") return labels.has("agent: quality-engineer") && labels.has("state: qa");
  if (role === "pm-triage") return labels.has("agent: pm-triage") && (labels.has("state: blocked") || labels.has("state: decision-complete"));
  return false;
}

export function listEligibleWork(items, options = {}) {
  const role = options.role;
  if (!AGENT_ROLES.includes(role)) return { valid: false, items: [], blockers: ["role_invalid"] };
  if (options.connectivityValid === false) {
    return { valid: false, items: [], blockers: [options.connectivityMessage || "GitHub connectivity unavailable"] };
  }
  const eligible = (items ?? [])
    .filter(item => isEligible(item, role))
    .sort((left, right) => String(left.created_at ?? "").localeCompare(String(right.created_at ?? "")));
  return { valid: true, items: eligible.slice(0, Math.max(1, options.limit ?? 1)), blockers: [] };
}

export function buildClaimHandoff(item, role) {
  if (!item?.number || !AGENT_ROLES.includes(role)) throw new Error("Cannot claim without an issue number and valid role");
  const to = HANDOFF_TARGETS[role];
  const handoff = {
    handoffId: `${REPO_SLUG}:${item.number}:${role}:claim`,
    from: role,
    to,
    workItem: `joycytao/${REPO_SLUG}#${item.number}`,
    status: "accepted",
    completed: [`claimed Issue #${item.number}`],
    requiredNextAction: [`perform the ${role} work and write a completed or blocked handoff`],
    evidence: [item.html_url || `Issue #${item.number}`],
    constraints: ["claim at most one work item per cycle", "do not change status: ready to pickup"],
    blockers: ["none"],
    expectedOutput: ["versioned CODEX_HANDOFF:v1 comment"],
  };
  const validation = validateHandoff(handoff);
  if (!validation.valid) throw new Error(`Invalid claim handoff: ${validation.errors.join(", ")}`);
  return handoff;
}

export function formatQueueResult(result) {
  return JSON.stringify(result, null, 2);
}
