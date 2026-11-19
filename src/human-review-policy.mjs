export const HUMAN_DECISION_GATES = Object.freeze([
  "ui-design",
  "final-copy",
  "final-product",
  "credentials",
  "public-dispatch",
]);

export const OPERATIONAL_GATES = Object.freeze(["final-merge"]);
export const ALL_REVIEW_GATES = Object.freeze([...HUMAN_DECISION_GATES, ...OPERATIONAL_GATES]);

export const ROUTINE_REVIEW_GATE = "routine";

export function classifyHumanReview({ reviewGate = ROUTINE_REVIEW_GATE } = {}) {
  if (reviewGate !== ROUTINE_REVIEW_GATE && !ALL_REVIEW_GATES.includes(reviewGate)) {
    throw new Error(`unsupported review gate: ${reviewGate}`);
  }

  return {
    reviewGate,
    humanDecisionRequired: HUMAN_DECISION_GATES.includes(reviewGate),
    humanActionRequired: reviewGate !== ROUTINE_REVIEW_GATE,
    reason: reviewGate === ROUTINE_REVIEW_GATE
      ? "routine work proceeds from deterministic validation and QA without content review"
      : reviewGate === "final-merge"
        ? "explicit final-merge action required"
        : `explicit ${reviewGate} decision required`,
  };
}
