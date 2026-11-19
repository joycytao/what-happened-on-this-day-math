import assert from "node:assert/strict";
import test from "node:test";

import {
  DEPRECATED_DERIVED_LABELS,
  reconcileDerivedLabels,
  validateDerivedLabelInvariant,
} from "../src/derived-label-reconciliation.mjs";

test("reconciliation maps aliases and removes deprecated queue labels", () => {
  const result = reconcileDerivedLabels([
    "type: feature", "agent: developer", "agent-requested", "status:ready to pickup",
  ]);
  assert.equal(result.valid, true);
  assert.deepEqual(result.labels, ["type: feature", "agent: developer", "status: ready to pickup"]);
  assert.deepEqual(result.remove, ["agent-requested", "status:ready to pickup"]);
  assert.deepEqual(result.add, ["status: ready to pickup"]);
});

test("handoff reconciliation leaves exactly one owner and workflow state", () => {
  const result = reconcileDerivedLabels(
    ["type: feature", "agent: developer", "status: ready to pickup", "agent-requested"],
    ["agent: quality-engineer", "status: qa"],
  );
  assert.equal(result.valid, true);
  assert.deepEqual(result.labels, ["type: feature", "agent: quality-engineer", "status: qa"]);
  assert.deepEqual(validateDerivedLabelInvariant(result.labels).owners, ["agent: quality-engineer"]);
});

test("conflicting derived state fails closed instead of guessing", () => {
  const result = reconcileDerivedLabels(["agent: developer", "agent: quality-engineer", "status: qa"]);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /exactly one owner/);
  assert.deepEqual(result.add, []);
  assert.deepEqual(result.remove, []);
});

test("deprecated labels are explicit and cannot become canonical state", () => {
  assert.ok(DEPRECATED_DERIVED_LABELS.has("agent-requested"));
  assert.ok(DEPRECATED_DERIVED_LABELS.has("status:ready to pickup"));
  assert.ok(DEPRECATED_DERIVED_LABELS.has("state: blocked"));
});
