import { AGENT_ROLES, validateHandoff } from "./agent-handoff.mjs";

const DECISION_ROLES = new Set(["architect", "product-manager", "social-expert"]);

function result(overrides = {}) {
  return {
    valid: true,
    errors: [],
    duplicate: false,
    addLabels: [],
    removeLabels: [],
    nextRole: null,
    nextState: null,
    shouldComment: true,
    ...overrides,
  };
}

function invalid(errors) {
  return result({ valid: false, errors: [...new Set(errors)], shouldComment: false });
}

function hasLabel(context, label) {
  return new Set(context.labels ?? []).has(label);
}

export function routeHandoff(handoff, context = {}) {
  const validation = validateHandoff(handoff);
  if (!validation.valid) return invalid(validation.errors);
  if (!AGENT_ROLES.includes(handoff.from) || !AGENT_ROLES.includes(handoff.to)) return invalid(["role_invalid"]);
  if ((context.seenHandoffIds ?? []).includes(handoff.handoffId)) return result({ duplicate: true, shouldComment: false });

  if (handoff.status === "blocked") {
    return result({
      addLabels: ["state: blocked"],
      nextRole: "pm-triage",
      nextState: "blocked",
    });
  }

  if (DECISION_ROLES.has(handoff.from) && handoff.status === "completed") {
    if (handoff.to !== "pm-triage") return invalid(["decision_handoff_must_return_to_pm_triage"]);
    return result({
      addLabels: ["agent: pm-triage", "state: decision-complete"],
      nextRole: "pm-triage",
      nextState: "decision-complete",
    });
  }

  if (handoff.from === "pm-triage" && handoff.to === "developer" && ["accepted", "completed"].includes(handoff.status)) {
    if (!hasLabel(context, "status: ready to pickup")) return invalid(["developer_gate_missing"]);
    return result({
      addLabels: ["agent: developer", "state: implementation"],
      nextRole: "developer",
      nextState: "implementation",
    });
  }

  if (handoff.from === "developer" && handoff.to === "quality-engineer" && handoff.status === "completed") {
    if (!context.isPullRequest) return invalid(["pull_request_required"]);
    return result({
      addLabels: ["agent: quality-engineer", "state: qa"],
      nextRole: "quality-engineer",
      nextState: "qa",
    });
  }

  if (handoff.from === "quality-engineer" && handoff.to === "developer" && handoff.status === "rejected") {
    if (!context.isPullRequest) return invalid(["pull_request_required"]);
    return result({
      addLabels: ["agent: developer", "state: changes-requested"],
      nextRole: "developer",
      nextState: "changes-requested",
    });
  }

  if (handoff.from === "quality-engineer" && handoff.status === "completed") {
    if (!context.isPullRequest) return invalid(["pull_request_required"]);
    return result({
      addLabels: ["state: human-review"],
      nextRole: null,
      nextState: "human-review",
    });
  }

  return invalid(["unsupported_transition"]);
}
