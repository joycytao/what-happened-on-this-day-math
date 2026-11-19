import { readFile } from "node:fs/promises";

import { validateProductManagerSkill } from "../src/product-manager-contract.mjs";

const skill = await readFile(new URL("../skills/product-manager/SKILL.md", import.meta.url), "utf8");
const result = validateProductManagerSkill(skill);

if (!result.valid) {
  console.error(result.errors.join("\n"));
  process.exit(1);
}

console.log("Product Manager skill contract passed");
