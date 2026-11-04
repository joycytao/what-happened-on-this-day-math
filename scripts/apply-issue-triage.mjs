import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = path.resolve(new URL(".", import.meta.url).pathname, "..");
const runner = path.join(root, "scripts/github-app-command.mjs");

async function defaultRunCommand(args) {
  const result = await execFileAsync(process.execPath, [runner, "--", "gh", ...args], { cwd: root, maxBuffer: 5 * 1024 * 1024 });
  return result.stdout;
}

function repoArgs(owner, repo, number) {
  return [String(number), "--repo", `${owner}/${repo}`];
}

export async function applyIssueTriage({ owner, repo, disposition, confirm = false, runCommand = defaultRunCommand }) {
  if (!disposition || !Array.isArray(disposition.dispositions)) throw new Error("a disposition file is required");
  if (!confirm) throw new Error("explicit --confirm is required before mutation");
  const results = [];
  for (const item of disposition.dispositions) {
    const number = Number(item.issue?.number);
    if (!Number.isInteger(number)) throw new Error("each disposition must include an Issue number");
    if (item.disposition === "close_duplicate") {
      if (String(item.issue?.state).toLowerCase() === "closed") {
        results.push({ number, status: "already_closed" });
        continue;
      }
      const replacement = item.replacement?.issueNumber ? ` Replacement: #${item.replacement.issueNumber}.` : "";
      const comment = `Triage evidence: this Issue duplicates a stable marker owned by another Issue.${replacement}\n\nEvidence: ${(item.evidence || []).join(", ")}`;
      await runCommand(["issue", "comment", ...repoArgs(owner, repo, number), "--body", comment]);
      await runCommand(["issue", "close", ...repoArgs(owner, repo, number), "--reason", "not planned"]);
      results.push({ number, status: "closed" });
      continue;
    }
    if (item.disposition === "backlog") {
      const labels = (item.issue?.labels || []).map((label) => typeof label === "string" ? label : label?.name).filter(Boolean);
      if (labels.includes("backlog")) {
        results.push({ number, status: "already_backlog" });
        continue;
      }
      await runCommand(["issue", "edit", ...repoArgs(owner, repo, number), "--add-label", "backlog"]);
      results.push({ number, status: "backlogged" });
      continue;
    }
    if (item.disposition === "blocked") results.push({ number, status: "preserved_blocked" });
    else if (item.disposition === "preserve_closed") results.push({ number, status: "preserved" });
    else results.push({ number, status: "review_required" });
  }
  return { confirm: true, results };
}

async function main() {
  const fileIndex = process.argv.indexOf("--disposition");
  const dispositionPath = fileIndex >= 0 ? process.argv[fileIndex + 1] : "";
  const ownerIndex = process.argv.indexOf("--owner");
  const repoIndex = process.argv.indexOf("--repo");
  const disposition = JSON.parse(await fs.readFile(dispositionPath, "utf8"));
  const result = await applyIssueTriage({ owner: process.argv[ownerIndex + 1], repo: process.argv[repoIndex + 1], disposition, confirm: process.argv.includes("--confirm") });
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] === new URL(import.meta.url).pathname) main().catch((error) => { console.error(`triage mutation stopped: ${error.message}`); process.exitCode = 1; });
