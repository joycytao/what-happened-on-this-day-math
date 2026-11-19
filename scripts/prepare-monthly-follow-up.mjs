#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { FOLLOW_UP_REFERENCE, verifyFollowUpReference } from "../src/final-follow-up-validation.mjs";
import { FOLLOW_UP_COPY_CONTRACT, validateFollowUpVisual } from "../src/follow-up-visual-qa.mjs";

const [month = "2026-12", outputDir = "reports/monthly-follow-up"] = process.argv.slice(2);
const root = resolve(new URL("..", import.meta.url).pathname);
const referencePath = resolve(root, FOLLOW_UP_REFERENCE.asset);
const destination = resolve(outputDir);

await mkdir(destination, { recursive: true });
const reference = await verifyFollowUpReference(referencePath);
if (!reference.valid) throw new Error(`follow-up reference checksum mismatch: ${reference.actualSha256}`);
const visual = await validateFollowUpVisual({
  referencePath,
  candidatePath: referencePath,
  outputDir: destination,
  copy: FOLLOW_UP_COPY_CONTRACT,
});
if (!visual.passed) throw new Error(`follow-up visual QA failed: ${visual.recoveryLoop}`);

const artifact = {
  schemaVersion: "monthly-follow-up/v1",
  month,
  pageCount: 1,
  position: "after-answer-key",
  asset: "follow-up-page-reference.png",
  assetPath: referencePath,
  assetSha256: reference.actualSha256,
  visualQa: "visual-qa.json",
  artifacts: visual.artifacts,
  deterministic: true,
};
await writeFile(resolve(destination, "follow-up-artifact.json"), `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ...artifact, visualFixedRegionSimilarity: visual.fixedRegionSimilarity }, null, 2));
