#!/usr/bin/env node
import { spawn } from "node:child_process";
import { renderHandoff } from "../src/agent-handoff.mjs";
import { buildClaimHandoff, formatQueueResult, listEligibleWork } from "../src/agent-pickup.mjs";

const root = new URL("..", import.meta.url).pathname;
const runner = `${root}/scripts/github-app-command.mjs`;
const repo = "joycytao/what-happened-on-this-day-math";

function args(argv) {
  const [mode, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (value === "--dry-run") options.dryRun = true;
    else if (value.startsWith("--")) options[value.slice(2)] = rest[++index];
  }
  return { mode, options };
}

function runGithub(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [runner, "--", "gh", ...command], {
      cwd: root,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.once("error", reject);
    child.once("exit", code => code === 0 ? resolve(stdout) : reject(new Error(stderr || stdout || `GitHub command failed: ${code}`)));
  });
}

function normalizeIssue(issue) {
  return {
    ...issue,
    html_url: issue.html_url || issue.url,
    created_at: issue.created_at || issue.createdAt,
  };
}

async function fetchIssues() {
  const output = await runGithub(["issue", "list", "--repo", repo, "--state", "open", "--limit", "100", "--json", "number,title,url,createdAt,labels"]);
  return JSON.parse(output).map(normalizeIssue);
}

async function fetchIssue(number) {
  const output = await runGithub(["issue", "view", String(number), "--repo", repo, "--json", "number,title,url,createdAt,labels,comments"]);
  return normalizeIssue(JSON.parse(output));
}

function print(value) {
  process.stdout.write(`${typeof value === "string" ? value : JSON.stringify(value, null, 2)}\n`);
}

async function list(options) {
  let result;
  try {
    result = listEligibleWork(await fetchIssues(), { role: options.role, limit: 1, connectivityValid: true });
  } catch (error) {
    result = listEligibleWork([], {
      role: options.role,
      connectivityValid: false,
      connectivityMessage: error.message,
    });
  }
  print(result);
  if (!result.valid) process.exitCode = 75;
}

async function claim(options) {
  const issue = await fetchIssue(options.issue);
  const result = listEligibleWork([issue], { role: options.role, limit: 1, connectivityValid: true });
  if (!result.valid || result.items.length === 0) throw new Error(`Issue #${options.issue} is not eligible for role ${options.role}`);
  const handoff = buildClaimHandoff(issue, options.role);
  if (options.dryRun) return print({ dryRun: true, handoff });
  await runGithub(["issue", "comment", String(options.issue), "--repo", repo, "--body", renderHandoff(handoff)]);
  print({ claimed: true, handoffId: handoff.handoffId, issue: Number(options.issue) });
}

async function release(options) {
  if (!["blocked", "rejected"].includes(options.status)) throw new Error("Release status must be blocked or rejected");
  const issue = await fetchIssue(options.issue);
  const comments = issue.comments ?? [];
  if (!comments.some(comment => comment.body?.includes(options["handoff-id"]))) {
    throw new Error(`Cannot release stale or unknown handoff ${options["handoff-id"]}`);
  }
  const parts = String(options["handoff-id"]).split(":");
  const from = parts[2];
  const handoff = buildClaimHandoff(issue, from);
  handoff.handoffId = `${options["handoff-id"]}:${options.status}`;
  handoff.status = options.status;
  handoff.completed = [`released claim ${options["handoff-id"]}`];
  handoff.requiredNextAction = [options.status === "blocked" ? "pm-triage records the blocker" : "pm-triage records the rejection reason"];
  handoff.blockers = options.status === "blocked" ? ["claim released for triage"] : ["claim rejected for triage"];
  if (options.dryRun) return print({ dryRun: true, handoff });
  await runGithub(["issue", "comment", String(options.issue), "--repo", repo, "--body", renderHandoff(handoff)]);
  print({ released: true, handoffId: handoff.handoffId, issue: Number(options.issue) });
}

async function main() {
  const { mode, options } = args(process.argv.slice(2));
  if (!mode || !options.role && mode !== "release") throw new Error("Usage: list|claim --role <role> [--dry-run]");
  if (mode === "list") return list(options);
  if (mode === "claim") return claim(options);
  if (mode === "release") return release(options);
  throw new Error(`Unknown pickup mode: ${mode}`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
