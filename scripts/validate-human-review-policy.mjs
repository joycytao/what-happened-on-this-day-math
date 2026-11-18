import { classifyHumanReview } from "../src/human-review-policy.mjs";

const routine = classifyHumanReview();
if (routine.humanDecisionRequired) {
  throw new Error("routine work must not require a human decision");
}

for (const reviewGate of ["ui-design", "final-copy", "final-product", "credentials", "public-dispatch", "final-merge"]) {
  const result = classifyHumanReview({ reviewGate });
  if (reviewGate !== "final-merge" && !result.humanDecisionRequired) {
    throw new Error(`${reviewGate} must require a human decision`);
  }
  if (reviewGate === "final-merge" && !result.humanActionRequired) throw new Error("final-merge must require a human action");
}

console.log("Human review policy passed");
