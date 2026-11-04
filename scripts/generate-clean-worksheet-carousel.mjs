#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const result = spawnSync("python3", ["social/clean-worksheet-carousel-template/build_template.py"], { stdio: "inherit" });
process.exit(result.status ?? 1);
