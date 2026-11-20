import { HUMAN_DECISION_GATES, OPERATIONAL_GATES, classifyHumanReview } from "./human-review-policy.mjs";

export const HUMAN_DECISION_REQUEST_MARKER = "HUMAN_DECISION_REQUEST:v1";
export const HUMAN_GATE_SUBTYPE_FIELD = "Human gate subtype";
export const HUMAN_GATE_SUBTYPES = Object.freeze(["human-decision", "final-merge"]);

function labelsOf(labels = []) {
  return labels.map((label) => typeof label === "string" ? label : label?.name).filter(Boolean);
}

export function reviewGateFromBody(body = "") {
  return String(body).match(/^Review gate:\s*([a-z-]+)\s*$/im)?.[1]?.toLowerCase() || "routine";
}

export function humanGateSubtypeFromBody(body = "") {
  const explicit = String(body).match(/^Human gate subtype:\s*([a-z-]+)\s*$/im)?.[1]?.toLowerCase() || null;
  if (explicit) return { subtype: explicit, source: "explicit" };
  const reviewGate = reviewGateFromBody(body);
  if (reviewGate === "final-merge") return { subtype: "final-merge", source: "derived-from-review-gate" };
  if (HUMAN_DECISION_GATES.includes(reviewGate)) return { subtype: "human-decision", source: "derived-from-review-gate" };
  return { subtype: null, source: "missing" };
}

export function humanDecisionRequests(comments = []) {
  return comments.filter((comment) => String(comment?.body ?? "").includes(HUMAN_DECISION_REQUEST_MARKER));
}

export function validateReadyForHumanGate({ labels = [], body = "", comments = [] } = {}) {
  const names = labelsOf(labels);
  if (!names.includes("ready-for-human")) return { valid: true, errors: [], reviewGate: reviewGateFromBody(body), requestCount: 0 };

  const reviewGate = reviewGateFromBody(body);
  const gateSubtype = humanGateSubtypeFromBody(body);
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
  if (gateSubtype.subtype && !HUMAN_GATE_SUBTYPES.includes(gateSubtype.subtype)) errors.push(`ready-for-human has unsupported gate subtype: ${gateSubtype.subtype}`);
  const expectedSubtype = reviewGate === "final-merge" ? "final-merge" : HUMAN_DECISION_GATES.includes(reviewGate) ? "human-decision" : null;
  if (gateSubtype.source === "explicit" && expectedSubtype && gateSubtype.subtype !== expectedSubtype) errors.push(`human gate subtype ${gateSubtype.subtype} does not match Review gate ${reviewGate}`);
  return { valid: errors.length === 0, errors: [...new Set(errors)], reviewGate, gateSubtype: gateSubtype.subtype, gateSubtypeSource: gateSubtype.source, requestCount };
}
