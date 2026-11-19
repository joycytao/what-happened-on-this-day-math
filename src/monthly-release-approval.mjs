const RELEASE_IDENTITY_PATTERN = /\b[a-f0-9]{64}\b/i;

export function parseReleaseIdentity(commentBody = "") {
  const match = String(commentBody).match(/^- Release identity:\s*`?([a-f0-9]{64})`?\s*$/im);
  return match?.[1]?.toLowerCase() || null;
}

export function findReleaseApproval(comments = [], releaseIdentity) {
  const expected = String(releaseIdentity || "").toLowerCase();
  if (!RELEASE_IDENTITY_PATTERN.test(expected)) return { approved: false, comment: null };
  const comment = comments.find((candidate) => {
    const body = String(candidate?.body || "");
    return /^HUMAN_APPROVAL:v1\b/m.test(body) && parseReleaseIdentity(body) === expected;
  }) || null;
  return { approved: Boolean(comment), comment };
}
