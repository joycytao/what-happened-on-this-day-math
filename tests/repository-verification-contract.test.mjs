import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("repository verification workflow requires locked install, full tests, visual/PDF checks, and governance", () => {
  const workflow = readFileSync(".github/workflows/repository-verification.yml", "utf8");
  for (const required of ["npm ci", "npm test", "npm run verification:visual-pdf", "npm run governance:validate", "python -m pip install", "sudo apt-get install --yes poppler-utils", "npx playwright install --with-deps chromium", "sudo mkdir -p /private/tmp", "TMPDIR: /private/tmp"]) {
    assert.ok(workflow.includes(required), `missing ${required}`);
  }
});
