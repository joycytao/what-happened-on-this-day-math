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
const design = JSON.parse(await readFile(resolve(projectDir, "design-tokens.json"), "utf8"));

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
  const backgroundPath = resolve(projectDir, source.reel.backgroundImage ?? "assets/free-scene.png");
  const cardBackgroundPath = resolve(projectDir, "assets/rounded-card-reference.png");
  const avatarPath = resolve(projectDir, source.reel.profileImage ?? "assets/profile-avatar.png");
  const ctaPath = resolve(projectDir, "assets/cta-pill.png");
  const font = design.typography.bodyFont;
  const boldFont = design.typography.boldFont;
  const titleFont = design.typography.titleFont;
  const cardY = 575;
  const cardHeight = 690;
  const contentLeft = 150;
  const profileTop = cardY + 48;
  const dividerY = cardY + 163;
  const footerY = cardY + cardHeight - 78;
  const transitionDuration = source.reel.transitionDuration ?? design.motion.transitionDuration;
  const targetDuration = source.reel.targetDuration ?? design.motion.targetDuration;
  const transitionStarts = [4.55, 8.95, 13.35, 17.75];
  const layerPaths = [];

  source.reel.cards.forEach((card, index) => {
    const titlePath = resolve(frameDir, `title-${index + 1}.txt`);
    const bodyPath = resolve(frameDir, `body-${index + 1}.txt`);
    ffmpegTextPath(titlePath, wrap(card.headline, 25).join("\n"));
    ffmpegTextPath(bodyPath, wrap(card.body, 39).join("\n"));
    const titleLineCount = wrap(card.headline, 25).length;
    const bodyLineCount = wrap(card.body, 39).length;
    const titleLineHeight = 70;
    const bodyLineHeight = 49;
    const ctaHeight = card.cta ? 56 : 0;
    const contentHeight = titleLineCount * titleLineHeight + 28 + bodyLineCount * bodyLineHeight + (card.cta ? design.cta.gapAfterBody + ctaHeight : 0);
    const contentTop = cardY + 185 + Math.max(0, (cardHeight - 185 - 78 - 36 - contentHeight) / 2);
    const titleY = Math.round(contentTop);
    const bodyY = titleY + titleLineCount * titleLineHeight + 28;
    const ctaY = bodyY + bodyLineCount * bodyLineHeight + design.cta.gapAfterBody;
    const layerPath = resolve(frameDir, `layer-${String(index + 1).padStart(2, "0")}.png`);
    const contentFilters = [
      `drawbox=x=${design.profile.dividerX}:y=${dividerY}:w=${design.profile.dividerWidth}:h=2:color=#CBB49B@0.55:t=fill`,
      `drawtext=font='${boldFont}':text='${source.reel.handle}':fontcolor=#3E2C25:fontsize=${design.typography.handleSize}:x=${design.profile.handleX}:y=${profileTop + 19}`,
      `drawtext=fontfile=${titleFont}:textfile=${titlePath}:fontcolor=#3E2C25:fontsize=${design.typography.titleSize}:line_spacing=10:x=${contentLeft}:y=${titleY}:expansion=none`,
      `drawtext=font='${font}':textfile=${bodyPath}:fontcolor=#765F54:fontsize=${design.typography.bodySize}:line_spacing=14:x=${contentLeft}:y=${bodyY}:expansion=none`,
      `drawtext=font='${font}':text='${index === source.reel.cards.length - 1 ? "by 6pm studio" : "stay with the thought"}':fontcolor=#8B604A:fontsize=${design.typography.footerSize}:x=150:y=${footerY}`,
      `drawtext=fontfile=/System/Library/Fonts/Supplemental/Arial.ttf:text='○ ○ ○ ○ ○':fontcolor=#CBB49B:fontsize=18:x=835:y=${footerY - 2}`,
      `drawtext=fontfile=/System/Library/Fonts/Supplemental/Arial.ttf:text='●':fontcolor=#8B604A:fontsize=18:x=${835 + index * 18}:y=${footerY - 2}`,
      ...(card.cta ? [
        `drawtext=font='${boldFont}':text='${card.cta}':fontcolor=#FFFDF8:fontsize=${design.typography.ctaSize}:x=${design.cta.textX}:y=${ctaY + design.cta.textYOffset}`
      ] : [])
    ];
    const imageChain = [
      "[0:v]format=rgba[canvas]",
      "[1:v]format=rgba[card]",
      `[canvas][card]overlay=x=${design.card.x}:y=${cardY}:format=auto[withcard]`,
      `[2:v]scale=${design.profile.avatarSize}:${design.profile.avatarSize},format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte(hypot(X-${design.profile.avatarSize / 2},Y-${design.profile.avatarSize / 2}),${design.profile.avatarSize / 2 - 3}),255,0)'[avatar]`,
      `[withcard][avatar]overlay=x=${design.profile.avatarX}:y=${profileTop}:format=auto[withavatar]`
    ];
    const contentInput = card.cta ? "withcta" : "withavatar";
    if (card.cta) {
      imageChain.push("[3:v]format=rgba[cta]", `[withavatar][cta]overlay=x=${design.cta.x}:y=${ctaY}:format=auto[withcta]`);
    }
    const filter = imageChain.join(";") + `;[${contentInput}]${contentFilters.join(",")}[final]`;
    const result = spawnSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=black@0.0:s=1080x1920,format=rgba", "-i", cardBackgroundPath, "-i", avatarPath, "-i", ctaPath, "-filter_complex", filter, "-map", "[final]", "-frames:v", "1", layerPath], { stdio: "inherit" });
    if (result.status !== 0) throw new Error(`Fallback frame render failed for card ${index + 1}`);
    layerPaths.push(layerPath);
  });
  const silentOutput = `${output}.silent.mp4`;
  const videoArgs = ["-y", "-loop", "1", "-framerate", "30", "-i", backgroundPath];
  layerPaths.forEach((layerPath) => videoArgs.push("-loop", "1", "-framerate", "30", "-i", layerPath));
  const videoFilters = [
    `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,eq=brightness=-0.16:saturation=0.82,drawbox=x=0:y=0:w=1080:h=1920:color=#3E2C25@0.25:t=fill,drawtext=font='${boldFont}':text='P E R S P E C T I V E - S H A R I N G   R E E L':fontcolor=#FFFDF8:fontsize=20:x=68:y=68,drawtext=font='Avenir Next':text='01 / 05':fontcolor=#FFFDF8:fontsize=16:x=w-tw-68:y=68,drawtext=font='Avenir Next':text='${source.reel.handle}':fontcolor=#FFFDF8:fontsize=17:x=68:y=h-64-th,drawtext=font='Avenir Next':text='by 6pm studio':fontcolor=#FFFDF8@0.72:fontsize=17:x=w-tw-68:y=h-64-th[base]`
  ];
  let current = "[base]";
  layerPaths.forEach((_, index) => {
    const start = index === 0 ? 0 : transitionStarts[index - 1];
    const end = index === layerPaths.length - 1 ? targetDuration : transitionStarts[index] + transitionDuration;
    const nextStart = index < transitionStarts.length ? transitionStarts[index] : null;
    const enter = index === 0 ? "0" : `(1-min(max((t-${start})/${transitionDuration},0),1))*1080`;
    const exit = nextStart === null ? "0" : `0-min(max((t-${nextStart})/${transitionDuration},0),1)*1080`;
    const xExpr = index === 0 ? exit : `if(lt(t,${start + transitionDuration}),${enter},${exit})`;
    const next = `[composed${index}]`;
    videoFilters.push(`${current}[${index + 1}:v]overlay=x='${xExpr}':y=0:enable='between(t,${start},${end})':format=auto${next}`);
    current = next;
  });
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
