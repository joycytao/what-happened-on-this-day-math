import { readFile } from "node:fs/promises";
const workflow = await readFile(new URL("../.github/workflows/post-merge-reconciliation.yml", import.meta.url), "utf8");
const moduleSource = await readFile(new URL("../src/post-merge-reconciliation.mjs", import.meta.url), "utf8");
const required = ["pull_request:", "types: [closed]", "github.event.pull_request.merged == true", "src/post-merge-reconciliation.mjs", "extractLinkedIssueNumbers", "buildTerminalLabels", "src/issue-state-writer.mjs", "transitionIssueState", "CODEX_POST_MERGE_RECONCILIATION:v1", "issues: write", "concurrency:", "cancel-in-progress: false", "status: done"];
const errors = required.filter((token) => !workflow.includes(token) && !moduleSource.includes(token)).map((token) => `post-merge reconciliation missing ${token}`);
if (/github\.rest\.issues\.(update|addLabels|removeLabel|createComment)\s*\(/.test(workflow)) errors.push("post-merge reconciliation contains a direct Issue mutation");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("Post-merge reconciliation contract passed");
