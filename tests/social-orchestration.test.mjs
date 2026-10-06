import test from "node:test";
import assert from "node:assert/strict";

import {
  SOCIAL_LABELS,
  buildMonthlySocialIssuePlan,
  buildUtilitySocialIssuePlan,
} from "../src/social-orchestration.mjs";

const monthlyInput = {
  month: "October",
  year: "2026",
  packageId: "october-v1.0",
  manifestPath: "releases/october-v1.0.manifest.json",
  contentPath: "content/monthly/month-10.json",
  thumbnailManifestPath: "output/tpt/october-v1.0/visual-assets/landing-page-handoff.json",
  runUrl: "https://github.com/joycytao/what-happened-on-this-day-math/actions/runs/1",
};

test("monthly social plan creates one parent and ordered Reel then Carousel children", () => {
  const plan = buildMonthlySocialIssuePlan(monthlyInput);

  assert.equal(plan.valid, true);
  assert.equal(plan.issues.length, 9);
  assert.equal(plan.issues[0].kind, "monthly-parent");
  assert.deepEqual(plan.issues.slice(1).map((issue) => issue.kind), [
    "product-reel",
    "carousel",
    "product-reel",
    "carousel",
    "product-reel",
    "carousel",
    "product-reel",
    "carousel",
  ]);
  assert.ok(plan.issues[1].labels.includes(SOCIAL_LABELS.productReel));
  assert.ok(plan.issues[2].labels.includes(SOCIAL_LABELS.blocked));
  assert.match(plan.issues[2].body, /CODEX_DEPENDS_ON_WEEK:1/);
  assert.match(plan.issues[1].body, /Codex automation is the production worker/);
  assert.match(plan.issues[0].body, /Project status remains human-managed/);
});

test("monthly social plan is deterministic for the same release identity", () => {
  const first = buildMonthlySocialIssuePlan(monthlyInput);
  const second = buildMonthlySocialIssuePlan(monthlyInput);
  assert.deepEqual(first, second);
});

test("utility plan creates three sequential ready-to-pickup children", () => {
  const plan = buildUtilitySocialIssuePlan({
    cycleId: "student-test-2026-10-01",
    intakeIssueNumber: 150,
    runUrl: "https://github.com/joycytao/what-happened-on-this-day-math/actions/runs/2",
  });

  assert.equal(plan.valid, true);
  assert.equal(plan.issues.length, 4);
  assert.deepEqual(plan.issues.slice(1).map((issue) => issue.kind), ["utility-week-1", "utility-week-2", "utility-week-3"]);
  assert.ok(plan.issues.slice(1).every((issue) => issue.labels.includes(SOCIAL_LABELS.utilityReel)));
  assert.ok(plan.issues[1].labels.includes(SOCIAL_LABELS.ready));
  assert.ok(plan.issues.slice(2).every((issue) => issue.labels.includes(SOCIAL_LABELS.blocked)));
  assert.match(plan.issues[3].body, /CODEX_DEPENDS_ON_UTILITY_WEEK:2/);
});

test("social plans reject missing release identity instead of inventing inputs", () => {
  const result = buildMonthlySocialIssuePlan({ month: "October" });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /packageId is required/);
});
