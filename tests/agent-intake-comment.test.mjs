import assert from "node:assert/strict";
import test from "node:test";

import {
  AGENT_INTAKE_MARKER,
  agentIntakeFingerprint,
  buildAgentIntakeComment,
  findAgentIntakeComments,
  intakeCommentPlan,
} from "../src/agent-intake-comment.mjs";

test("fingerprint is stable, versioned, and scoped to one Issue", () => {
  assert.equal(agentIntakeFingerprint(296), "<!-- codex-agent-intake:v1:issue-296 -->");
  assert.throws(() => agentIntakeFingerprint(0), /positive integer/);
});

test("legacy marker is recognized so migration cannot duplicate intake comments", () => {
  const comments = [{ id: 1, body: `${AGENT_INTAKE_MARKER}\nCODEX_AGENT_INTAKE` }];
  assert.equal(findAgentIntakeComments(comments, 296).length, 1);
  assert.equal(intakeCommentPlan(comments, 296, "CODEX_AGENT_INTAKE").action, "update");
});

test("same fingerprint and body are idempotent", () => {
  const body = buildAgentIntakeComment(296, "CODEX_AGENT_INTAKE\n\nqueue");
  const result = intakeCommentPlan([{ id: 7, body }], 296, "CODEX_AGENT_INTAKE\n\nqueue");
  assert.equal(result.action, "noop");
  assert.equal(result.existing.length, 1);
});

test("changed queue diagnosis updates the primary comment instead of creating noise", () => {
  const result = intakeCommentPlan([{ id: 7, body: "<!-- codex-agent-intake:v1:issue-296 -->\nold" }], 296, "new queue");
  assert.equal(result.action, "update");
  assert.equal(result.commentId, 7);
  assert.equal(result.existing.length, 1);
});

test("no existing fingerprint creates exactly one comment", () => {
  const result = intakeCommentPlan([], 296, "CODEX_AGENT_INTAKE");
  assert.equal(result.action, "create");
  assert.match(result.body, /codex-agent-intake:v1:issue-296/);
});
