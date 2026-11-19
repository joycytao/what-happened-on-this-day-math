import { readFile } from "node:fs/promises";

import { validateReadyForHumanGate } from "../src/human-gate-integrity.mjs";

const router = await readFile(new URL("../.github/workflows/handoff-router.yml", import.meta.url), "utf8");
const prHandoff = await readFile(new URL("../.github/workflows/pr-handoff.yml", import.meta.url), "utf8");
const errors = [];
if (!router.includes("HUMAN_DECISION_REQUEST:v1")) errors.push("handoff router must verify human decision requests");
if (!router.includes("routine")) errors.push("handoff router must reject routine human gates");
if (!/\|\| 'routine'/.test(router)) errors.push("handoff router must fail closed when Review gate is missing");
if (/\|\| 'final-merge'/.test(router)) errors.push("handoff router must not infer final-merge from a missing Review gate");
if (!prHandoff.includes("Review gate: final-merge")) errors.push("PR handoff must require explicit final-merge for operational gates");
if (!prHandoff.includes("HUMAN_DECISION_REQUEST:v1")) errors.push("PR handoff must verify human decision requests");
if (!/\|\| 'routine'/.test(prHandoff)) errors.push("PR handoff must fail closed when Review gate is missing");
if (/\|\| 'final-merge'/.test(prHandoff)) errors.push("PR handoff must not infer final-merge from a missing Review gate");
if (validateReadyForHumanGate({ labels: ["ready-for-human"], body: "Review gate: routine" }).valid) errors.push("routine ready-for-human must fail closed");
if (!validateReadyForHumanGate({ labels: ["ready-for-human"], body: "Review gate: final-merge" }).valid) errors.push("final-merge must be accepted");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Human gate integrity contract passed");
