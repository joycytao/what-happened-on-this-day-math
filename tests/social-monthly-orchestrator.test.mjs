import test from "node:test";
import assert from "node:assert/strict";
import { buildMonthlySocialRunPlan } from "../src/social-monthly-orchestrator.mjs";

const row = (overrides = {}) => ({
  contentId: "reel-01",
  contentType: "Reel",
  templateId: "reel-v1",
  trigger: "START",
  publicationDate: "2026-12-03",
  assetPaths: ["assets/cover.png"],
  hook: "A hook",
  caption: "A caption",
  hashtags: ["#math"],
  ...overrides,
});

test("maps supported template IDs to explicit generators", () => {
  const result = buildMonthlySocialRunPlan({
    month: "2026-12",
    rows: [row(), row({ contentId: "carousel-01", contentType: "Carousel", templateId: "carousel-v1", publicationDate: "2026-12-01" })],
    outputRoot: "reports/social",
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.rows.map((item) => item.generator), ["product-carousel", "product-reel"]);
  assert.equal(result.rows[0].outputPath, "reports/social/2026-12/carousel-01");
});

test("fails closed for unsupported template IDs", () => {
  const result = buildMonthlySocialRunPlan({ month: "2026-12", rows: [row({ templateId: "campaign-reel-v1" })] });

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /reel-01.*unsupported template.*campaign-reel-v1/i);
  assert.equal(result.rows[0].status, "unsupported-template");
  assert.equal(result.rows[0].generator, null);
});

test("rejects duplicate Content IDs before dispatch", () => {
  const result = buildMonthlySocialRunPlan({ month: "2026-12", rows: [row(), row({ publicationDate: "2026-12-04" })] });

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /duplicate Content ID "reel-01"/);
});

test("returns deterministic publication-date and Content ID ordering", () => {
  const input = [row({ contentId: "z", publicationDate: "2026-12-02" }), row({ contentId: "a", publicationDate: "2026-12-02" })];
  const first = buildMonthlySocialRunPlan({ month: "2026-12", rows: input });
  const second = buildMonthlySocialRunPlan({ month: "2026-12", rows: [...input].reverse() });

  assert.deepEqual(first, second);
  assert.deepEqual(first.rows.map((item) => item.contentId), ["a", "z"]);
});

test("rejects rows outside the requested month", () => {
  const result = buildMonthlySocialRunPlan({ month: "2026-12", rows: [row({ publicationDate: "2027-01-01" })] });

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /reel-01.*outside requested month/i);
});
