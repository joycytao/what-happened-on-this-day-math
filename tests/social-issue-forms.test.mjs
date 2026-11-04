import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const forms = [
  ["social-before-after-reel.yml", "social:product-reel"],
  ["social-perspective-sharing-reel.yml", "social:product-reel"],
  ["social-product-reel.yml", "social:product-reel"],
  ["social-campaign-reminder-reel.yml", "social:product-reel"],
  ["social-learning-system-carousel.yml", "social:carousel"],
  ["social-clean-worksheet-carousel.yml", "social:carousel"],
  ["social-perspective-carousel.yml", "social:carousel"],
  ["social-product-carousel.yml", "social:carousel"],
];

test("all eight social forms contain shared readiness fields and template labels", () => {
  for (const [filename, label] of forms) {
    const content = fs.readFileSync(`.github/ISSUE_TEMPLATE/${filename}`, "utf8");
    assert.match(content, /name:/, filename);
    assert.match(content, /id: month_cycle/, filename);
    assert.match(content, /id: asset_resources/, filename);
    assert.match(content, /id: asset_source/, filename);
    assert.match(content, /id: asset_usage_notes/, filename);
    assert.match(content, /id: expected_output/, filename);
    assert.match(content, /id: cta_destination/, filename);
    assert.match(content, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), filename);
    assert.match(content, /status: pending review/, filename);
    assert.match(content, /external, student, customer, personal, or third-party/i, filename);
  }
});

test("each form requires its shared fields", () => {
  for (const [filename] of forms) {
    const content = fs.readFileSync(`.github/ISSUE_TEMPLATE/${filename}`, "utf8");
    for (const field of ["month_cycle", "asset_resources", "asset_source", "asset_usage_notes", "expected_output", "cta_destination"]) {
      const section = content.slice(content.indexOf(`id: ${field}`), content.indexOf("\n  - type:", content.indexOf(`id: ${field}`) + 1) === -1 ? content.length : content.indexOf("\n  - type:", content.indexOf(`id: ${field}`) + 1));
      assert.match(section, /required: true/, `${filename}:${field}`);
    }
  }
});
