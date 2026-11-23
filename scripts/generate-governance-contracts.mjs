import { mkdir, readFile, writeFile } from "node:fs/promises";

const schema = JSON.parse(await readFile("governance/governance-schema.json", "utf8"));
const lines = [
  "<!-- GENERATED FILE: run `node scripts/generate-governance-contracts.mjs`; edit governance/governance-schema.json instead. -->",
  "",
  `# Generated governance contract (schema v${schema.schemaVersion})`,
  "",
  `- Owners: ${schema.owners.map((role) => `\`agent: ${role}\``).join(", ")}`,
  `- Statuses: ${schema.statuses.map((status) => `\`status: ${status}\``).join(", ")}`,
  `- Handoff statuses: ${schema.handoffStatuses.map((status) => `\`${status}\``).join(", ")}`,
  `- Human gate: \`${schema.humanGate.label}\` with subtypes ${schema.humanGate.subtypes.map((subtype) => `\`${subtype}\``).join(", ")}`,
  `- Verification scopes: ${schema.verificationScopes.map((scope) => `\`${scope}\``).join(", ")}`,
  "",
  "## Role contracts",
  "",
  "| Role | Output kind | Legal targets | Return paths |",
  "|---|---|---|---|",
  ...Object.entries(schema.roles).map(([role, contract]) => `| \`${role}\` | \`${contract.outputKind}\` | ${contract.targets.map((target) => `\`${target}\``).join(", ")} | ${contract.returnPaths.map((path) => `\`${path}\``).join(", ")} |`),
  "",
  "## Repository-wide verification",
  "",
  `- Workflow: \`${schema.verification.workflow}\``,
  ...schema.verification.requiredCommands.map((command) => `- Required command: \`${command}\``),
  "",
];

await mkdir("docs/generated", { recursive: true });
await writeFile("docs/generated/governance-contract.md", lines.join("\n"));
console.log("Generated docs/generated/governance-contract.md from governance/governance-schema.json");
