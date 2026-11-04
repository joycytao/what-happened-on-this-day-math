import assert from "node:assert/strict";
import test from "node:test";

import {
  findDuplicateHandoffIds,
  parseHandoff,
  renderHandoff,
  validateHandoff,
} from "../src/agent-handoff.mjs";

const validMarkdown = [
  "<!-- CODEX_HANDOFF:v1 -->",
  "",
  "## Handoff",
  "",
  "- Handoff ID: `repo:187:architect:developer:1`",
  "- From: `architect`",
  "- To: `developer`",
  "- Work item: `joycytao/what-happened-on-this-day-math#187`",
  "- Status: `completed`",
  "- Completed:",
  "  - loader boundary decided",
  "- Required next action:",
  "  - implement the loader",
  "- Evidence:",
  "  - #187 decision comment",
  "- Constraints:",
  "  - do not create a committed CSV export",
  "- Blockers:",
  "  - none",
  "- Expected output:",
  "  - implementation PR",
  ""].join("\n");

test("parses a complete v1 handoff into a normalized object", () => {
  const result = parseHandoff(validMarkdown);

  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.deepEqual(result.handoff, {
    handoffId: "repo:187:architect:developer:1",
    from: "architect",
    to: "developer",
    workItem: "joycytao/what-happened-on-this-day-math#187",
    status: "completed",
    completed: ["loader boundary decided"],
    requiredNextAction: ["implement the loader"],
    evidence: ["#187 decision comment"],
    constraints: ["do not create a committed CSV export"],
    blockers: ["none"],
    expectedOutput: ["implementation PR"],
  });
});

test("rejects a handoff without the v1 marker", () => {
  const result = parseHandoff(validMarkdown.replace("<!-- CODEX_HANDOFF:v1 -->", ""));

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("marker_missing"));
});

test("rejects invalid roles and statuses", () => {
  const result = parseHandoff(validMarkdown
    .replace("`architect`", "`researcher`")
    .replace("`completed`", "`running`"));

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("from_role_invalid"));
  assert.ok(result.errors.includes("status_invalid"));
});

test("rejects malformed work items and empty next actions", () => {
  const result = parseHandoff(validMarkdown
    .replace("joycytao/what-happened-on-this-day-math#187", "187")
    .replace("  - implement the loader", "  - "));

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("work_item_invalid"));
  assert.ok(result.errors.includes("required_next_action_empty"));
});

test("validates handoff objects and detects duplicate IDs", () => {
  const parsed = parseHandoff(validMarkdown);
  assert.equal(validateHandoff(parsed.handoff).valid, true);
  assert.deepEqual(findDuplicateHandoffIds([parsed.handoff, parsed.handoff]), [parsed.handoff.handoffId]);
});

test("renders a stable v1 handoff comment", () => {
  const parsed = parseHandoff(validMarkdown);
  const rendered = renderHandoff(parsed.handoff);

  assert.equal(rendered, validMarkdown);
});
