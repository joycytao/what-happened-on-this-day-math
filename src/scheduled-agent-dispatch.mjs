import { isRoleRemediationCandidate } from "./issue-governance.mjs";

export const DISPATCH_ROLES = Object.freeze([
  "pm-triage",
  "product-manager",
  "architect",
  "social-expert",
  "developer",
  "quality-engineer"
]);

export const ROLE_SKILLS = Object.freeze({
  "pm-triage": "skills/pm-triage/SKILL.md",
  "product-manager": "skills/product-manager/SKILL.md",
  architect: "skills/architect/SKILL.md",
  "social-expert": "skills/social-expert/SKILL.md",
  developer: "skills/developer/SKILL.md",
  "quality-engineer": "skills/quality-engineer/SKILL.md"
});

export const NEXT_ROLES = Object.freeze({
  "pm-triage": "developer",
  "product-manager": "pm-triage",
  architect: "pm-triage",
  "social-expert": "pm-triage",
  developer: "quality-engineer",
  "quality-engineer": "developer"
});

export const ROLE_ACTIONS = Object.freeze({
  "pm-triage": "Resolve scope, acceptance criteria, dependency classification, and routing gaps owned by PM triage; do not wait for a Human Owner for routine completeness work.",
  "product-manager": "Resolve the assigned product decision and record its conclusion and evidence.",
  architect: "Resolve the assigned architecture decision and record its conclusion and evidence.",
  "social-expert": "Resolve the assigned channel or social-format decision and record its conclusion and evidence.",
  developer: "Implement the accepted Issue within scope, then hand off concrete verification evidence to QA.",
  "quality-engineer": "Verify the implementation against acceptance criteria and return either concrete defects or a pass handoff."
});

function labelsFor(issue) {
  return new Set((issue?.labels ?? []).map((label) => typeof label === "string" ? label : label?.name).filter(Boolean));
}

export function isScheduledEligible(issue, role) {
  const labels = labelsFor(issue);
  if (!issue || issue.pullRequest || issue.pull_request) return false;
  const owners = [...labels].filter((label) => label.startsWith("agent: "));
  const pmBootstrap = role === "pm-triage" && isRoleRemediationCandidate(issue) && owners.length === 0;
  if (owners.length !== 1 && !pmBootstrap) return false;
  if (labels.has("state: paused") || labels.has("state: blocked") || labels.has("status: blocked")) return false;
  if (labels.has("state: claimed") || labels.has("state: implementation")) return false;
  if (labels.has("state: changes-requested") && role !== "developer") return false;
  if (labels.has("state: qa") && role !== "quality-engineer") return false;
  if (role === "developer") return labels.has("status: ready to pickup") && labels.has("agent: developer");
  if (["product-manager", "architect", "social-expert"].includes(role)) {
    return labels.has(`agent: ${role}`) && labels.has("state: decision-requested");
  }
  if (role === "quality-engineer") return labels.has("agent: quality-engineer") && labels.has("state: qa");
  if (role === "pm-triage") {
    return isRoleRemediationCandidate(issue);
  }
  return false;
}

function sortIssues(issues) {
  return [...issues].sort((left, right) => String(left.created_at ?? left.createdAt ?? "").localeCompare(String(right.created_at ?? right.createdAt ?? "")) || Number(left.number) - Number(right.number));
}

export function buildScheduledDispatchPlan(issues, { generatedAt = new Date().toISOString() } = {}) {
  const assignments = [];
  for (const role of DISPATCH_ROLES) {
    const issue = sortIssues(issues ?? []).find((candidate) => isScheduledEligible(candidate, role));
    if (!issue) continue;
    const number = Number(issue.number);
    const issueUrl = issue.html_url || issue.url || `https://github.com/joycytao/what-happened-on-this-day-math/issues/${number}`;
    const marker = `<!-- codex-scheduled-agent:${role}:${number} -->`;
    assignments.push({
      role,
      skill: ROLE_SKILLS[role],
      nextRole: NEXT_ROLES[role],
      issueNumber: number,
      issueTitle: issue.title,
      issueUrl,
      marker,
      body: [
        marker,
        "CODEX_SCHEDULED_AGENT_DISPATCH",
        "",
        `Scheduled work assignment for **${role}** on [#${number}](${issueUrl}).`,
        "",
        `- Role: \`${role}\``,
        `- Skill: \`${ROLE_SKILLS[role]}\``,
        `- Next handoff: \`${NEXT_ROLES[role]}\``,
        `- Why this role now: ${ROLE_ACTIONS[role]}`,
        "- Human decision needed: no by default; create a HUMAN_DECISION_REQUEST:v1 only for one explicit human-only gate.",
        "- Execution: queue notification only; this workflow does not call a model.",
        "",
        "Required actions:",
        `1. Read Issue #${number} in full, including recent handoffs and dependencies.`,
        `2. Read \`${ROLE_SKILLS[role]}\` and \`docs/agent-governance.md\`.`,
        "3. Do only the work owned by this role and record evidence.",
        `4. Return a versioned \`CODEX_HANDOFF:v1\` to \`${NEXT_ROLES[role]}\`, or return a blocked handoff to \`pm-triage\` only for a named external dependency, missing required input, or explicit human-only gate.`,
        "",
        `Generated at: \`${generatedAt}\``,
        ""
      ].join("\n")
    });
  }
  return { generatedAt, assignments };
}
