# Existing Issue Triage and Backlog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce an evidence-backed inventory and safe disposition plan for existing Issues before applying close or `backlog` changes.

**Architecture:** First run a read-only GitHub inventory through the repository runner. A deterministic classifier produces recommendations only; a human-reviewed disposition file is required before any close or label mutation. Historical Issues are never deleted.

**Tech Stack:** Node.js 22, repository GitHub runner, GitHub REST API, JSON reports, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-27-monthly-production-and-social-board-design.md`

## Global Constraints

- Use `node scripts/github-app-command.mjs -- gh ...` for every GitHub CLI read/write.
- A failed GitHub read is an error, never an empty inventory.
- No Issue is deleted.
- No Issue is closed solely because it is old.
- Ambiguous Issues remain untouched.

## Review Focus

- Network/auth failure: stop before any mutation and report the failure.
- Closed historical Issues: preserve state and evidence.
- Duplicate detection: require stable marker or explicit replacement evidence.
- Blocked dependencies: never downgrade `status: blocked` to backlog.
- Partial mutation: record each successful change and make reruns idempotent.

### Task 1: Build the read-only inventory

**Files:**
- Create: `scripts/inventory-github-issues.mjs`
- Create: `reports/issue-triage-inventory.schema.json`
- Create: `tests/inventory-github-issues.test.mjs`
- Modify: `package.json`

**Interfaces:**
- `inventoryIssues({ owner, repo }) -> { fetchedAt, issues, labels, projects, connectivity }`.
- Output must include number, title, state, labels, body markers, linked PRs, updated date, and project memberships when available.

- [ ] Test successful inventory, pagination, and explicit network failure.
- [ ] Implement the runner invocation and fail closed on connectivity/auth errors.
- [ ] Write a report under `reports/` without secrets.
- [ ] Run the focused test.
- [ ] Commit `feat: inventory GitHub issues for triage`.

### Task 2: Classify dispositions without mutating GitHub

**Files:**
- Create: `src/issue-triage.mjs`
- Create: `tests/issue-triage.test.mjs`
- Create: `examples/issue-triage-disposition.example.json`

**Interfaces:**
- `classifyIssue(issue, context) -> { disposition, reason, evidence, replacement }`.
- Allowed dispositions: `close_duplicate`, `backlog`, `blocked`, `preserve_closed`, `review_required`.

- [ ] Test duplicate marker, valid backlog, blocked dependency, completed historical issue, and ambiguous issue.
- [ ] Implement evidence-first classification; never infer closure from age alone.
- [ ] Emit a human-review disposition file.
- [ ] Run focused tests.
- [ ] Commit `feat: classify issue triage dispositions`.

### Task 3: Add an explicitly approved mutation command

**Files:**
- Create: `scripts/apply-issue-triage.mjs`
- Create: `tests/apply-issue-triage.test.mjs`
- Modify: `.github/README.md`

- [ ] Require an explicit disposition file and a `--confirm` flag.
- [ ] Test close-with-comment, add-backlog-label, preserve-blocked, and no-op behavior.
- [ ] Implement per-Issue logging and stable rerun behavior through the repository runner.
- [ ] Stop on connectivity failure before making subsequent mutations.
- [ ] Run focused tests and a dry-run inventory.
- [ ] Commit `feat: apply approved issue triage safely`.

### Task 4: Execute the first inventory review

**Files:**
- Create: `reports/issue-triage-YYYY-MM-DD.json`
- Create: `docs/issue-triage-runbook.md`

- [ ] Run the read-only inventory.
- [ ] Have the owner review the disposition file.
- [ ] Apply only approved close/backlog changes.
- [ ] Verify changed Issues and record the final report.
- [ ] Commit `docs: record initial issue triage`.
