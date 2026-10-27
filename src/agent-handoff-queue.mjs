import { readFile, writeFile } from "node:fs/promises";

export const AGENT_ROUTES = Object.freeze({
  "agent: pm-triage": { role: "pm-triage", skill: "skills/pm-triage/SKILL.md" },
  "agent: architect": { role: "architect", skill: "skills/architect/SKILL.md" },
  "agent: product-manager": { role: "product-manager", skill: "skills/product-manager/SKILL.md" },
});

export const DECISION_OWNER_ROUTES = Object.freeze({
  "decision-owner: architect": { role: "architect", skill: "skills/architect/SKILL.md" },
  "decision-owner: product-manager": { role: "product-manager", skill: "skills/product-manager/SKILL.md" },
});

export const HANDOFF_TRIGGER_LABELS = new Set([
  "needs-triage",
  "ready-for-agent",
  "status: ready to pickup",
  ...Object.keys(DECISION_OWNER_ROUTES),
]);

export function buildAgentHandoffPlan(event = {}) {
  const issue = event.issue;
  const triggerLabel = event.label?.name;
  if (!issue || issue.pull_request || !HANDOFF_TRIGGER_LABELS.has(triggerLabel)) return null;

  const labels = new Set((issue.labels ?? []).map((label) => typeof label === "string" ? label : label?.name).filter(Boolean));
  const route = resolveRoute(triggerLabel, labels);
  const issueNumber = issue.number;
  const issueUrl = issue.html_url || `https://github.com/${event.repository?.full_name}/issues/${issueNumber}`;
  const markerRole = route?.role || "unrouted";
  const marker = `<!-- codex-agent-handoff:${issueNumber}:${triggerLabel}:${markerRole} -->`;

  if (!route) {
    const reason = triggerLabel === "needs-triage"
      ? "The Issue is ready for triage, but no pm-triage route was resolved."
      : `The trigger label \`${triggerLabel}\` requires exactly one supported \`agent:\` label.`;
    return {
      kind: "blocked",
      marker,
      issueNumber,
      issueUrl,
      triggerLabel,
      addLabels: ["needs-info"],
      body: [
        marker,
        "CODEX_AGENT_HANDOFF_BLOCKED",
        "",
        `Automatic agent handoff is blocked for [#${issueNumber}](${issueUrl}).`,
        "",
        `- Trigger: \`${triggerLabel}\``,
        `- Reason: ${reason}`,
        "- Required action: add exactly one supported `agent:` label, then reapply the trigger label.",
        "- Supported routes: `agent: pm-triage`, `agent: architect`, `agent: product-manager`.",
        "",
        "GitHub Actions only queues this handoff; it does not invoke an external model.",
      ].join("\n"),
    };
  }

  const prompt = [
    `Use the \`${route.role}\` skill.`,
    `Read Issue #${issueNumber} in full, including dependencies and recent comments.`,
    `Read \`${route.skill}\` and \`docs/agent-governance.md\`.`,
    route.role === "pm-triage"
      ? "Create or update the PM triage decision register; assign exactly one Decision Owner per open question and do not invent answers."
      : `Answer only the open questions whose Decision Owner is \`${route.role}\`, with evidence and scope impact.`,
    "Return a concise result that the next agent can consume as a handoff.",
    "Do not change Issue labels or mark the Issue ready to pickup; let pm-triage and the Human Accountable Owner control routing.",
  ].join("\n");

  return {
    kind: "handoff",
    marker,
    issueNumber,
    issueUrl,
    triggerLabel,
    role: route.role,
    skill: route.skill,
    addLabels: ["agent-requested"],
    prompt,
    body: [
      marker,
      "CODEX_AGENT_HANDOFF",
      "",
      `A ${route.role} handoff is queued for [#${issueNumber}](${issueUrl}).`,
      "",
      `- Agent role: \`${route.role}\``,
      `- Skill: \`${route.skill}\``,
      `- Trigger: \`${triggerLabel}\``,
      "- Execution: queue-only — Codex automation must pick up this request; GitHub Actions does not call a model.",
      "",
      "Copy this prompt into Codex or the configured agent runner:",
      "",
      "```text",
      prompt,
      "```",
      "",
      "After the agent responds, have `pm-triage` record the result and update the Issue workflow state.",
    ].join("\n"),
  };
}

function resolveRoute(triggerLabel, labels) {
  if (DECISION_OWNER_ROUTES[triggerLabel]) return DECISION_OWNER_ROUTES[triggerLabel];
  if (triggerLabel === "needs-triage") return AGENT_ROUTES["agent: pm-triage"];

  const routes = [...labels]
    .filter((label) => AGENT_ROUTES[label])
    .map((label) => AGENT_ROUTES[label]);
  return routes.length === 1 ? routes[0] : null;
}

export async function buildPlanFromEventFile(eventPath, outputPath) {
  const event = JSON.parse(await readFile(eventPath, "utf8"));
  const plan = buildAgentHandoffPlan(event);
  await writeFile(outputPath, `${JSON.stringify({ plan }, null, 2)}\n`, "utf8");
  return plan;
}
