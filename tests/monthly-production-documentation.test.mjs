import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("monthly production documentation records schedule, graph, gates, and recovery evidence", () => {
  const release = fs.readFileSync("docs/monthly-release-workflow.md", "utf8");
  const orchestration = fs.readFileSync("docs/monthly-production-orchestration.md", "utf8");
  assert.match(release, /third Monday/);
  assert.match(release, /America\/Chicago/);
  assert.match(release, /monthly-production-orchestration\.md/);
  for (const term of ["context-source", "release-qa", "landing-page", "tpt", "stale", "status: ready to pickup"]) {
    assert.match(orchestration, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(orchestration, /no live GitHub\s+mutation/);
});
