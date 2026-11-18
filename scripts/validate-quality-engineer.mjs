import { readFile } from "node:fs/promises";

import { validateQualityEngineerSkill } from "../src/quality-engineer-contract.mjs";

const skill = await readFile(new URL("../skills/quality-engineer/SKILL.md", import.meta.url), "utf8");
const result = validateQualityEngineerSkill(skill);

if (!result.valid) {
  console.error(result.errors.join("\n"));
  process.exit(1);
}

console.log("Quality Engineer skill contract passed");
