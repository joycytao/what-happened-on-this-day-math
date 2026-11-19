import { readFile } from "node:fs/promises";

import { validateSocialExpertSkill } from "../src/social-expert-contract.mjs";

const skill = await readFile(new URL("../skills/social-expert/SKILL.md", import.meta.url), "utf8");
const result = validateSocialExpertSkill(skill);

if (!result.valid) {
  console.error(result.errors.join("\n"));
  process.exit(1);
}

console.log("Social expert skill contract passed");
