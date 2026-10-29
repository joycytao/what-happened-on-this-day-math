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

function labelsFor(issue) {
  return new Set((issue?.labels ?? []).map((label) => typeof label === "string" ? label : label?.name).filter(Boolean));
}

export function isScheduledEligible(issue, role) {
  const labels = labelsFor(issue);
  if (!issue || issue.pullRequest || issue.pull_request) return false;
  if ([...labels].filter((label) => label.startsWith("agent: ")).length !== 1) return false;
  if (labels.has("state: paused") || labels.has("state: blocked") || labels.has("status: blocked")) return false;
  if (labels.has("state: claimed") || labels.has("state: implementation")) return false;
  if (labels.has("state: changes-requested") && role !== "developer") return false;
  if (labels.has("state: qa") && role !== "quality-engineer") return false;
  if (role === "developer") return labels.has("status: ready to pickup") && labels.has("agent: developer");
  if (["product-manager", "architect", "social-expert"].includes(role)) {
    return labels.has(`agent: ${role}`) && labels.has("state: decision-requested");
  }
  if (role === "quality-engineer") return labels.has("agent: quality-engineer") && labels.has("state: qa");
  if (role === "pm-triage") return labels.has("agent: pm-triage") && (labels.has("state: blocked") || labels.has("state: decision-complete"));
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
        "- Execution: queue notification only; this workflow does not call a model.",
        "",
        "Required actions:",
        `1. Read Issue #${number} in full, including recent handoffs and dependencies.`,
        `2. Read \`${ROLE_SKILLS[role]}\` and \`docs/agent-governance.md\`.`,
        "3. Do only the work owned by this role and record evidence.",
        `4. Return a versioned \`CODEX_HANDOFF:v1\` to \`${NEXT_ROLES[role]}\`, or return a blocked handoff to \`pm-triage\`.`,
        "",
        `Generated at: \`${generatedAt}\``,
        ""
      ].join("\n")
    });
  }
  return { generatedAt, assignments };
}
