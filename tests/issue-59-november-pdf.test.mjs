import assert from "node:assert/strict";
import test from "node:test";

import { readFile } from "node:fs/promises";

test("Issue #59 release tooling declares the independent 123-page contract", async () => {
  const assembler = await readFile(new URL("../scripts/assemble-november-pdf.py", import.meta.url), "utf8");
  const validator = await readFile(new URL("../scripts/validate-november-release.mjs", import.meta.url), "utf8");
  assert.match(assembler, /range\(1, 31\)/);
  assert.match(assembler, /len\(paths\) == 123/);
  assert.match(validator, /expectedPageCount: 123/);
  assert.match(validator, /level1.*level2.*level3/);
});
