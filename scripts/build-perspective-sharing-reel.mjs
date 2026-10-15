#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const projectDir = resolve(repoRoot, "reels/perspective-sharing-reel-template");
const output = process.argv[2] ?? resolve(projectDir, "exports/perspective-sharing-reel.mp4");
const inputPath = process.argv[3] ?? resolve(repoRoot, "examples/perspective-learning-system/source.json");
const useHyperframes = process.argv.includes("--hyperframes");

if (!existsSync(resolve(projectDir, "index.html"))) {
  console.error(`Missing composition: ${projectDir}/index.html`);
  process.exit(1);
}

mkdirSync(resolve(projectDir, "exports"), { recursive: true });

const source = JSON.parse(await readFile(inputPath, "utf8"));

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

function ffmpegTextPath(path, text) {
  writeFileSync(path, text.replaceAll("%", "\\%"));
}

function renderFallback() {
  const frameDir = resolve(projectDir, "exports/perspective-learning-system-frames");
  mkdirSync(frameDir, { recursive: true });
  const framePaths = [];
  const backgroundPath = resolve(projectDir, source.reel.backgroundImage ?? "assets/free-scene.png");
  const cardBackgroundPath = resolve(projectDir, "assets/rounded-card.png");
  const avatarPath = resolve(projectDir, "assets/profile-avatar-circle.png");
  const ctaPath = resolve(projectDir, "assets/cta-pill.png");
  const font = "Avenir Next";
  const titleFont = "/System/Library/Fonts/Supplemental/Georgia.ttf";
  source.reel.cards.forEach((card, index) => {
    const titlePath = resolve(frameDir, `title-${index + 1}.txt`);
    const bodyPath = resolve(frameDir, `body-${index + 1}.txt`);
    const footerPath = resolve(frameDir, `footer-${index + 1}.txt`);
    ffmpegTextPath(titlePath, wrap(card.headline, 25).join("\n"));
    ffmpegTextPath(bodyPath, wrap(card.body, 39).join("\n"));
    ffmpegTextPath(footerPath, `${source.reel.handle}  ·  ${index + 1} / ${source.reel.cards.length}`);
    const framePath = resolve(frameDir, `frame-${String(index + 1).padStart(2, "0")}.png`);
    const contentFilters = [
      "drawbox=x=150:y=592:w=780:h=2:color=#CBB49B@0.55:t=fill",
      `drawtext=font='${font}':text='${source.reel.handle}':fontcolor=#3E2C25:fontsize=28:x=215:y=516`,
      `drawtext=fontfile=${titleFont}:textfile=${titlePath}:fontcolor=#3E2C25:fontsize=60:line_spacing=10:x=150:y=680:expansion=none`,
      `drawtext=font='${font}':textfile=${bodyPath}:fontcolor=#765F54:fontsize=35:line_spacing=14:x=150:y=875:expansion=none`,
      `drawtext=font='${font}':text='${index === source.reel.cards.length - 1 ? "by 6pm studio" : "stay with the thought"}':fontcolor=#8B604A:fontsize=20:x=150:y=1310`,
      `drawtext=fontfile=/System/Library/Fonts/Supplemental/Arial.ttf:text='○ ○ ○ ○ ○':fontcolor=#CBB49B:fontsize=18:x=835:y=1308`,
      `drawtext=fontfile=/System/Library/Fonts/Supplemental/Arial.ttf:text='●':fontcolor=#8B604A:fontsize=18:x=${835 + index * 18}:y=1308`,
      ...(card.cta ? [
        `drawtext=font='${font}':text='${card.cta}':fontcolor=#FFFDF8:fontsize=18:x=168:y=1142`
      ] : [])
    ];
    const imageChain = [
      "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,eq=brightness=-0.16:saturation=0.82,drawbox=x=0:y=0:w=1080:h=1920:color=#3E2C25@0.25:t=fill[base]",
      "[1:v]format=rgba[card]",
      "[base][card]overlay=x=92:y=455:format=auto[withcard]",
      "[2:v]format=rgba[avatar]",
      "[withcard][avatar]overlay=x=132:y=497:format=auto[withavatar]"
    ];
    const contentInput = card.cta ? "withcta" : "withavatar";
    if (card.cta) {
      imageChain.push("[3:v]format=rgba[cta]", "[withavatar][cta]overlay=x=150:y=1110:format=auto[withcta]");
    }
    const filter = imageChain.join(";") + `;[${contentInput}]${contentFilters.join(",")}[final]`;
    const result = spawnSync("ffmpeg", ["-y", "-i", backgroundPath, "-i", cardBackgroundPath, "-i", avatarPath, "-i", ctaPath, "-filter_complex", filter, "-map", "[final]", "-frames:v", "1", framePath], { stdio: "inherit" });
    if (result.status !== 0) throw new Error(`Fallback frame render failed for card ${index + 1}`);
    framePaths.push(framePath);
  });
  const silentOutput = `${output}.silent.mp4`;
  const transitionDuration = source.reel.transitionDuration ?? 0.48;
  const targetDuration = source.reel.targetDuration ?? 23;
  const segmentDuration = (targetDuration + transitionDuration * (framePaths.length - 1)) / framePaths.length;
  const videoArgs = ["-y"];
  framePaths.forEach((framePath) => videoArgs.push("-loop", "1", "-framerate", "30", "-t", String(segmentDuration), "-i", framePath));
  const videoFilters = framePaths.map((_, index) => `[${index}:v]format=yuv420p,setsar=1[v${index}]`);
  let current = "[v0]";
  for (let index = 1; index < framePaths.length; index += 1) {
    const next = `[slide${index}]`;
    const offset = (segmentDuration - transitionDuration) * index;
    videoFilters.push(`${current}[v${index}]xfade=transition=slideleft:duration=${transitionDuration}:offset=${offset}${next}`);
    current = next;
  }
  videoArgs.push("-filter_complex", `${videoFilters.join(";")};${current}format=yuv420p[video]`, "-map", "[video]", "-t", String(targetDuration), "-movflags", "+faststart", silentOutput);
  const result = spawnSync("ffmpeg", videoArgs, { stdio: "inherit" });
  if (result.status !== 0) throw new Error("Fallback Reel assembly failed");
  if (source.reel.musicFile) {
    const musicPath = resolve(projectDir, source.reel.musicFile);
    const mux = spawnSync("ffmpeg", ["-y", "-i", silentOutput, "-stream_loop", "-1", "-i", musicPath, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-shortest", "-movflags", "+faststart", output], { stdio: "inherit" });
    if (mux.status !== 0) throw new Error("Fallback Reel audio mux failed");
  } else {
    const rename = spawnSync("mv", [silentOutput, output], { stdio: "inherit" });
    if (rename.status !== 0) throw new Error("Fallback Reel finalization failed");
  }
}

if (!useHyperframes) {
  renderFallback();
  process.exit(0);
}
const templatePath = resolve(projectDir, "index.html");
const original = await readFile(templatePath, "utf8");
const marker = "      const content = window.PERSPECTIVE_CONTENT || {";
const contentScript = `      window.PERSPECTIVE_CONTENT = ${JSON.stringify(source.reel)};\n`;
await writeFile(templatePath, original.replace(marker, `${contentScript}${marker}`));

const result = spawnSync("npx", ["hyperframes", "render", "--output", output], {
  cwd: projectDir,
  stdio: "inherit",
});

await writeFile(templatePath, original);

process.exit(result.status ?? 1);
