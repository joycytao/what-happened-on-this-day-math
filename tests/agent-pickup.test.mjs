import assert from "node:assert/strict";
import test from "node:test";

import { buildClaimHandoff, listEligibleWork } from "../src/agent-pickup.mjs";

const issue = (overrides = {}) => ({
  number: 187,
  title: "Resolve the open question",
  html_url: "https://github.com/joycytao/what-happened-on-this-day-math/issues/187",
  created_at: "2026-10-01T09:00:00Z",
  labels: ["status: ready to pickup", "agent: developer"],
  ...overrides,
});

test("selects the oldest eligible work and only one item per cycle", () => {
  const result = listEligibleWork([
    issue({ number: 190, created_at: "2026-10-03T09:00:00Z" }),
    issue({ number: 187, created_at: "2026-10-01T09:00:00Z" }),
  ], { role: "developer", limit: 1, connectivityValid: true });

  assert.equal(result.valid, true);
  assert.deepEqual(result.items.map(item => item.number), [187]);
});

test("excludes blocked, paused, claimed, and unapproved work", () => {
  const result = listEligibleWork([
    issue({ number: 187 }),
    issue({ number: 188, labels: ["status: blocked", "agent: developer"] }),
    issue({ number: 189, labels: ["status: ready to pickup", "state: paused", "agent: developer"] }),
    issue({ number: 190, labels: ["status: ready to pickup", "state: implementation", "agent: developer"] }),
    issue({ number: 191, labels: ["agent: developer"] }),
  ], { role: "developer", connectivityValid: true });

  assert.deepEqual(result.items.map(item => item.number), [187]);
});

test("requires a role/state handoff for decision and QA roles", () => {
  const decision = listEligibleWork([issue({ labels: ["state: decision-requested", "agent: architect"] })], {
    role: "architect", connectivityValid: true,
  });
  const qa = listEligibleWork([issue({ labels: ["state: qa", "agent: quality-engineer"] })], {
    role: "quality-engineer", connectivityValid: true,
  });

  assert.equal(decision.items.length, 1);
  assert.equal(qa.items.length, 1);
});

test("excludes a role mismatch", () => {
  const result = listEligibleWork([issue({ labels: ["status: ready to pickup", "agent: architect"] })], {
    role: "developer", connectivityValid: true,
  });

  assert.deepEqual(result.items, []);
});

test("connectivity failure is a blocker, not an empty queue", () => {
  const result = listEligibleWork([], { role: "developer", connectivityValid: false, connectivityMessage: "GitHub unavailable" });

  assert.equal(result.valid, false);
  assert.deepEqual(result.items, []);
  assert.deepEqual(result.blockers, ["GitHub unavailable"]);
});

test("builds a deterministic accepted claim handoff", () => {
  const result = buildClaimHandoff(issue({ number: 203 }), "developer");

  assert.equal(result.handoffId, "what-happened-on-this-day-math:203:developer:claim");
  assert.equal(result.from, "developer");
  assert.equal(result.to, "quality-engineer");
  assert.equal(result.status, "accepted");
  assert.match(result.workItem, /#203$/);
});
