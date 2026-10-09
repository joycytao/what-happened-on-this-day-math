import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildProductReelStory, findProductReelStory, validateProductConfirmedInput } from "../src/product-confirmed-handoff.mjs";

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "product-confirmed-") );
  fs.mkdirSync(path.join(root, "output"), { recursive: true });
  for (const name of ["packet.pdf", "cover.png", "whats-included.png", "different-math.png", "daily-practice.png"]) fs.writeFileSync(path.join(root, "output", name), `${name}\n`);
  const pdfPath = path.join(root, "output/packet.pdf");
  const input = {
    schema_version: "product-confirmed/v1",
    event: "product.confirmed",
    handoff_id: "what-happened-on-this-day-math:november:reel",
    product_id: "what-happened-on-this-day-math",
    month: "November",
    product_title: "November Morning Work Math",
    tpt_url: "https://www.teacherspayteachers.com/Product/november",
    month_redirect_url: "https://www.6pm-studio.com/go/november",
    source_revision: "a".repeat(40),
    pdf: { path: "output/packet.pdf", sha256: crypto.createHash("sha256").update(fs.readFileSync(pdfPath)).digest("hex"), page_count: 125 },
    preview_image_path: "output/cover.png",
    worksheet_asset_paths: ["output/whats-included.png", "output/different-math.png", "output/daily-practice.png"],
    template: { template_id: "reel-v1", template_version: "1.0.0" },
    approval: { label: "status: ready to dispatch", issue_number: 163 }
  };
  return { root, input };
}

test("validates the product-confirmed/v1 payload against real repository files", () => {
  const { root, input } = fixture();
  const result = validateProductConfirmedInput(input, { root });
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.payload.template.template_id, "reel-v1");
});

test("builds an idempotent actionable Product Reel story with complete payload", () => {
  const { root, input } = fixture();
  const result = buildProductReelStory(input, { root });
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.deepEqual(result.labels, ["status: ready to pickup", "type: feature"]);
  assert.match(result.story, /<!-- product-handoff-id: what-happened-on-this-day-math:november:reel -->/);
  assert.match(result.story, /product-confirmed\/v1/);
  assert.match(result.story, /reel-v1/);
  assert.equal(findProductReelStory([{ number: 7, body: result.story }], input.handoff_id).number, 7);
});

test("fails closed with named errors for unapproved or stale handoffs", () => {
  const { root, input } = fixture();
  const result = validateProductConfirmedInput({ ...input, approval: { label: "status: draft", issue_number: 163 }, pdf: { ...input.pdf, sha256: "0".repeat(64) } }, { root });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /approval_label_missing/);
  assert.match(result.errors.join("\n"), /pdf_checksum_mismatch/);
});
