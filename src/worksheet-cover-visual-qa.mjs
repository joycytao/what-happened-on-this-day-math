import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { PNG } from "pngjs";

export const FIXED_REGIONS = {
  frame: { x: 0, y: 0, width: 1102, height: 1427 },
  headline: { x: 70, y: 90, width: 960, height: 300 },
  supportingCopy: { x: 120, y: 390, width: 860, height: 230 },
  levels: { x: 280, y: 990, width: 550, height: 180 },
  footer: { x: 0, y: 1160, width: 1102, height: 267 },
};

function decode(bytes) { return PNG.sync.read(bytes); }
function pixel(image, x, y) { const i = (y * image.width + x) * 4; return [image.data[i], image.data[i + 1], image.data[i + 2], image.data[i + 3]]; }
function resizeNearest(source, width, height) {
  const result = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const [r, g, b, a] = pixel(source, Math.min(source.width - 1, Math.floor(x * source.width / width)), Math.min(source.height - 1, Math.floor(y * source.height / height)));
    const i = (y * width + x) * 4; result.data[i] = r; result.data[i + 1] = g; result.data[i + 2] = b; result.data[i + 3] = a;
  }
  return result;
}
function compare(reference, candidate, region) {
  let total = 0; let exact = 0; let count = 0;
  for (let y = region.y; y < region.y + region.height; y += 1) for (let x = region.x; x < region.x + region.width; x += 1) {
    const a = pixel(reference, x, y); const b = pixel(candidate, x, y); const delta = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
    total += delta / 765; if (delta === 0) exact += 1; count += 1;
  }
  return { similarity: Number((1 - total / count).toFixed(6)), exactRatio: Number((exact / count).toFixed(6)), pixels: count };
}
function artifacts(reference, candidate) {
  const side = new PNG({ width: reference.width * 2, height: reference.height });
  const overlay = new PNG({ width: reference.width, height: reference.height });
  const heatmap = new PNG({ width: reference.width, height: reference.height });
  for (let y = 0; y < reference.height; y += 1) for (let x = 0; x < reference.width; x += 1) {
    const a = pixel(reference, x, y); const b = pixel(candidate, x, y); const i = (y * reference.width + x) * 4; const j = (y * side.width + x) * 4;
    for (const [target, offset, value] of [[side, 0, a], [side, reference.width, b]]) { const k = (y * target.width + x) * 4 + offset * 4; target.data[k] = value[0]; target.data[k + 1] = value[1]; target.data[k + 2] = value[2]; target.data[k + 3] = 255; }
    overlay.data[i] = Math.round((a[0] + b[0]) / 2); overlay.data[i + 1] = Math.round((a[1] + b[1]) / 2); overlay.data[i + 2] = Math.round((a[2] + b[2]) / 2); overlay.data[i + 3] = 255;
    const delta = Math.min(255, Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])); heatmap.data[i] = delta; heatmap.data[i + 1] = 0; heatmap.data[i + 2] = 0; heatmap.data[i + 3] = 255;
  }
  return { side, overlay, heatmap };
}

export async function validateWorksheetCoverVisual({ referencePath, candidatePath, outputDir, promptVersion = "1.0.0", iteration = 1 } = {}) {
  const reference = decode(await readFile(referencePath));
  const originalCandidate = decode(await readFile(candidatePath));
  const candidate = resizeNearest(originalCandidate, reference.width, reference.height);
  const regions = Object.fromEntries(Object.entries(FIXED_REGIONS).map(([name, region]) => [name, compare(reference, candidate, region)]));
  const fixedSimilarity = Object.values(regions).reduce((sum, item) => sum + item.similarity, 0) / Object.values(regions).length;
  const passed = fixedSimilarity >= 0.98 && Object.values(regions).every((item) => item.exactRatio >= 0.95);
  await mkdir(outputDir, { recursive: true });
  const visual = artifacts(reference, candidate);
  await Promise.all([
    writeFile(resolve(outputDir, "side-by-side.png"), PNG.sync.write(visual.side)),
    writeFile(resolve(outputDir, "overlay.png"), PNG.sync.write(visual.overlay)),
    writeFile(resolve(outputDir, "pixel-diff-heatmap.png"), PNG.sync.write(visual.heatmap)),
  ]);
  const report = { passed, promptVersion, iteration, reference: { path: referencePath, width: reference.width, height: reference.height }, candidate: { path: candidatePath, width: originalCandidate.width, height: originalCandidate.height }, fixedRegionThresholds: { meanSimilarity: 0.98, exactRatio: 0.95 }, fixedRegionSimilarity: Number(fixedSimilarity.toFixed(6)), regions, artifacts: ["side-by-side.png", "overlay.png", "pixel-diff-heatmap.png"], recoveryLoop: passed ? "not required" : "optimize prompt/layout -> regenerate -> rerun complete QA" };
  await writeFile(resolve(outputDir, "visual-qa.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}
