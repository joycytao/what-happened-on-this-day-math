import { HUMAN_DECISION_GATES, OPERATIONAL_GATES, classifyHumanReview } from "./human-review-policy.mjs";

export const HUMAN_DECISION_REQUEST_MARKER = "HUMAN_DECISION_REQUEST:v1";

function labelsOf(labels = []) {
  return labels.map((label) => typeof label === "string" ? label : label?.name).filter(Boolean);
}

export function reviewGateFromBody(body = "") {
  return String(body).match(/^Review gate:\s*([a-z-]+)\s*$/im)?.[1]?.toLowerCase() || "routine";
}

export function humanDecisionRequests(comments = []) {
  return comments.filter((comment) => String(comment?.body ?? "").includes(HUMAN_DECISION_REQUEST_MARKER));
}

export function validateReadyForHumanGate({ labels = [], body = "", comments = [] } = {}) {
  const names = labelsOf(labels);
  if (!names.includes("ready-for-human")) return { valid: true, errors: [], reviewGate: reviewGateFromBody(body), requestCount: 0 };

  const reviewGate = reviewGateFromBody(body);
  const errors = [];
  let requestCount = 0;
  try {
    classifyHumanReview({ reviewGate });
  } catch (error) {
    errors.push(error.message);
  }
  if (reviewGate === "routine") {
    errors.push("ready-for-human requires HUMAN_DECISION_REQUEST:v1 or Review gate: final-merge");
  } else if (HUMAN_DECISION_GATES.includes(reviewGate)) {
    requestCount = humanDecisionRequests(comments).length;
    if (requestCount !== 1) errors.push(`${reviewGate} requires exactly one HUMAN_DECISION_REQUEST:v1 comment`);
  } else if (!OPERATIONAL_GATES.includes(reviewGate)) {
    errors.push(`ready-for-human has unsupported gate: ${reviewGate}`);
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)], reviewGate, requestCount };
}
