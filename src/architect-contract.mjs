const REQUIRED_SKILL_SECTIONS = [
  "## Mission", "## Inputs", "## Authority", "## Forbidden actions",
  "## Procedure", "## Legal outputs", "## Completion criteria", "## Return paths",
];

const REQUIRED_TERMS = [
  "agent: architect", "state: decision-requested", "Decision Owner",
  "system boundaries", "schemas", "interfaces", "failure behavior",
  "migration impact", "CODEX_HANDOFF:v1", "pm-triage", "do not guess",
  "workflow-label mutation", "status: ready to pickup",
];

export function validateArchitectSkill(markdown = "") {
  const source = String(markdown);
  const errors = [];
  for (const section of REQUIRED_SKILL_SECTIONS) {
    if (!source.includes(section)) errors.push(`skill section missing: ${section}`);
  }
  for (const term of REQUIRED_TERMS) {
    if (!source.includes(term)) errors.push(`skill contract term missing: ${term}`);
  }
  if (!/must not[\s\S]{0,220}(product|implementation|quality|release)/i.test(source)) {
    errors.push("skill must preserve non-architecture role boundaries");
  }
  if (!/missing technical evidence[\s\S]{0,180}blocker/i.test(source)) {
    errors.push("skill must fail closed on missing technical evidence");
  }
  if (!/exactly one[\s\S]{0,180}architecture[\s\S]{0,80}conclusion/i.test(source)) {
    errors.push("skill must require exactly one architecture conclusion");
  }
  if (!/pm-triage owns labels/i.test(source)) {
    errors.push("skill must keep label and implementation routing with pm-triage");
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function validateArchitectDecision(contract = {}) {
  const errors = [];
  if (contract.owner !== "agent: architect") errors.push("architect owner is required");
  if (contract.status !== "state: decision-requested") errors.push("state: decision-requested is required");
  if (contract.decisionOwner !== "architect") errors.push("architect must own the decision row");
  if (contract.issueComplete !== true) errors.push("complete Issue context is required");
  if (contract.evidencePresent !== true) errors.push("technical evidence is required");
  if (contract.questionIsArchitectureOwned !== true) errors.push("question must be architecture-owned");
  if (contract.interfaceImpactRecorded !== true) errors.push("interface or behavior impact is required");
  if (contract.verificationRecorded !== true) errors.push("verification implications are required");
  if (contract.labelMutationAttempted === true) errors.push("architect must not mutate workflow labels");
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}
