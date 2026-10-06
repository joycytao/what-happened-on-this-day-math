import assert from "node:assert/strict";
import test from "node:test";

import { buildLandingPageMetadata } from "../src/landing-page-handoff.mjs";

test("builds deterministic landing-page metadata from a monthly product", () => {
  assert.deepEqual(buildLandingPageMetadata({ month: "november", day_count: 30 }), {
    monthSlug: "november",
    title: "November Morning Work Math",
    description: "30 daily word problems across 3 levels, with separate answer keys.",
    productUrl: "http://6pm-studio.com/go/november",
  });
});

test("rejects unsupported months and invalid day counts", () => {
  assert.throws(() => buildLandingPageMetadata({ month: "fall", day_count: 30 }), /unsupported/);
  assert.throws(() => buildLandingPageMetadata({ month: "november", day_count: 0 }), /invalid/);
});
