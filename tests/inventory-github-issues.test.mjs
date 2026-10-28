import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { inventoryIssues, writeInventoryReport } from "../scripts/inventory-github-issues.mjs";

const issuePage1 = [{ number: 1, title: "One", state: "OPEN", body: "<!-- social-marker:one --> See #9", labels: [{ name: "status: pending review" }], updatedAt: "2026-10-01T00:00:00Z", url: "https://github.com/example/repo/issues/1" }];
const issuePage2 = [{ number: 2, title: "Two", state: "CLOSED", body: "<!-- monthly-production:2027-01:tpt -->", labels: [], updatedAt: "2026-10-02T00:00:00Z", url: "https://github.com/example/repo/issues/2" }];

test("inventory fetches paginated issues, PRs, labels, and projects through the runner", async () => {
  const calls = [];
  const runCommand = async (args) => {
    calls.push(args);
    const text = args.join(" ");
    if (text.includes("issue list")) return JSON.stringify([...issuePage1, ...issuePage2]);
    if (text.includes("pr list")) return JSON.stringify([{ number: 9, title: "Fix", state: "OPEN", body: "Fixes #1", updatedAt: "2026-10-03T00:00:00Z", url: "https://github.com/example/repo/pull/9" }]);
    if (text.includes("label list")) return JSON.stringify([{ name: "status: pending review" }]);
    if (text.includes("project list")) return JSON.stringify({ projects: [{ number: 2, title: "Social" }] });
    if (text.includes("project item-list")) return JSON.stringify({ items: [{ content: { number: 1 }, project: { number: 2, title: "Social" } }] });
    throw new Error(`unexpected command: ${text}`);
  };
  const result = await inventoryIssues({ owner: "joycytao", repo: "math", runCommand });
  assert.equal(result.connectivity.valid, true);
  assert.equal(result.issues.length, 2);
  assert.deepEqual(result.issues[0].bodyMarkers, ["social-marker:one"]);
  assert.deepEqual(result.issues[0].linkedPRs.map((pr) => pr.number), [9]);
  assert.deepEqual(result.issues[1].bodyMarkers, ["monthly-production:2027-01:tpt"]);
  assert.deepEqual(result.issues[0].projectMemberships, [{ number: 2, title: "Social" }]);
  assert.ok(calls.some((args) => args.includes("--limit") && args.includes("1000")));
});

test("inventory fails closed on runner/network errors", async () => {
  await assert.rejects(
    inventoryIssues({ owner: "joycytao", repo: "math", runCommand: async () => { throw new Error("fetch failed"); } }),
    /fetch failed/
  );
});

test("report writer emits the inventory without secrets", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "issue-inventory-"));
  const output = path.join(directory, "inventory.json");
  const report = { fetchedAt: "2026-10-27T00:00:00Z", issues: [], labels: [], projects: [], connectivity: { valid: true } };
  await writeInventoryReport(report, output);
  assert.deepEqual(JSON.parse(fs.readFileSync(output, "utf8")), report);
  assert.doesNotMatch(fs.readFileSync(output, "utf8"), /token|secret|authorization/i);
});
