import { validateReadyForHumanGate } from "./human-gate-integrity.mjs";
import { validateDerivedLabelInvariant } from "./derived-label-reconciliation.mjs";

function labelNames(labels = []) {
  return labels.map((label) => typeof label === "string" ? label : label?.name).filter(Boolean);
}

function sameLabels(left, right) {
  return left.length === right.length && left.every((label, index) => label === right[index]);
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
  const issue = await github.rest.issues.get({ owner, repo, issue_number: issueNumber });
  const currentLabels = labelNames(issue.data.labels);
  const comments = await github.paginate(github.rest.issues.listComments, { owner, repo, issue_number: issueNumber, per_page: 100 });
  const plan = planIssueStateTransition({ currentLabels, expectedLabels: expectedLabels ?? currentLabels, nextLabels, body: body ?? issue.data.body ?? "", comments });
  if (!plan.valid) throw new Error(plan.errors.join("; "));
  if (plan.add.length || plan.remove.length) {
    // GitHub's Issues PATCH endpoint rejects If-Match. The compare-and-swap
    // guard is the exact label snapshot plus the canonical repository-wide
    // serialized workflow concurrency lock required by every caller.
    await github.rest.issues.update({ owner, repo, issue_number: issueNumber, labels: plan.labels });
  }
  let commentCreated = false;
  if (commentBody && (!commentFingerprint || !comments.some((comment) => String(comment.body ?? "").includes(commentFingerprint)))) {
    await github.rest.issues.createComment({ owner, repo, issue_number: issueNumber, body: commentBody });
    commentCreated = true;
  }
  return { ...plan, commentCreated, before: currentLabels, after: plan.labels };
}
