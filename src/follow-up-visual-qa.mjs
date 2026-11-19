import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PNG } from "pngjs";

export const FOLLOW_UP_COPY_CONTRACT = {
  headline: ["FOLLOW", "FOR WHAT’S NEXT"],
  subtitle: "Get first notice of new monthly resources",
  panels: [
    { title: "FOLLOW", body: "for new releases" },
    { title: "LEAVE FEEDBACK", body: "to help us create better content" },
    { title: "HELP SHAPE WHAT’S NEXT", body: ["More flexible challenge levels", "More critical-thinking opportunities"] },
  ],
  pricingNote: "Early-month pricing may end when the month begins.",
  logo: "6 pm studio",
};

export const FOLLOW_UP_VISUAL_CONTRACT = {
  width: 1024,
  height: 1536,
  fixedRegionThreshold: 0.98,
  exactPixelThreshold: 0.95,
  regions: {
    frame: { x: 18, y: 18, width: 988, height: 1500 },
    headline: { x: 52, y: 52, width: 920, height: 330 },
    followPanel: { x: 57, y: 430, width: 910, height: 260 },
    feedbackPanel: { x: 57, y: 704, width: 910, height: 260 },
    roadmapPanel: { x: 57, y: 976, width: 910, height: 285 },
    footer: { x: 45, y: 1260, width: 935, height: 245 },
  },
};

function decode(bytes) { return PNG.sync.read(bytes); }
function pixel(image, x, y) {
  const i = (y * image.width + x) * 4;
  return [image.data[i], image.data[i + 1], image.data[i + 2], image.data[i + 3]];
}
function normalizePalette(image) {
  const result = PNG.sync.read(PNG.sync.write(image));
  for (let i = 0; i < result.data.length; i += 4) {
    const r = result.data[i]; const g = result.data[i + 1]; const b = result.data[i + 2];
    if (r > 220 && g > 220 && b > 205) [result.data[i], result.data[i + 1], result.data[i + 2]] = [254, 254, 245];
    else if (r < 105 && g < 115 && b < 135) [result.data[i], result.data[i + 1], result.data[i + 2]] = [50, 57, 69];
    else if (r > 200 && g < 190 && b < 125) [result.data[i], result.data[i + 1], result.data[i + 2]] = [255, 138, 0];
  }
  return result;
}
function resizeNearest(source, width, height) {
  const result = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const sourceX = Math.min(source.width - 1, Math.floor(x * source.width / width));
    const sourceY = Math.min(source.height - 1, Math.floor(y * source.height / height));
    const [r, g, b, a] = pixel(source, sourceX, sourceY);
    const i = (y * width + x) * 4;
    result.data[i] = r; result.data[i + 1] = g; result.data[i + 2] = b; result.data[i + 3] = a;
  }
  return result;
}
function compare(reference, candidate, region) {
  let total = 0; let exact = 0; let count = 0;
  for (let y = region.y; y < region.y + region.height; y += 1) for (let x = region.x; x < region.x + region.width; x += 1) {
    const a = pixel(reference, x, y); const b = pixel(candidate, x, y);
    const delta = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
    total += delta / 765; if (delta === 0) exact += 1; count += 1;
  }
  return { similarity: Number((1 - total / count).toFixed(6)), exactRatio: Number((exact / count).toFixed(6)), pixels: count };
}
function artifacts(reference, candidate) {
  const side = new PNG({ width: reference.width * 2, height: reference.height });
  const overlay = new PNG({ width: reference.width, height: reference.height });
  const heatmap = new PNG({ width: reference.width, height: reference.height });
  for (let y = 0; y < reference.height; y += 1) for (let x = 0; x < reference.width; x += 1) {
    const a = pixel(reference, x, y); const b = pixel(candidate, x, y);
    const i = (y * reference.width + x) * 4;
    const left = (y * side.width + x) * 4; const right = (y * side.width + x + reference.width) * 4;
    for (const [offset, value] of [[left, a], [right, b]]) { side.data[offset] = value[0]; side.data[offset + 1] = value[1]; side.data[offset + 2] = value[2]; side.data[offset + 3] = 255; }
    overlay.data[i] = Math.round((a[0] + b[0]) / 2); overlay.data[i + 1] = Math.round((a[1] + b[1]) / 2); overlay.data[i + 2] = Math.round((a[2] + b[2]) / 2); overlay.data[i + 3] = 255;
    const delta = Math.min(255, Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]));
    heatmap.data[i] = delta; heatmap.data[i + 1] = 0; heatmap.data[i + 2] = 0; heatmap.data[i + 3] = 255;
  }
  return { side, overlay, heatmap };
}

