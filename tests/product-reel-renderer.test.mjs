import test from "node:test";
import assert from "node:assert/strict";
import { buildFfmpegArgs, buildProductReelRenderPlan } from "../src/product-reel-renderer.mjs";

const workstream = {
  valid: true,
  records: Array.from({ length: 4 }, (_, index) => ({
    id: `october-week-${index + 1}`,
    canvas: "1080x1920",
    fps: 30,
    durationSeconds: 10,
    evidenceAssets: index === 0 ? ["output/thumbnails/october-v1.0-cover.png"] : [],
    scenes: [{ asset: "output/thumbnails/october-v1.0-cover.png" }],
    qa: { answerKeyExposed: false }
  }))
};

test("builds the reference-compatible Product Reel render contract", () => {
  const plan = buildProductReelRenderPlan(workstream, { root: "/repo", output: "output/social/product-reels/october/reel.mp4" });
  assert.equal(plan.valid, true);
  assert.equal(plan.spec.width, 1080);
  assert.equal(plan.spec.height, 1920);
  assert.equal(plan.spec.fps, 30);
  assert.equal(plan.spec.durationSeconds, 10);
  assert.equal(plan.spec.codec, "libx264");
  assert.equal(plan.storage.retentionDays, 90);
  assert.match(plan.storage.manifest, /reel\.json$/);
});

test("builds deterministic ffmpeg arguments without audio", () => {
  const plan = buildProductReelRenderPlan(workstream, { root: "/repo", output: "out/reel.mp4" });
  const args = buildFfmpegArgs(plan);
  assert.ok(args.includes("-an"));
  assert.ok(args.includes("-r") && args[args.indexOf("-r") + 1] === "30");
  assert.ok(args.some((value) => value.includes("scale=1080:1920")));
  assert.equal(args.at(-1), "/repo/out/reel.mp4");
});

test("rejects a workstream that exposes an answer key or wrong reference dimensions", () => {
  const result = buildProductReelRenderPlan({
    ...workstream,
    records: workstream.records.map((record, index) => index === 0 ? { ...record, canvas: "1080x1080", qa: { answerKeyExposed: true } } : record)
  }, { root: "/repo" });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /1080x1920/);
  assert.match(result.errors.join("\n"), /answer key/);
});
