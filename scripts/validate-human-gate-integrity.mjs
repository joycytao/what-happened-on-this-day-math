import { readFile } from "node:fs/promises";

import { validateReadyForHumanGate } from "../src/human-gate-integrity.mjs";

const router = await readFile(new URL("../.github/workflows/handoff-router.yml", import.meta.url), "utf8");
const prHandoff = await readFile(new URL("../.github/workflows/pr-handoff.yml", import.meta.url), "utf8");
const tptWorkstream = await readFile(new URL("../.github/workflows/tpt-workstream.yml", import.meta.url), "utf8");
const errors = [];
if (!router.includes("validateReadyForHumanGate")) errors.push("handoff router must call the gate integrity validator before adding ready-for-human");
if (!router.includes("'ready-for-human']")) errors.push("handoff router must validate the prospective ready-for-human label set");
if (!prHandoff.includes("validateReadyForHumanGate")) errors.push("PR handoff must call the gate integrity validator before adding ready-for-human");
if (!prHandoff.includes("'ready-for-human']")) errors.push("PR handoff must validate the prospective ready-for-human label set");
if (!router.includes("src/human-gate-integrity.mjs")) errors.push("handoff router must load the shared gate integrity validator");
if (!prHandoff.includes("src/human-gate-integrity.mjs")) errors.push("PR handoff must load the shared gate integrity validator");
if (!tptWorkstream.includes("validateReadyForHumanGate")) errors.push("TPT workstream must call the gate integrity validator before adding ready-for-human");
if (!tptWorkstream.includes("Review gate: final-product")) errors.push("TPT workstream must declare its human product gate");
if (!tptWorkstream.includes("tpt-human-gate-request:v1")) errors.push("TPT workstream must create an idempotent human decision request");
if (validateReadyForHumanGate({ labels: ["ready-for-human"], body: "Review gate: routine" }).valid) errors.push("routine ready-for-human must fail closed");
if (!validateReadyForHumanGate({ labels: ["ready-for-human"], body: "Review gate: final-merge" }).valid) errors.push("final-merge must be accepted");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Human gate integrity contract passed");
