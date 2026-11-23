import { readFileSync } from "node:fs";

const schemaPath = new URL("../governance/governance-schema.json", import.meta.url);
export const GOVERNANCE_SCHEMA = Object.freeze(JSON.parse(readFileSync(schemaPath, "utf8")));
export const AGENT_ROLES = Object.freeze([...GOVERNANCE_SCHEMA.owners]);
export const HANDOFF_TARGETS = Object.freeze([...AGENT_ROLES, GOVERNANCE_SCHEMA.humanGate.label]);
export const HANDOFF_STATUSES = Object.freeze([...GOVERNANCE_SCHEMA.handoffStatuses]);
export const GOVERNANCE_OWNERS = new Set(AGENT_ROLES.map((role) => `agent: ${role}`));
export const GOVERNANCE_STATUSES = new Set(GOVERNANCE_SCHEMA.statuses.map((status) => `status: ${status}`));
export const HUMAN_GATE_LABEL = GOVERNANCE_SCHEMA.humanGate.label;
export const HUMAN_GATE_SUBTYPES = Object.freeze([...GOVERNANCE_SCHEMA.humanGate.subtypes]);

export function roleOutputContract(role) {
  return GOVERNANCE_SCHEMA.roles[role] || null;
}
