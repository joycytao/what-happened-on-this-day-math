#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const result = spawnSync("python3", ["social/learning-system-carousel-template/make_learning_system_slides.py"], { stdio: "inherit" });
process.exit(result.status ?? 1);
