import { readFile } from "node:fs/promises";
import { validatePmTriageAuditSkill } from "../src/pm-triage-audit-contract.mjs";

const skill = await readFile(new URL("../skills/pm-triage/SKILL.md", import.meta.url), "utf8");
const result = validatePmTriageAuditSkill(skill);
if (!result.valid) {
  console.error(result.errors.join("\n"));
  process.exit(1);
}
console.log("PM triage proactive audit contract passed");
