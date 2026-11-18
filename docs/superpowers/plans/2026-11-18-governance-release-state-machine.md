# Governance Release State Machine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make release approval, dispatch, and agent handoffs explicit, idempotent, and machine-validated.

**Architecture:** One canonical release state machine will separate QA, human approval, dispatch readiness, and completion. Release identity will be the artifact manifest and hashes, not a workflow run. Handoffs will remain auditable but will stop at human gates and will be validated by deterministic checks.

**Tech Stack:** GitHub Actions, GitHub Script, Node.js ESM, JSON manifests, Node test runner.

**Spec:** `docs/agent-governance.md`, `docs/agents/triage-labels.md`, and the retrospective triggered by Issue #247's repeated approval/reset cycle.

## Global Constraints

- Public publication and downstream dispatch require one explicit Human Accountable Owner approval.
- `status: ready to dispatch` means approval is complete and the exact release is queued for dispatch.
- Approval is valid only for the immutable release manifest and artifact hashes.
- Handoff comments are written only for owner/state transitions, not internal polling.
- Existing unrelated worktree changes remain untouched.

## Review Focus

- A metadata-only rerun must not invalidate approval when artifact hashes are unchanged.
- An artifact change must invalidate the prior approval and return to the human gate.
- Every legal state transition must have one matching handoff record.
- A human gate must stop the workstream until an approval event is observed.
- GitHub Script syntax errors must fail CI before a workflow is dispatched.

### Task 1: Canonical release state machine

**Files:**
- Modify: `docs/agent-governance.md`
- Modify: `docs/agents/triage-labels.md`
- Modify: `.github/labels.yml`
- Test: `tests/issue-governance.test.mjs`

- [x] Define one transition table: `status: qa` → `ready-for-human` → `status: ready to dispatch` → `status: done`.
- [x] Clarify that `ready-for-human` is pending approval and `ready to dispatch` is post-approval.
- [x] Add tests for legal transitions and rejection of the old ambiguous interpretation.

### Task 2: Immutable release identity and approval reconciliation

**Files:**
- Modify: `src/issue-governance.mjs`
- Modify: `scripts/validate-issue-governance.mjs`
- Modify: `.github/workflows/reconcile-issue-governance.yml`
- Modify: `.github/workflows/monthly-package-release.yml`
- Test: `tests/issue-governance.test.mjs`
- Test: `tests/monthly-release-dispatch.test.mjs`

- [x] Derive a stable release identity from package version, source commit, manifest fields, and artifact hashes.
- [x] Preserve approval across metadata-only reruns with the same release identity.
- [x] Reopen the human gate when any publishable artifact hash changes.
- [x] Store the release identity in the approval and dispatch records.

### Task 3: Human-gate stop/resume behavior

**Files:**
- Modify: `.github/workflows/handoff-router.yml`
- Modify: `.github/workflows/monthly-package-release.yml`
- Test: `tests/monthly-release-dispatch.test.mjs`

- [x] Stop automated downstream dispatch while the issue has `ready-for-human` without a matching approval for the current release identity.
- [x] Resume only after the approval event is validated.
- [x] Make the workflow idempotent when the same approval and release identity are observed again.

### Task 4: Compact handoff contract

**Files:**
- Modify: `docs/agent-governance.md`
- Modify: `docs/agents/triage-labels.md`
- Modify: `.github/workflows/handoff-router.yml`
- Test: `tests/issue-governance.test.mjs`

- [x] Restrict new `CODEX_HANDOFF:v1` output to owner/state transitions and human-gate resolution while retaining the legacy parser.
- [x] Require only current owner, current state, next action, blocker, evidence, and return path in new pickup comments.
- [x] Keep polling/status checks from emitting additional handoff comments.

### Task 5: Deterministic governance and workflow checks

**Files:**
- Modify: `package.json`
- Create: `scripts/validate-github-scripts.mjs`
- Create: `tests/github-script-syntax.test.mjs`
- Modify: `.github/workflows/governance-invariants.yml`

- [x] Extract and syntax-check every inline `actions/github-script` block.
- [x] Validate the state transition matrix and canonical label set in CI.
- [x] Add the checks to governance validation without requiring external credentials.

### Task 6: Prune and redirect agent instructions

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/agent-governance.md`
- Modify: `docs/agents/triage-labels.md`

- [x] Keep `AGENTS.md` as a short navigation and non-negotiable constraints file.
- [x] Make `docs/agent-governance.md` the single source of truth for the state machine.
- [x] Keep `docs/agents/triage-labels.md` as a label reference only.
- [x] Remove duplicated transition tables and stale meanings.

## Verification

- Run `npm test`.
- Run the governance-specific tests directly.
- Run the GitHub Script syntax validator against every workflow.
- Run `git diff --check`.
- Verify the PR contains no unrelated files and includes a `Fixes #<number>` reference for the implementation issue.
