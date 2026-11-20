import assert from "node:assert/strict";
import test from "node:test";

import { buildTransitionFingerprint, planIssueStateTransition, transitionIssueState } from "../src/issue-state-writer.mjs";

test("transition fingerprint is deterministic and scoped to one Issue and label snapshot", () => {
  const first = buildTransitionFingerprint({ issueNumber: 42, expectedLabels: ["status: qa", "agent: quality-engineer"], nextLabels: ["ready-for-human"], commentFingerprint: "handoff-1" });
  const same = buildTransitionFingerprint({ issueNumber: 42, expectedLabels: ["agent: quality-engineer", "status: qa"], nextLabels: ["ready-for-human"], commentFingerprint: "handoff-1" });
  const differentIssue = buildTransitionFingerprint({ issueNumber: 43, expectedLabels: ["status: qa", "agent: quality-engineer"], nextLabels: ["ready-for-human"], commentFingerprint: "handoff-1" });
  assert.equal(first, same);
  assert.notEqual(first, differentIssue);
  assert.match(first, /^<!-- CODEX_TRANSITION:v1:[a-f0-9]{64} -->$/);
});

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
  assert.equal(calls[0][1].headers, undefined);
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

test("state writer rejects a stale transition after its preparation snapshot changes", async () => {
  const calls = [];
  let reads = 0;
  const github = {
    rest: { issues: {
      get: async () => {
        reads += 1;
        return { data: { body: "Review gate: final-merge", labels: [{ name: reads === 1 ? "agent: quality-engineer" : "ready-for-human" }] } };
      },
      update: async (payload) => calls.push(payload),
      listComments: {},
    } },
    paginate: async () => [],
  };
  await assert.rejects(
    transitionIssueState({ github, owner: "o", repo: "r", issueNumber: 3, expectedLabels: ["agent: quality-engineer"], nextLabels: ["ready-for-human"], commentBody: "route", commentFingerprint: "handoff-3" }),
    /stale transition rejected/i,
  );
  assert.equal(calls.length, 0);
});

test("state writer requires an expected label snapshot", async () => {
  await assert.rejects(
    transitionIssueState({ github: { rest: { issues: {} } }, owner: "o", repo: "r", issueNumber: 4, nextLabels: ["ready-for-human"] }),
    /expectedLabels is required/i,
  );
});
