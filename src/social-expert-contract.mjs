const REQUIRED_SKILL_SECTIONS = [
  "## Mission", "## Inputs", "## Authority", "## Forbidden actions",
  "## Procedure", "## Legal outputs", "## Completion criteria", "## Return paths",
];

const REQUIRED_TERMS = [
  "agent: social-expert", "state: decision-requested", "Decision Owner",
  "Instagram", "Facebook", "Reel", "Carousel", "cadence", "asset contract",
  "CODEX_HANDOFF:v1", "pm-triage", "do not guess", "workflow-label",
  "publish", "dispatch",
];

export function validateSocialExpertSkill(markdown = "") {
  const source = String(markdown);
  const errors = [];
  for (const section of REQUIRED_SKILL_SECTIONS) {
    if (!source.includes(section)) errors.push(`skill section missing: ${section}`);
  }
  for (const term of REQUIRED_TERMS) {
    if (!source.includes(term)) errors.push(`skill contract term missing: ${term}`);
  }
  if (!/must not[\s\S]{0,260}(product|architecture|implementation|quality|publication)/i.test(source)) {
    errors.push("skill must preserve non-social role boundaries");
  }
  if (!/missing (platform|source|asset)[\s\S]{0,180}blocker/i.test(source)) {
    errors.push("skill must fail closed on missing platform, source, or asset evidence");
  }
  if (!/exactly one[\s\S]{0,180}social conclusion/i.test(source)) {
    errors.push("skill must require exactly one social conclusion");
  }
  if (!/pm-triage owns (workflow )?labels/i.test(source)) {
    errors.push("skill must keep label and implementation routing with pm-triage");
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function validateSocialExpertDecision(contract = {}) {
  const errors = [];
  if (contract.owner !== "agent: social-expert") errors.push("social-expert owner is required");
  if (contract.status !== "state: decision-requested") errors.push("state: decision-requested is required");
  if (contract.decisionOwner !== "social-expert") errors.push("social-expert must own the decision row");
  if (contract.issueComplete !== true) errors.push("complete Issue context is required");
  if (contract.evidencePresent !== true) errors.push("social evidence is required");
  if (contract.questionIsSocialOwned !== true) errors.push("question must be social-owned");
  if (contract.channelConstraintRecorded !== true) errors.push("channel or format constraint is required");
  if (contract.assetContractRecorded !== true) errors.push("social asset contract is required");
  if (contract.verificationRecorded !== true) errors.push("social verification is required");
  if (contract.labelMutationAttempted === true) errors.push("social-expert must not mutate workflow labels");
  if (contract.humanDecisionRequired === true && contract.humanRequestRecorded !== true) {
    errors.push("explicit human decision request is required");
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}
