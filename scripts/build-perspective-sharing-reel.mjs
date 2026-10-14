#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const projectDir = resolve(repoRoot, "reels/perspective-sharing-reel-template");
const output = process.argv[2] ?? resolve(projectDir, "exports/perspective-sharing-reel.mp4");

if (!existsSync(resolve(projectDir, "index.html"))) {
  console.error(`Missing composition: ${projectDir}/index.html`);
  process.exit(1);
}

mkdirSync(resolve(projectDir, "exports"), { recursive: true });
const result = spawnSync("npx", ["hyperframes", "render", "--output", output], {
  cwd: projectDir,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
