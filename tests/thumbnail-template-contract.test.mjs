import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const contract = JSON.parse(fs.readFileSync("examples/thumbnail-template-contract.example.json", "utf8"));

test("template contract defines all five thumbnail types at 1260x1260", () => {
  assert.deepEqual(Object.keys(contract.templates).sort(), ["cover", "daily_practice", "different_math", "landing_page", "whats_included"]);
  for (const [name, template] of Object.entries(contract.templates)) {
    assert.match(template.version, /^v\d+\.\d+\.\d+$/);
    assert.deepEqual(template.canvas, { width: 1260, height: 1260 }, name);
    assert.ok(Object.keys(template.fixed_regions).length > 0, name);
    assert.ok(Object.keys(template.variable_regions).length > 0, name);
    assert.ok(template.layout.z_order.length > 0, name);
  }
});

test("daily practice contract preserves the borderless worksheet policy", () => {
  assert.equal(contract.templates.daily_practice.layout.border_policy, "none");
  assert.equal(contract.templates.daily_practice.layout.shadow, true);
});

test("landing page contract records left-anchored crop behavior", () => {
  assert.equal(contract.templates.landing_page.layout.crop_anchor, "left");
  assert.equal(contract.templates.landing_page.layout.border_policy, "none");
});
