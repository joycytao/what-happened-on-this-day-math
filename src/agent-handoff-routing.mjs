import { AGENT_ROLES, HANDOFF_TARGETS, validateHandoff } from "./agent-handoff.mjs";
import { classifyHumanReview } from "./human-review-policy.mjs";
import { canonicalDerivedLabelsForPlan } from "./derived-label-reconciliation.mjs";

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

function routedResult(context, derived, overrides = {}) {
  const reconciled = canonicalDerivedLabelsForPlan(context.labels ?? [], derived);
  return result({ addLabels: reconciled.add, removeLabels: reconciled.remove, ...overrides });
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
  if (!AGENT_ROLES.includes(handoff.from) || !HANDOFF_TARGETS.includes(handoff.to)) return invalid(["role_invalid"]);
  if ((context.seenHandoffIds ?? []).includes(handoff.handoffId)) return result({ duplicate: true, shouldComment: false });

  if (handoff.status === "blocked") {
    return routedResult(context, ["agent: pm-triage", "status: blocked"], {
      nextRole: "pm-triage",
      nextState: "blocked",
    });
  }

  if (DECISION_ROLES.has(handoff.from) && handoff.status === "completed") {
    if (handoff.to !== "pm-triage") return invalid(["decision_handoff_must_return_to_pm_triage"]);
    return routedResult(context, ["agent: pm-triage", "status: pending review"], {
      nextRole: "pm-triage",
      nextState: "pending review",
    });
  }

  if (handoff.from === "pm-triage" && handoff.to === "developer" && ["accepted", "completed"].includes(handoff.status)) {
    if (!hasLabel(context, "status: ready to pickup")) return invalid(["developer_gate_missing"]);
    return routedResult(context, ["agent: developer", "state: implementation"], {
      nextRole: "developer",
      nextState: "implementation",
    });
  }

  if (handoff.from === "developer" && handoff.to === "quality-engineer" && handoff.status === "completed") {
    if (!context.isPullRequest) return invalid(["pull_request_required"]);
    return routedResult(context, ["agent: quality-engineer", "status: qa"], {
      nextRole: "quality-engineer",
      nextState: "qa",
    });
  }

  if (handoff.from === "quality-engineer" && handoff.to === "developer" && handoff.status === "rejected") {
    if (!context.isPullRequest) return invalid(["pull_request_required"]);
    return routedResult(context, ["agent: developer", "state: changes-requested"], {
      nextRole: "developer",
      nextState: "changes-requested",
    });
  }

  if (handoff.from === "quality-engineer" && handoff.status === "completed") {
    if (!context.isPullRequest) return invalid(["pull_request_required"]);
    let review;
    try {
      review = classifyHumanReview({ reviewGate: context.reviewGate || "final-merge" });
    } catch (error) {
      return invalid([error.message]);
    }
    if (review.reviewGate === "routine") return invalid(["routine work cannot enter ready-for-human; declare final-merge or a human decision gate"]);
    if (review.humanDecisionRequired && context.humanDecisionRequestCount !== 1) {
      return invalid(["human decision gate requires exactly one HUMAN_DECISION_REQUEST:v1 comment"]);
    }
    return routedResult(context, ["ready-for-human"], {
      nextRole: null,
      nextState: "ready-for-human",
      humanDecisionRequired: review.humanDecisionRequired,
      reviewGate: review.reviewGate,
    });
  }

  return invalid(["unsupported_transition"]);
}
