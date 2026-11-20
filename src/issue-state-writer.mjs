import { validateReadyForHumanGate } from "./human-gate-integrity.mjs";
import { validateDerivedLabelInvariant } from "./derived-label-reconciliation.mjs";
import crypto from "node:crypto";

function labelNames(labels = []) {
  return labels.map((label) => typeof label === "string" ? label : label?.name).filter(Boolean);
}

function sameLabels(left, right) {
  return left.length === right.length && left.every((label, index) => label === right[index]);
}

function canonicalLabels(labels = []) {
  return labelNames(labels).slice().sort();
}

export function buildTransitionFingerprint({ issueNumber, expectedLabels = [], nextLabels = [], commentFingerprint = "" } = {}) {
  if (!Number.isInteger(Number(issueNumber)) || Number(issueNumber) <= 0) throw new Error("issueNumber is required for a transition fingerprint");
  const payload = JSON.stringify({
    version: "issue-transition-v1",
    issueNumber: Number(issueNumber),
    expectedLabels: canonicalLabels(expectedLabels),
    nextLabels: canonicalLabels(nextLabels),
    commentFingerprint: String(commentFingerprint || ""),
  });
  return `<!-- CODEX_TRANSITION:v1:${crypto.createHash("sha256").update(payload).digest("hex")} -->`;
}

export function planIssueStateTransition({ currentLabels = [], expectedLabels = currentLabels, nextLabels = [], body = "", comments = [] } = {}) {
  const current = labelNames(currentLabels);
  const expected = labelNames(expectedLabels);
  const next = labelNames(nextLabels);
  const errors = [];
  if (!sameLabels(current, expected)) errors.push("state compare-and-swap failed: Issue labels changed since read");
  if (new Set(next).size !== next.length) errors.push("next Issue labels must be unique");
  errors.push(...validateDerivedLabelInvariant(next).errors);
  errors.push(...validateReadyForHumanGate({ labels: next, body, comments }).errors);
  if (errors.length) return { valid: false, errors: [...new Set(errors)], add: [], remove: [], labels: next };
  return {
    valid: true,
    errors: [],
    add: next.filter((label) => !current.includes(label)),
    remove: current.filter((label) => !next.includes(label)),
    labels: next,
  };
}

export async function transitionIssueState({ github, owner, repo, issueNumber, expectedLabels, nextLabels, body, commentBody = null, commentFingerprint = null } = {}) {
  if (!github?.rest?.issues) throw new Error("GitHub client is required");
  if (!Array.isArray(expectedLabels)) throw new Error("expectedLabels is required for every Issue state transition");
  const transitionFingerprint = buildTransitionFingerprint({ issueNumber, expectedLabels, nextLabels, commentFingerprint });
  const issue = await github.rest.issues.get({ owner, repo, issue_number: issueNumber });
  const comments = await github.paginate(github.rest.issues.listComments, { owner, repo, issue_number: issueNumber, per_page: 100 });
  const recorded = comments.some((comment) => String(comment.body ?? "").includes(transitionFingerprint));
  const initialLabels = labelNames(issue.data.labels);
  if (recorded && sameLabels(initialLabels, labelNames(nextLabels))) {
    return { valid: true, errors: [], add: [], remove: [], labels: initialLabels, commentCreated: false, idempotent: true, before: initialLabels, after: initialLabels, transitionFingerprint };
  }

  // Re-read immediately before planning the mutation. A queue audit may have
  // read the Issue before another workflow completed; that transition is stale
  // unless the fresh snapshot still matches the caller's expected labels.
  const freshIssue = await github.rest.issues.get({ owner, repo, issue_number: issueNumber });
  const currentLabels = labelNames(freshIssue.data.labels);
  if (!sameLabels(initialLabels, currentLabels)) throw new Error("stale transition rejected: Issue labels changed during transition preparation");
  const plan = planIssueStateTransition({ currentLabels, expectedLabels, nextLabels, body: body ?? freshIssue.data.body ?? "", comments });
  if (!plan.valid) throw new Error(plan.errors.join("; "));
  if (plan.add.length || plan.remove.length) {
    // GitHub's Issues PATCH endpoint rejects If-Match. The compare-and-swap
    // guard is therefore the fresh expected-label snapshot plus per-Issue
    // workflow concurrency and stale-transition rejection.
    await github.rest.issues.update({ owner, repo, issue_number: issueNumber, labels: plan.labels });
  }
  let commentCreated = false;
  const markerBody = commentBody ? `${transitionFingerprint}\n${commentBody}` : null;
  if (markerBody && (!commentFingerprint || !comments.some((comment) => String(comment.body ?? "").includes(commentFingerprint)))) {
    await github.rest.issues.createComment({ owner, repo, issue_number: issueNumber, body: markerBody });
    commentCreated = true;
  }
  return { ...plan, commentCreated, before: currentLabels, after: plan.labels, transitionFingerprint, idempotent: false };
}
