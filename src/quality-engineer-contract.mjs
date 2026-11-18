const REQUIRED_SKILL_SECTIONS = [
  "## Mission", "## Inputs", "## Authority", "## Forbidden actions",
  "## Legal outputs", "## Completion criteria", "## Return paths",
];

const REQUIRED_TERMS = [
  "agent: quality-engineer", "status: qa", "developer", "pm-triage",
  "CODEX_HANDOFF:v1", "ready-for-human", "mergeable state", "workflow",
  "content", "mathematics", "layout/PDF", "deterministic",
];

export function validateQualityEngineerSkill(markdown = "") {
  const source = String(markdown);
  const errors = [];
  for (const section of REQUIRED_SKILL_SECTIONS) {
    if (!source.includes(section)) errors.push(`skill section missing: ${section}`);
  }
  for (const term of REQUIRED_TERMS) {
    if (!source.includes(term)) errors.push(`skill contract term missing: ${term}`);
  }
  if (!/do not[\s\S]{0,180}(merge|publish|dispatch)/i.test(source)) errors.push("skill must forbid merge, publish, or dispatch");
  if (!/exactly one owner[\s\S]{0,180}status: qa/i.test(source)) errors.push("skill must require one QE owner and QA status");
  if (!/blocked[\s\S]{0,220}pm-triage/i.test(source)) errors.push("skill must return blocked work to pm-triage");
  if (!/rejected[\s\S]{0,220}developer/i.test(source)) errors.push("skill must return failed work to developer");
  if (!/commands[\s\S]{0,180}(artifact|output)/i.test(source)) errors.push("skill must require reproducible command and artifact evidence");
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function validateQualityEngineerPickup(contract = {}) {
  const errors = [];
  if (contract.owner !== "agent: quality-engineer") errors.push("quality-engineer owner is required");
  if (contract.status !== "status: qa") errors.push("status: qa is required");
  if (contract.kind === "parent") errors.push("parent Issues cannot be QE pickup work");
  if (contract.issueComplete !== true) errors.push("complete Issue is required");
  if (contract.prLinked !== true) errors.push("linked PR is required");
  if (contract.acceptanceCriteria !== true) errors.push("acceptance criteria are required");
  if (contract.dependenciesSatisfied !== true) errors.push("dependencies must be resolved");
  if (contract.humanDecisionRequired === true && contract.humanDecisionRecorded !== true) errors.push("human decision must be recorded before gated QA");
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}
