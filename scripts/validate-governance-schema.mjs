import { readFileSync } from "node:fs";
import { GOVERNANCE_SCHEMA, AGENT_ROLES, HANDOFF_TARGETS, HANDOFF_STATUSES, roleOutputContract } from "../src/governance-schema.mjs";

const errors = [];
const schema = JSON.parse(readFileSync("governance/governance-schema.json", "utf8"));
const generated = readFileSync("docs/generated/governance-contract.md", "utf8");
if (JSON.stringify(schema) !== JSON.stringify(GOVERNANCE_SCHEMA)) errors.push("runtime schema does not match canonical JSON schema");
if (AGENT_ROLES.length !== new Set(AGENT_ROLES).size) errors.push("owners must be unique");
if (HANDOFF_STATUSES.length !== new Set(HANDOFF_STATUSES).size) errors.push("handoff statuses must be unique");
if (!HANDOFF_TARGETS.includes(schema.humanGate.label)) errors.push("human gate must be a handoff target");
for (const role of AGENT_ROLES) {
  const contract = roleOutputContract(role);
  if (!contract?.outputKind || !contract.targets?.length || !contract.returnPaths?.length) errors.push(`${role} role contract is incomplete`);
  for (const target of contract?.targets || []) if (!HANDOFF_TARGETS.includes(target)) errors.push(`${role} has invalid target ${target}`);
  for (const path of contract?.returnPaths || []) if (!HANDOFF_TARGETS.includes(path)) errors.push(`${role} has invalid return path ${path}`);
}
for (const command of schema.verification.requiredCommands) if (!generated.includes(`\`${command}\``)) errors.push(`generated documentation is missing ${command}`);
if (!generated.includes(`schema v${schema.schemaVersion}`)) errors.push("generated documentation is stale");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`Canonical governance schema passed for ${AGENT_ROLES.length} roles`);
