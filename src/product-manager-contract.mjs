const REQUIRED_SKILL_SECTIONS = [
  "## Mission", "## Inputs", "## Authority", "## Forbidden actions",
  "## Procedure", "## Legal outputs", "## Completion criteria", "## Return paths",
];

const REQUIRED_TERMS = [
  "agent: product-manager", "state: decision-requested", "pm-triage",
  "Decision Owner", "acceptance intent", "CODEX_HANDOFF:v1",
  "HUMAN_DECISION_REQUEST:v1", "do not claim", "does not mutate labels",
];

export function validateProductManagerSkill(markdown = "") {
  const source = String(markdown);
  const errors = [];
  for (const section of REQUIRED_SKILL_SECTIONS) {
    if (!source.includes(section)) errors.push(`skill section missing: ${section}`);
  }
  for (const term of REQUIRED_TERMS) {
    if (!source.includes(term)) errors.push(`skill contract term missing: ${term}`);
  }
  if (!/must not[\s\S]{0,180}(architecture|implementation|quality|release)/i.test(source)) {
    errors.push("skill must preserve other role boundaries");
  }
  if (!/missing evidence[\s\S]{0,180}pm-triage/i.test(source)) {
    errors.push("skill must return missing evidence to pm-triage");
  }
  if (!/exactly one[\s\S]{0,180}product conclusion/i.test(source)) {
    errors.push("skill must require exactly one product conclusion");
  }
  if (!/does not mutate labels/i.test(source)) {
    errors.push("skill must keep workflow label mutation with pm-triage");
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function validateProductManagerDecision(contract = {}) {
  const errors = [];
  if (contract.owner !== "agent: product-manager") errors.push("product-manager owner is required");
  if (contract.status !== "state: decision-requested") errors.push("state: decision-requested is required");
  if (contract.decisionOwner !== "product-manager") errors.push("product-manager must own the decision row");
  if (contract.issueComplete !== true) errors.push("complete Issue context is required");
  if (contract.evidencePresent !== true) errors.push("decision evidence is required");
  if (contract.questionIsProductOwned !== true) errors.push("question must be product-owned");
  if (contract.humanDecisionRequired === true && contract.humanRequestRecorded !== true) {
    errors.push("human-only decision requires HUMAN_DECISION_REQUEST:v1");
  }
  if (contract.labelMutationAttempted === true) errors.push("product-manager must not mutate workflow labels");
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}
