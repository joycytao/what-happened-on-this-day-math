import { AGENT_ROLES, HANDOFF_STATUSES, HANDOFF_TARGETS, roleOutputContract } from "./governance-schema.mjs";

export const ROLE_OUTPUT_KINDS = Object.freeze(Object.fromEntries(AGENT_ROLES.map((role) => [role, roleOutputContract(role).outputKind])));

export const LEGAL_RETURN_PATHS = Object.freeze(Object.fromEntries(AGENT_ROLES.map((role) => [role, Object.freeze([...roleOutputContract(role).returnPaths])] )));
const LEGAL_TARGETS = Object.freeze(Object.fromEntries(AGENT_ROLES.map((role) => [role, Object.freeze([...roleOutputContract(role).targets])] )));

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function substantive(values) {
  return list(values).filter((value) => hasText(value) && String(value).trim().toLowerCase() !== "none");
}

export function validateRoleOutput(output = {}) {
  const errors = [];
  const role = output.from;
  const status = output.status;
  const completed = substantive(output.completed);
  const blockers = substantive(output.blockers);
  const missing = substantive(output.prerequisitesMissing);

  if (!AGENT_ROLES.includes(role)) errors.push("role_output_from_invalid");
  if (!HANDOFF_TARGETS.includes(output.to)) errors.push("role_output_target_invalid");
  if (!HANDOFF_STATUSES.includes(status)) errors.push("role_output_status_invalid");
  if (ROLE_OUTPUT_KINDS[role] && output.outputKind !== ROLE_OUTPUT_KINDS[role]) {
    errors.push("role_output_kind_invalid");
  }
  if (!LEGAL_RETURN_PATHS[role]?.includes(output.returnPath)) errors.push("role_output_return_path_invalid");
  if (!Array.isArray(output.prerequisitesSatisfied) || !output.prerequisitesSatisfied.every(hasText)) {
    errors.push("role_output_prerequisites_satisfied_invalid");
  }
  if (!Array.isArray(output.prerequisitesMissing) || !output.prerequisitesMissing.every(hasText)) {
    errors.push("role_output_prerequisites_missing_invalid");
  }
  if (!LEGAL_TARGETS[role]?.includes(output.to)) errors.push("role_output_target_not_legal_for_role");
  if (completed.length > 0 && blockers.length > 0) errors.push("completed_and_blocked_conflict");
  if ((status === "completed" || status === "accepted") && completed.length === 0) errors.push("successful_output_requires_completed_evidence");
  if ((status === "blocked" || status === "rejected") && blockers.length === 0) errors.push("blocked_output_requires_blocker_evidence");
  if ((status === "blocked" || status === "rejected") && completed.length > 0) errors.push("blocked_output_cannot_have_completed_evidence");
  if (missing.length > 0 && status !== "blocked") errors.push("unsatisfied_prerequisite_cannot_be_crossed");
  if (missing.length > 0 && (output.to !== "pm-triage" || output.returnPath !== "pm-triage")) {
    errors.push("unsatisfied_prerequisite_must_return_to_pm_triage");
  }
  if (status === "blocked" && output.to !== "pm-triage") errors.push("blocked_output_must_target_pm_triage");
  if (status === "rejected" && !(role === "quality-engineer" && output.to === "developer")) {
    errors.push("rejected_output_must_return_to_developer_from_quality_engineer");
  }
  if (status === "completed") {
    const expectedTarget = {
      "pm-triage": new Set(["product-manager", "architect", "social-expert", "developer"]),
      "product-manager": new Set(["pm-triage"]),
      architect: new Set(["pm-triage"]),
      "social-expert": new Set(["pm-triage"]),
      developer: new Set(["quality-engineer"]),
      "quality-engineer": new Set(["ready-for-human"]),
    }[role];
    if (!expectedTarget?.has(output.to)) errors.push("completed_output_target_invalid_for_role");
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function roleOutputSchema() {
  return {
    version: "1",
    roles: Object.fromEntries(AGENT_ROLES.map((role) => [role, {
      outputKind: ROLE_OUTPUT_KINDS[role],
      targets: LEGAL_TARGETS[role],
      returnPaths: LEGAL_RETURN_PATHS[role],
    }])),
  };
}
