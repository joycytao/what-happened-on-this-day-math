const REQUIRED_SKILL_SECTIONS = [
  "## Mission",
  "## Inputs",
  "## Authority",
  "## Forbidden actions",
  "## Legal outputs",
  "## Completion criteria",
  "## Return paths",
];

const REQUIRED_TERMS = [
  "agent: developer",
  "status: ready to pickup",
  "quality-engineer",
  "pm-triage",
  "CODEX_HANDOFF:v1",
  "Fixes #<number>",
  "ready-for-human",
  "run-failed",
  "failure classification",
  "failed-job evidence",
  "PR conflicts",
  "mergeable state",
  "isolated worktree",
];

export function validateDeveloperSkill(markdown = "") {
  const source = String(markdown);
  const errors = [];
  for (const section of REQUIRED_SKILL_SECTIONS) {
    if (!source.includes(section)) errors.push(`skill section missing: ${section}`);
  }
  for (const term of REQUIRED_TERMS) {
    if (!source.includes(term)) errors.push(`skill contract term missing: ${term}`);
  }
  if (!/do not[​\s\S]{0,180}(merge|publish|dispatch)/i.test(source)) {
    errors.push("skill must forbid merge, publish, or dispatch");
  }
  if (!/do not[​\s\S]{0,180}(invent|missing content|missing.*dependency)/i.test(source)) {
    errors.push("skill must fail closed on missing inputs or dependencies");
  }
  if (!/exactly one[​\s\S]{0,180}agent: developer/i.test(source)) {
    errors.push("skill must require exactly one developer owner");
  }
  if (!/workflow[\s\S]{0,160}(investigate|failure|run-failed)/i.test(source)) {
    errors.push("skill must require investigation of failed workflow runs");
  }
  if (!/conflict[\s\S]{0,180}(resolve|resolution)/i.test(source)) {
    errors.push("skill must require active conflict resolution");
  }
  if (!/conflict[\s\S]{0,180}resolution\s+summary/i.test(source)) {
    errors.push("skill must require a conflict resolution summary");
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function validateDeveloperPickup(contract = {}) {
  const errors = [];
  if (contract.owner !== "agent: developer") errors.push("developer owner is required");
  if (contract.status !== "status: ready to pickup") errors.push("status: ready to pickup is required");
  if (contract.kind === "parent") errors.push("parent Issues cannot be developer pickup work");
  if (contract.inputsValidated !== true) errors.push("inputs must be validated");
  if (contract.hasAcceptanceCriteria !== true) errors.push("acceptance criteria are required");
  if (contract.dependenciesSatisfied !== true) errors.push("dependencies must be resolved");
  if (contract.reviewGate && contract.reviewGate !== "routine") errors.push("human-gated work cannot enter developer pickup");
  if (contract.humanDecisionRequired === true) errors.push("human decision gate cannot enter developer pickup");
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}
