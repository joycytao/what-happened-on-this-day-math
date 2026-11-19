import { readFile } from "node:fs/promises";

import { validateDeveloperSkill } from "../src/developer-contract.mjs";

const skill = await readFile(new URL("../skills/developer/SKILL.md", import.meta.url), "utf8");
const result = validateDeveloperSkill(skill);

if (!result.valid) {
  console.error(result.errors.join("\n"));
  process.exit(1);
}

console.log("Developer skill contract passed");
