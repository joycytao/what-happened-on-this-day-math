import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = path.resolve(new URL(".", import.meta.url).pathname, "..");
const runner = path.join(root, "scripts/github-app-command.mjs");

async function defaultRunCommand(args) {
  const result = await execFileAsync(process.execPath, [runner, "--", "gh", ...args], { cwd: root, maxBuffer: 20 * 1024 * 1024 });
  return result.stdout;
}

function parseJson(value, description) {
  try { return JSON.parse(value); } catch (error) { throw new Error(`${description} returned invalid JSON: ${error.message}`); }
}

function bodyMarkers(body) {
  return [...String(body || "").matchAll(/<!--\s*([^<>\n]+?)\s*-->/g)].map((match) => match[1].trim()).filter(Boolean);
}

function normalizeProjectList(value) {
  const parsed = typeof value === "string" ? parseJson(value, "project list") : value;
  return Array.isArray(parsed) ? parsed : parsed?.projects || [];
}

export async function inventoryIssues({ owner, repo, runCommand = defaultRunCommand }) {
  if (!owner || !repo) throw new Error("owner and repo are required");
  const command = (args) => runCommand(args);
  const issueRaw = await command(["issue", "list", "--repo", `${owner}/${repo}`, "--state", "all", "--limit", "1000", "--json", "number,title,state,labels,body,updatedAt,url"]);
  const prRaw = await command(["pr", "list", "--repo", `${owner}/${repo}`, "--state", "all", "--limit", "1000", "--json", "number,title,state,body,updatedAt,url"]);
  const labelRaw = await command(["label", "list", "--repo", `${owner}/${repo}`, "--limit", "1000", "--json", "name,color,description"]);
  const projectRaw = await command(["project", "list", "--owner", owner, "--format", "json"]);
  const issues = parseJson(issueRaw, "issue list");
  const prs = parseJson(prRaw, "pr list");
  const labels = parseJson(labelRaw, "label list");
  const projects = normalizeProjectList(projectRaw);
  const memberships = new Map();
  for (const project of projects) {
    if (!Number.isInteger(Number(project.number))) continue;
    const itemRaw = await command(["project", "item-list", String(project.number), "--owner", owner, "--format", "json"]);
    const items = typeof itemRaw === "string" ? parseJson(itemRaw, `project item-list ${project.number}`) : itemRaw;
    const normalizedItems = Array.isArray(items) ? items : items?.items || [];
    for (const item of normalizedItems) {
      const issueNumber = Number(item.content?.number ?? item.number);
      if (!Number.isInteger(issueNumber)) continue;
      const entry = memberships.get(issueNumber) || [];
      entry.push({ number: Number(project.number), title: project.title || project.name || "" });
      memberships.set(issueNumber, entry);
    }
  }
  const normalizedIssues = issues.map((issue) => ({
    number: issue.number,
    title: issue.title,
    state: issue.state,
    labels: (issue.labels || []).map((label) => typeof label === "string" ? label : label.name).filter(Boolean),
    bodyMarkers: bodyMarkers(issue.body),
    linkedPRs: prs.filter((pr) => new RegExp(`(?:#|issues/)${issue.number}(?:\\b|$)`).test(`${pr.body || ""} ${pr.url || ""}`)).map(({ number, title, state, updatedAt, url }) => ({ number, title, state, updatedAt, url })),
    updatedAt: issue.updatedAt,
    url: issue.url,
    projectMemberships: memberships.get(issue.number) || [],
  }));
  return {
    fetchedAt: new Date().toISOString(),
    issues: normalizedIssues,
    labels,
    projects,
    connectivity: { valid: true, runner: "scripts/github-app-command.mjs" },
  };
}

export async function writeInventoryReport(report, outputPath = path.join(root, "reports/issue-triage-inventory.json")) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return outputPath;
}

function option(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  inventoryIssues({ owner: option("--owner"), repo: option("--repo") })
    .then(async (report) => { const output = await writeInventoryReport(report, option("--output") || undefined); console.log(JSON.stringify({ output, issues: report.issues.length }, null, 2)); })
    .catch((error) => { console.error(`inventory failed closed: ${error.message}`); process.exitCode = 1; });
}
