import path from "node:path";

export const PRODUCT_REEL_RENDER_SPEC = Object.freeze({
  width: 1080,
  height: 1920,
  fps: 30,
  durationSeconds: 10,
  codec: "libx264",
  pixelFormat: "yuv420p",
  audio: "none",
});

export function buildProductReelRenderPlan(workstream, { root = process.cwd(), output = "output/social/product-reels/reel.mp4" } = {}) {
  const errors = [];
  if (!workstream || workstream.valid !== true) errors.push("workstream must be valid");
  if (!Array.isArray(workstream?.records) || workstream.records.length !== 4) errors.push("workstream must contain four weekly records");
  for (const record of workstream?.records ?? []) {
    if (record.canvas !== "1080x1920") errors.push(`${record.id} must use a 1080x1920 canvas`);
    if (record.fps !== 30) errors.push(`${record.id} must use 30 fps`);
    if (record.durationSeconds !== 10) errors.push(`${record.id} must use a ten-second duration`);
    if (record.qa?.answerKeyExposed) errors.push(`${record.id} must not expose an answer key`);
  }
  const firstRecord = workstream?.records?.[0];
  const sourceAsset = (firstRecord?.evidenceAssets ?? []).find((asset) => /\.png$/i.test(asset));
  if (!sourceAsset) errors.push("first Product Reel record must provide a raster PNG evidence asset");
  const outputPath = path.resolve(root, output);
  return {
    valid: errors.length === 0,
    errors,
    sourceAsset: sourceAsset ? path.resolve(root, sourceAsset) : null,
    outputPath,
    spec: PRODUCT_REEL_RENDER_SPEC,
    sceneCount: firstRecord?.scenes?.length ?? 0,
    storage: {
      artifact: path.relative(root, outputPath),
      manifest: `${path.relative(root, outputPath).replace(/\.mp4$/i, "")}.json`,
      retentionDays: 90,
    },
  };
}

export function buildFfmpegArgs(plan) {
  if (!plan.valid) throw new Error(plan.errors.join("; "));
  const { width, height, fps, durationSeconds, codec, pixelFormat } = plan.spec;
  return [
    "-y", "-loop", "1", "-i", plan.sourceAsset,
    "-t", String(durationSeconds),
    "-vf", `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=0xFEFFEF,format=${pixelFormat}`,
    "-r", String(fps), "-an", "-c:v", codec, "-movflags", "+faststart", plan.outputPath,
  ];
}
