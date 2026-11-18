import { readFile } from "node:fs/promises";

import { validatePmTriageSkill } from "../src/pm-triage-contract.mjs";

const skill = await readFile(new URL("../skills/pm-triage/SKILL.md", import.meta.url), "utf8");
const result = validatePmTriageSkill(skill);

if (!result.valid) {
  console.error(result.errors.join("\n"));
  process.exit(1);
}

console.log("PM triage skill contract passed");
