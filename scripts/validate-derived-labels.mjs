import fs from "node:fs";

import { reconcileDerivedLabels, validateDerivedLabelInvariant } from "../src/derived-label-reconciliation.mjs";

const errors = [];
const clean = reconcileDerivedLabels(["type: feature", "agent: developer", "status: ready to pickup"]);
if (!clean.valid) errors.push(...clean.errors);
const stale = reconcileDerivedLabels(["type: feature", "agent: developer", "agent-requested", "status:ready to pickup"]);
if (!stale.valid || stale.labels.includes("agent-requested") || stale.labels.includes("status:ready to pickup")) {
  errors.push("stale derived labels were not reconciled");
}
const conflict = validateDerivedLabelInvariant(["agent: developer", "agent: quality-engineer", "status: qa"]);
if (conflict.valid) errors.push("conflicting owner labels must fail closed");
const ownerlessReady = validateDerivedLabelInvariant(["status: ready to pickup"]);
if (ownerlessReady.valid) errors.push("ready-to-pickup without an owner must fail closed");

for (const file of [
  ".github/workflows/agent-handoff-queue.yml",
  ".github/workflows/handoff-router.yml",
  ".github/workflows/pr-handoff.yml",
  ".github/workflows/social-dependency-unblock.yml",
  ".github/workflows/social-monthly-queue.yml",
  ".github/workflows/social-utility-queue.yml",
]) {
  const source = fs.readFileSync(file, "utf8");
  if (/addLabels\([\s\S]{0,220}agent-requested/.test(source)) errors.push(`${file} re-adds agent-requested`);
  if (/labels:\s*\[[^\]]*status:(?:pending review|blocked|ready to pickup|qa|paused|ready to dispatch|done)'?\s*[,\]]/.test(source)) {
    errors.push(`${file} emits an unspaced status label`);
  }
}

for (const name of fs.readdirSync(".github/workflows").filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))) {
  const file = `.github/workflows/${name}`;
  const source = fs.readFileSync(file, "utf8");
  if (/addLabels\([\s\S]{0,240}status: ready to pickup/.test(source)) {
    errors.push(`${file} adds ready-to-pickup incrementally; use one complete labels replacement`);
  }
  for (const match of source.matchAll(/labels:\s*\[([^\]]*status: ready to pickup[^\]]*)\]/g)) {
    if (!/agent:\s*(?:pm-triage|product-manager|architect|social-expert|developer|quality-engineer)/.test(match[1])) {
      errors.push(`${file} creates ready-to-pickup without a unique owner in the same label bundle`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Derived-label reconciliation invariant passed");
