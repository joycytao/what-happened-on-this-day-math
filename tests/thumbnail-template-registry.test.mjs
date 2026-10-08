import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const registryPath = "references /thumbnail-assets/template-registry.json";
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

test("registry covers every canonical thumbnail reference", () => {
  assert.deepEqual(Object.keys(registry.templates).sort(), ["cover", "daily_practice", "different_math", "landing_page", "whats_included"]);
});

for (const [name, entry] of Object.entries(registry.templates)) {
  test(`registry checksum matches ${name} reference`, () => {
    const actual = crypto.createHash("sha256").update(fs.readFileSync(entry.reference)).digest("hex");
    assert.equal(actual, entry.sha256);
    assert.match(entry.version, /^v\d+\.\d+\.\d+$/);
  });
}
