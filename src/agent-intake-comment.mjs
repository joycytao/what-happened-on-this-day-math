export const AGENT_INTAKE_MARKER = "<!-- codex-agent-intake -->";
export const AGENT_INTAKE_FINGERPRINT_VERSION = "v1";

export function agentIntakeFingerprint(issueNumber) {
  if (!Number.isInteger(Number(issueNumber)) || Number(issueNumber) < 1) {
    throw new Error("issueNumber must be a positive integer");
  }
  return `<!-- codex-agent-intake:${AGENT_INTAKE_FINGERPRINT_VERSION}:issue-${Number(issueNumber)} -->`;
}

export function findAgentIntakeComments(comments = [], issueNumber) {
  const fingerprint = agentIntakeFingerprint(issueNumber);
  return comments.filter((comment) => {
    const body = String(comment?.body ?? "");
    return body.includes(fingerprint) || body.includes(AGENT_INTAKE_MARKER);
  });
}

export function buildAgentIntakeComment(issueNumber, body) {
  const fingerprint = agentIntakeFingerprint(issueNumber);
  const source = String(body ?? "").replace(/^<!-- codex-agent-intake(?::[^>]+)? -->\n?/, "");
  return `${fingerprint}\n${AGENT_INTAKE_MARKER}\n${source}`;
}

export function intakeCommentPlan(comments = [], issueNumber, body) {
  const existing = findAgentIntakeComments(comments, issueNumber);
  const nextBody = buildAgentIntakeComment(issueNumber, body);
  if (existing.length === 0) return { action: "create", body: nextBody, existing };
  const primary = existing[0];
  if (String(primary.body ?? "") === nextBody) return { action: "noop", body: nextBody, existing };
  return { action: "update", body: nextBody, commentId: primary.id, existing };
}
