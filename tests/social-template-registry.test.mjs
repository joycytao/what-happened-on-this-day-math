import test from "node:test";
import assert from "node:assert/strict";

import { listSocialTemplates, validateSocialIntake } from "../src/social-template-registry.mjs";

const expected = [
  ["before-after-worksheet-reel", "reel", "reels/before-after-worksheet-reel-template"],
  ["campaign-reminder-reel", "reel", "reels/campaign-reminder-template"],
  ["perspective-sharing-reel", "reel", "reels/perspective-sharing-reel-template"],
  ["product-reel", "reel", "reels/product-reel-template"],
  ["clean-worksheet-carousel", "carousel", "social/clean-worksheet-carousel-template"],
  ["learning-system-carousel", "carousel", "social/learning-system-carousel-template"],
  ["perspective-carousel", "carousel", "social/perspective-carousel-template"],
  ["product-carousel", "carousel", "social/product-carousel-template"],
];

test("registry exposes exactly the four Reel and four Carousel repository templates", () => {
  const templates = listSocialTemplates();
  assert.deepEqual(templates.map(({ key, kind, directory }) => [key, kind, directory]), expected);
  assert.ok(templates.every((template) => template.absolutePath.endsWith(template.directory)));
});

test("registry rejects unknown template keys", () => {
  const result = validateSocialIntake({ templateKey: "unknown-template" });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /unknown templateKey/);
});

test("registry accepts a known template key", () => {
  const result = validateSocialIntake({ templateKey: "product-reel" });
  assert.equal(result.valid, true);
  assert.deepEqual(result.template, {
    key: "product-reel",
    kind: "reel",
    directory: "reels/product-reel-template",
  });
});
