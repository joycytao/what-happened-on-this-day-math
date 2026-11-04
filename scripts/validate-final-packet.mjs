#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { validateFinalPacketManifest } from "../src/final-follow-up-validation.mjs";

const [manifestPath, dayCountText] = process.argv.slice(2);
if (!manifestPath || !dayCountText) {
  console.error("Usage: node scripts/validate-final-packet.mjs <manifest.json> <day-count>");
  process.exit(2);
}

const result = validateFinalPacketManifest(JSON.parse(await readFile(manifestPath, "utf8")), Number(dayCountText));
console.log(JSON.stringify(result, null, 2));
if (!result.valid) process.exitCode = 1;
