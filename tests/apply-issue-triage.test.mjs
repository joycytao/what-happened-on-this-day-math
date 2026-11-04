import test from "node:test";
import assert from "node:assert/strict";

import { applyIssueTriage } from "../scripts/apply-issue-triage.mjs";

const disposition = (items) => ({ requiresHumanReview: true, dispositions: items });

test("requires both a disposition file object and explicit confirmation", async () => {
  await assert.rejects(applyIssueTriage({ owner: "joycytao", repo: "math", disposition: null, confirm: true }), /disposition/);
  await assert.rejects(applyIssueTriage({ owner: "joycytao", repo: "math", disposition: disposition([]), confirm: false }), /--confirm/);
});

test("closes duplicates with a comment and adds backlog label", async () => {
  const calls = [];
  const result = await applyIssueTriage({
    owner: "joycytao",
    repo: "math",
    confirm: true,
    disposition: disposition([
      { issue: { number: 12, state: "OPEN" }, disposition: "close_duplicate", reason: "stable marker", replacement: { issueNumber: 7 }, evidence: ["marker: x"] },
      { issue: { number: 14, state: "OPEN" }, disposition: "backlog", reason: "owner request", evidence: ["explicit"] },
    ]),
    runCommand: async (args) => { calls.push(args); return ""; },
  });
  assert.deepEqual(result.results.map((item) => item.status), ["closed", "backlogged"]);
  assert.ok(calls.some((args) => args.includes("comment") && args.includes("12")));
  assert.ok(calls.some((args) => args.includes("close") && args.includes("12")));
  assert.ok(calls.some((args) => args.includes("--add-label") && args.includes("backlog")));
});

test("preserves blocked and review-required Issues without commands", async () => {
  const calls = [];
  const result = await applyIssueTriage({
    owner: "joycytao", repo: "math", confirm: true,
    disposition: disposition([
      { issue: { number: 15, state: "OPEN" }, disposition: "blocked", reason: "dependency", evidence: [] },
      { issue: { number: 17, state: "OPEN" }, disposition: "review_required", reason: "ambiguous", evidence: [] },
    ]),
    runCommand: async (args) => { calls.push(args); return ""; },
  });
  assert.deepEqual(result.results.map((item) => item.status), ["preserved_blocked", "review_required"]);
  assert.equal(calls.length, 0);
});

test("stops before the next mutation when the runner fails", async () => {
  const calls = [];
  await assert.rejects(applyIssueTriage({
    owner: "joycytao", repo: "math", confirm: true,
    disposition: disposition([
      { issue: { number: 12, state: "OPEN" }, disposition: "close_duplicate", reason: "duplicate", replacement: { issueNumber: 7 }, evidence: [] },
      { issue: { number: 14, state: "OPEN" }, disposition: "backlog", reason: "explicit", evidence: [] },
    ]),
    runCommand: async (args) => { calls.push(args); throw new Error("fetch failed"); },
  }), /fetch failed/);
  assert.equal(calls.length, 1);
});
