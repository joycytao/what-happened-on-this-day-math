import { readFile } from "node:fs/promises";

import { validateArchitectSkill } from "../src/architect-contract.mjs";

const skill = await readFile(new URL("../skills/architect/SKILL.md", import.meta.url), "utf8");
const result = validateArchitectSkill(skill);

if (!result.valid) {
  console.error(result.errors.join("\n"));
  process.exit(1);
}

console.log("Architect skill contract passed");
