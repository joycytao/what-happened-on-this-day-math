#!/usr/bin/env node

import { resolve } from "node:path";
import { FOLLOW_UP_REFERENCE } from "../src/final-follow-up-validation.mjs";
import { FOLLOW_UP_COPY_CONTRACT, validateFollowUpVisual } from "../src/follow-up-visual-qa.mjs";

const [candidatePath = FOLLOW_UP_REFERENCE.asset, outputDir = "reports/follow-up-visual-qa"] = process.argv.slice(2);
const report = await validateFollowUpVisual({ referencePath: FOLLOW_UP_REFERENCE.asset, candidatePath: resolve(candidatePath), outputDir: resolve(outputDir), copy: FOLLOW_UP_COPY_CONTRACT });
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
