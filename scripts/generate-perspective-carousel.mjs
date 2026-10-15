#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const inputPath = resolve(process.argv[2] ?? "examples/perspective-learning-system/source.json");
const outputDir = resolve(process.argv[3] ?? "output/social/perspective-learning-system/carousel");
const templateDir = resolve(repoRoot, "reels/perspective-sharing-reel-template");

const source = JSON.parse(await readFile(inputPath, "utf8"));
await mkdir(outputDir, { recursive: true });

const palette = { bg: "#F4EDE1", ink: "#3E2C25", accent: "#8B604A", muted: "#765F54" };

function escapeXml(value) {
  return String(value).replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[char]);
}

function textSvg(lines, { y = 120, size = 58, color = palette.ink, width = 900, family = "Arial" } = {}) {
  const safeLines = lines.map((line) => escapeXml(line));
  const tspans = safeLines.map((line, index) => `<tspan x="540" dy="${index === 0 ? 0 : size * 1.18}">${line}</tspan>`).join("");
  return Buffer.from(`<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg"><style>text{font-family:${family},Arial,sans-serif;font-weight:700;letter-spacing:-1px}</style><text x="540" y="${y}" text-anchor="middle" fill="${color}" font-size="${size}" textLength="${width}" lengthAdjust="spacingAndGlyphs">${tspans}</text></svg>`);
}

function bodySvg(text, { y = 760, size = 36, color = palette.muted, width = 820 } = {}) {
  const words = escapeXml(text).split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > 38) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return textSvg(lines, { y, size, color, width, family: "Arial" });
}

function wrap(text, maxLength) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLength) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function svgText(lines, { y, size, color, family = "Arial", weight = 700, lineHeight = 1.18 }) {
  return `<text x="540" y="${y}" text-anchor="middle" fill="${color}" font-family="${family}" font-size="${size}" font-weight="${weight}">${lines.map((line, index) => `<tspan x="540" dy="${index === 0 ? 0 : size * lineHeight}">${escapeXml(line)}</tspan>`).join("")}</text>`;
}

async function renderSlide(index, slide) {
  const coverLike = slide.role === "cover" || slide.role === "closing";
  const titleLines = wrap(slide.title, slide.title.length > 34 ? 25 : 20);
  const bodyLines = wrap(slide.body, 42);
  const pngPath = resolve(outputDir, `slide-${index}.png`);
  const titlePath = resolve(outputDir, `.slide-${index}-title.txt`);
  const bodyPath = resolve(outputDir, `.slide-${index}-body.txt`);
  const footerPath = resolve(outputDir, `.slide-${index}-footer.txt`);
  await writeFile(titlePath, titleLines.join("\n"));
  await writeFile(bodyPath, bodyLines.join("\n"));
  await writeFile(footerPath, `@engineermom.afterhours  ·  ${String(index).padStart(2, "0")} / ${source.carousel.slides.length}`);
  const font = "/System/Library/Fonts/Supplemental/Arial.ttf";
  const titleFont = "/System/Library/Fonts/Supplemental/Georgia.ttf";
  const filter = [
    `drawbox=x=0:y=0:w=1080:h=1350:color=${palette.bg}:t=fill`,
    ...(coverLike ? [`drawbox=x=0:y=0:w=1080:h=720:color=#765F54:t=fill`] : [`drawbox=x=52:y=52:w=976:h=1246:color=${palette.accent}@0.45:t=4`]),
    `drawtext=fontfile=${titleFont}:textfile=${titlePath}:fontcolor=${coverLike ? palette.accent : palette.ink}:fontsize=${titleLines.length > 2 ? 48 : 62}:line_spacing=12:x=(w-text_w)/2:y=${coverLike ? 770 : 260}:text_align=center:expansion=none`,
    `drawtext=fontfile=${font}:textfile=${bodyPath}:fontcolor=${palette.muted}:fontsize=36:line_spacing=18:x=(w-text_w)/2:y=${coverLike ? 1030 : 700}:text_align=center:expansion=none`,
    `drawtext=fontfile=${font}:textfile=${footerPath}:fontcolor=${palette.accent}:fontsize=22:x=(w-text_w)/2:y=1280:expansion=none`
  ].join(",");
  const result = spawnSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=#F4EDE1:s=1080x1350", "-frames:v", "1", "-vf", filter, pngPath], { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`ffmpeg failed for slide ${index}`);
}

for (const [index, slide] of source.carousel.slides.entries()) await renderSlide(index + 1, slide);
await import("node:fs/promises").then(({ writeFile }) => writeFile(resolve(outputDir, "content.json"), JSON.stringify(source, null, 2)));
console.log(outputDir);
