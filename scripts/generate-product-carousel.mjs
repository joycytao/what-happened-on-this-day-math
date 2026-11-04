#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["scripts/generate-carousels.mjs", ...process.argv.slice(2)], { stdio: "inherit" });
process.exit(result.status ?? 1);
