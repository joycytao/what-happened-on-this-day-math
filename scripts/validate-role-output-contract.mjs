#!/usr/bin/env node
import { AGENT_ROLES } from "../src/agent-handoff.mjs";
import { ROLE_OUTPUT_KINDS, validateRoleOutput } from "../src/role-output-contract.mjs";

const examples = [
  { from: "pm-triage", to: "developer", status: "completed", outputKind: ROLE_OUTPUT_KINDS["pm-triage"], returnPath: "pm-triage", completed: ["triage complete"], blockers: ["none"], prerequisitesSatisfied: ["inputs complete"], prerequisitesMissing: [] },
  { from: "product-manager", to: "pm-triage", status: "completed", outputKind: ROLE_OUTPUT_KINDS["product-manager"], returnPath: "pm-triage", completed: ["decision recorded"], blockers: ["none"], prerequisitesSatisfied: ["decision evidence recorded"], prerequisitesMissing: [] },
  { from: "architect", to: "pm-triage", status: "completed", outputKind: ROLE_OUTPUT_KINDS.architect, returnPath: "pm-triage", completed: ["architecture recorded"], blockers: ["none"], prerequisitesSatisfied: ["technical evidence recorded"], prerequisitesMissing: [] },
  { from: "social-expert", to: "pm-triage", status: "completed", outputKind: ROLE_OUTPUT_KINDS["social-expert"], returnPath: "pm-triage", completed: ["social decision recorded"], blockers: ["none"], prerequisitesSatisfied: ["source and platform evidence recorded"], prerequisitesMissing: [] },
  { from: "developer", to: "quality-engineer", status: "completed", outputKind: ROLE_OUTPUT_KINDS.developer, returnPath: "pm-triage", completed: ["PR opened"], blockers: ["none"], prerequisitesSatisfied: ["inputs and dependencies verified"], prerequisitesMissing: [] },
  { from: "quality-engineer", to: "ready-for-human", status: "completed", outputKind: ROLE_OUTPUT_KINDS["quality-engineer"], returnPath: "developer", completed: ["QA passed"], blockers: ["none"], prerequisitesSatisfied: ["all checks passed"], prerequisitesMissing: [] },
];

const errors = [];
if (Object.keys(ROLE_OUTPUT_KINDS).length !== AGENT_ROLES.length) errors.push("every role must have exactly one output kind");
for (const example of examples) {
  const result = validateRoleOutput(example);
  if (!result.valid) errors.push(`${example.from}: ${result.errors.join(", ")}`);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("Unified role-output contract passed");
