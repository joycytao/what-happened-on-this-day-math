import assert from "node:assert/strict";
import test from "node:test";

import {
  findDuplicateHandoffIds,
  parseHandoff,
  renderCompactHandoff,
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
  "- Output kind: `architecture-decision`",
  "- Return path: `pm-triage`",
  "- Prerequisites satisfied:",
  "  - decision scope is recorded",
  "- Prerequisites missing:",
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
    outputKind: "architecture-decision",
    returnPath: "pm-triage",
    prerequisitesSatisfied: ["decision scope is recorded"],
    prerequisitesMissing: [],
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

test("accepts ready-for-human as the terminal handoff target", () => {
  const result = parseHandoff(validMarkdown
    .replace("`developer`", "`ready-for-human`")
    .replace("`architect`", "`quality-engineer`"));

  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.handoff.to, "ready-for-human");
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

test("renders a compact handoff with one next action and no repeated lists", () => {
  const parsed = parseHandoff(validMarkdown);
  const compact = renderCompactHandoff(parsed.handoff);
  assert.match(compact, /- Next action: implement the loader/);
  assert.match(compact, /- Reason: implement the loader/);
  assert.match(compact, /- Preconditions: do not create a committed CSV export/);
  assert.match(compact, /- Human decision: no/);
  assert.match(compact, /- Evidence: #187 decision comment/);
  assert.doesNotMatch(compact, /- Completed:/);
  assert.doesNotMatch(compact, /- Expected output:/);
});
