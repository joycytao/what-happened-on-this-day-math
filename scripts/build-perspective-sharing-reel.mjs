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
  const font = "/System/Library/Fonts/Supplemental/Arial.ttf";
  const titleFont = "/System/Library/Fonts/Supplemental/Georgia.ttf";
  source.reel.cards.forEach((card, index) => {
    const titlePath = resolve(frameDir, `title-${index + 1}.txt`);
    const bodyPath = resolve(frameDir, `body-${index + 1}.txt`);
    const footerPath = resolve(frameDir, `footer-${index + 1}.txt`);
    ffmpegTextPath(titlePath, wrap(card.headline, 25).join("\n"));
    ffmpegTextPath(bodyPath, wrap(card.body, 39).join("\n"));
    ffmpegTextPath(footerPath, `${source.reel.handle}  ·  ${index + 1} / ${source.reel.cards.length}`);
    const framePath = resolve(frameDir, `frame-${String(index + 1).padStart(2, "0")}.png`);
    const filter = [
      "scale=1080:1920:force_original_aspect_ratio=increase",
      "crop=1080:1920",
      "eq=brightness=-0.16:saturation=0.82",
      "drawbox=x=0:y=0:w=1080:h=1920:color=#3E2C25@0.25:t=fill",
      "drawbox=x=92:y=455:w=896:h=930:color=#F4EDE1@0.97:t=fill",
      "drawbox=x=92:y=455:w=896:h=930:color=#CBB49B@0.9:t=4",
      `drawtext=fontfile=${font}:text='${source.reel.handle}':fontcolor=#3E2C25:fontsize=28:x=150:y=555`,
      `drawtext=fontfile=${titleFont}:textfile=${titlePath}:fontcolor=#3E2C25:fontsize=58:line_spacing=12:x=150:y=740:expansion=none`,
      `drawtext=fontfile=${font}:textfile=${bodyPath}:fontcolor=#765F54:fontsize=35:line_spacing=16:x=150:y=1000:expansion=none`,
      `drawtext=fontfile=${font}:textfile=${footerPath}:fontcolor=#8B604A:fontsize=21:x=150:y=1325:expansion=none`
    ].join(",");
    const result = spawnSync("ffmpeg", ["-y", "-i", backgroundPath, "-frames:v", "1", "-vf", filter, framePath], { stdio: "inherit" });
    if (result.status !== 0) throw new Error(`Fallback frame render failed for card ${index + 1}`);
    framePaths.push(framePath);
  });
  const listPath = resolve(frameDir, "frames.txt");
  writeFileSync(listPath, framePaths.map((framePath) => `file '${framePath}'\nduration ${source.reel.cardDuration}`).join("\n") + `\nfile '${framePaths.at(-1)}'\n`);
  const silentOutput = `${output}.silent.mp4`;
  const result = spawnSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-vf", "fps=30,format=yuv420p", "-movflags", "+faststart", silentOutput], { stdio: "inherit" });
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