export function validateFollowUpCopy(copy) {
  const errors = [];
  if (JSON.stringify(copy?.headline) !== JSON.stringify(FOLLOW_UP_COPY_CONTRACT.headline)) errors.push("headline copy does not match the approved reference");
  if (copy?.subtitle !== FOLLOW_UP_COPY_CONTRACT.subtitle) errors.push("subtitle copy does not match the approved reference");
  if (JSON.stringify(copy?.panels) !== JSON.stringify(FOLLOW_UP_COPY_CONTRACT.panels)) errors.push("panel copy does not match the approved reference");
  if (copy?.pricingNote !== FOLLOW_UP_COPY_CONTRACT.pricingNote) errors.push("pricing note does not match the approved reference");
  if (copy?.logo !== FOLLOW_UP_COPY_CONTRACT.logo) errors.push("logo copy does not match the approved reference");
  return { valid: errors.length === 0, errors, copy: FOLLOW_UP_COPY_CONTRACT };
}

export async function validateFollowUpVisual({ referencePath, candidatePath, outputDir, promptVersion = "1.0.0", iteration = 1, copy = FOLLOW_UP_COPY_CONTRACT } = {}) {
  const referenceOriginal = decode(await readFile(referencePath));
  const candidateOriginal = decode(await readFile(candidatePath));
  const reference = normalizePalette(referenceOriginal);
  const candidate = normalizePalette(resizeNearest(candidateOriginal, reference.width, reference.height));
  const regions = Object.fromEntries(Object.entries(FOLLOW_UP_VISUAL_CONTRACT.regions).map(([name, region]) => [name, compare(reference, candidate, region)]));
  const fixedSimilarity = Object.values(regions).reduce((sum, item) => sum + item.similarity, 0) / Object.values(regions).length;
  const copyResult = validateFollowUpCopy(copy);
  const dimensionsPass = candidateOriginal.width === FOLLOW_UP_VISUAL_CONTRACT.width && candidateOriginal.height === FOLLOW_UP_VISUAL_CONTRACT.height;
  const regionsPass = fixedSimilarity >= FOLLOW_UP_VISUAL_CONTRACT.fixedRegionThreshold && Object.values(regions).every((item) => item.exactRatio >= FOLLOW_UP_VISUAL_CONTRACT.exactPixelThreshold);
  const passed = dimensionsPass && regionsPass && copyResult.valid;
  await mkdir(outputDir, { recursive: true });
  const visual = artifacts(reference, candidate);
  await Promise.all([
    writeFile(resolve(outputDir, "side-by-side.png"), PNG.sync.write(visual.side)),
    writeFile(resolve(outputDir, "overlay.png"), PNG.sync.write(visual.overlay)),
    writeFile(resolve(outputDir, "pixel-diff-heatmap.png"), PNG.sync.write(visual.heatmap)),
  ]);
  const report = {
    passed, promptVersion, iteration,
    reference: { path: referencePath, width: referenceOriginal.width, height: referenceOriginal.height },
    candidate: { path: candidatePath, width: candidateOriginal.width, height: candidateOriginal.height },
    dimensionsPass, copy: copyResult, fixedRegionThresholds: { meanSimilarity: FOLLOW_UP_VISUAL_CONTRACT.fixedRegionThreshold, exactRatio: FOLLOW_UP_VISUAL_CONTRACT.exactPixelThreshold },
    fixedRegionSimilarity: Number(fixedSimilarity.toFixed(6)), regions,
    artifacts: ["side-by-side.png", "overlay.png", "pixel-diff-heatmap.png"],
    recoveryLoop: passed ? "not required" : "optimize prompt/layout -> regenerate -> rerun complete QA",
  };
  await writeFile(resolve(outputDir, "visual-qa.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}
