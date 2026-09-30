#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildConnectivityReport,
  classifyGitHubFailure,
  retryGitHubOperation,
} from "../src/github-app-resilience.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const wrapper = "/Users/jtao/Documents/Projects/6pm/projects/what-happened-on-this-day-podcast/scripts/codex-github.mjs";
const reportPath = resolve(root, "reports/github-app-connectivity.json");

function parseCommand(argv) {
  const separator = argv.indexOf("--");
  if (separator < 0 || separator === argv.length - 1) {
    throw new Error("Usage: node scripts/github-app-command.mjs -- gh <args...>");
  }
  const command = argv.slice(separator + 1);
  if (command[0] !== "gh") throw new Error("Only gh commands are supported");
  return command;
}

function runWrapper(command) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [wrapper, "--", ...command], {
      cwd: root,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) return resolvePromise({ stdout, stderr });
      const error = new Error((stderr || stdout || `wrapper exited with code ${code}`).trim());
      error.code = code === null ? signal : undefined;
      reject(error);
    });
  });
}

async function writeReport(report) {
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function run() {
  const command = parseCommand(process.argv.slice(2));
  const commandText = command.join(" ");
  let attempts = 0;
  const runWithEvidence = async (operation) => retryGitHubOperation({
    maxAttempts: 3,
    operation: async () => {
      attempts += 1;
      return operation();
    },
    onRetry: ({ attempt, delay, category }) => {
      console.error(`GitHub App ${category} failure; retry ${attempt + 1}/3 after ${delay}ms`);
    },
  });

  try {
    await runWithEvidence(() => runWrapper(["gh", "api", "/rate_limit"]));
    const result = await runWithEvidence(() => runWrapper(command));
    await writeReport({ valid: true, command: commandText, attempts, category: "none", retryable: false });
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
  } catch (error) {
    const category = classifyGitHubFailure(error);
    const report = buildConnectivityReport({
      command: commandText,
      attempts,
      category,
      message: error?.message ?? String(error),
      retryable: category === "network" || category === "transient",
    });
    await writeReport({ valid: false, ...report });
    console.error(`${category}: ${report.message}`);
    process.exitCode = category === "network" || category === "transient" ? 75 : 1;
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 2;
});
