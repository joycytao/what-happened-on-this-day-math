import assert from "node:assert/strict";
import test from "node:test";

import { planIssueStateTransition, transitionIssueState } from "../src/issue-state-writer.mjs";

test("state writer rejects stale label snapshots", () => {
  const result = planIssueStateTransition({
    currentLabels: ["agent: developer", "status: ready to pickup"],
    expectedLabels: ["agent: pm-triage", "status: pending review"],
    nextLabels: ["agent: quality-engineer", "status: qa"],
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /compare-and-swap/i);
});

test("state writer validates the complete next label set", () => {
  const result = planIssueStateTransition({
    currentLabels: ["agent: quality-engineer", "status: qa"],
    nextLabels: ["ready-for-human"],
    body: "Review gate: routine",
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /routine|final-merge/i);
});

test("state writer performs one label update and idempotent comment write", async () => {
  const calls = [];
  const github = {
    rest: {
      issues: {
        get: async () => ({ headers: { etag: '"state-v1"' }, data: { body: "Review gate: final-merge", labels: [{ name: "agent: quality-engineer" }] } }),
        update: async (payload) => { calls.push(["update", payload]); },
        createComment: async (payload) => { calls.push(["comment", payload]); },
        listComments: {},
      },
    },
    paginate: async () => [],
  };
  const result = await transitionIssueState({
    github,
    owner: "o",
    repo: "r",
    issueNumber: 1,
    expectedLabels: ["agent: quality-engineer"],
    nextLabels: ["ready-for-human"],
    commentBody: "<!-- transition:1 --> routed",
    commentFingerprint: "<!-- transition:1 -->",
  });
  assert.equal(result.commentCreated, true);
  assert.deepEqual(calls.map(([kind]) => kind), ["update", "comment"]);
  assert.equal(calls[0][1].headers["if-match"], '"state-v1"');
});

test("state writer skips a duplicate fingerprint comment", async () => {
  const calls = [];
  const github = {
    rest: { issues: {
      get: async () => ({ data: { body: "Review gate: final-merge", labels: [{ name: "agent: quality-engineer" }] } }),
      createComment: async (payload) => calls.push(payload),
      listComments: {},
    } },
    paginate: async () => [{ body: '<!-- transition:2 --> already recorded' }],
  };
  const result = await transitionIssueState({
    github, owner: "o", repo: "r", issueNumber: 2,
    expectedLabels: ["agent: quality-engineer"], nextLabels: ["agent: quality-engineer"],
    commentBody: '<!-- transition:2 --> duplicate', commentFingerprint: '<!-- transition:2 -->',
  });
  assert.equal(result.commentCreated, false);
  assert.equal(calls.length, 0);
});
