# Monthly Context Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create an idempotent third-Monday 09:00 Central workflow that opens the next two-month monthly context Issue and validates owner-supplied JSON comments.

**Architecture:** A scheduled GitHub Actions workflow computes the target `YYYY-MM`, creates or updates one marked context Issue, and does not start production until the owner applies `status: ready to pickup`. A small pure Node module parses the marked JSON comment and emits a deterministic validation result for later orchestration.

**Tech Stack:** GitHub Actions, Node.js 22, JSON Schema, Node test runner, GitHub REST API via `actions/github-script`.

**Spec:** `docs/superpowers/specs/2026-10-27-monthly-production-and-social-board-design.md`

## Global Constraints

- Schedule at 09:00 `America/Chicago` on the third Monday.
- Target the month two calendar months after the scheduler's current month.
- Use a stable `YYYY-MM` marker and never create duplicates on rerun.
- Accept one JSON code block in an Issue comment; raw content may be Chinese.
- Approval requires the exact label `status: ready to pickup`.
- Do not introduce Excel or mutate unrelated Issues.

## Review Focus

- DST and third-Monday boundaries: test March/November Central Time dates.
- January/December year rollover: test November → January target calculation.
- Duplicate comments and reruns: select the newest marked valid input deterministically and update one Issue.
- Malformed/incomplete JSON: return actionable errors and never authorize production.
- Day-count mismatch: reject missing, duplicate, or out-of-month dates.

### Task 1: Define and validate the raw monthly input contract

**Files:**
- Create: `schemas/monthly-context-input.schema.json`
- Create: `src/monthly-context-input.mjs`
- Create: `tests/monthly-context-input.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produce `parseMonthlyContextComment(comments) -> { valid, input, commentId, errors }`.
- Produce `targetMonthFromSchedulerDate(date) -> { year, month, isoMonth }`.
- Produce `expectedDaysInMonth(year, month) -> number`.

- [ ] Write tests for valid Chinese input, missing days, duplicate dates, malformed JSON, missing levels, and December rollover.
- [ ] Run `node --test tests/monthly-context-input.test.mjs` and confirm failure.
- [ ] Implement the schema and pure parser without network calls or code execution.
- [ ] Run the focused test and `npm test`.
- [ ] Commit `feat: validate monthly context input`.

### Task 2: Add the scheduled context Issue workflow

**Files:**
- Create: `.github/workflows/monthly-context-queue.yml`
- Create: `scripts/build-monthly-context-issue.mjs`
- Create: `tests/monthly-context-queue-workflow.test.mjs`

**Interfaces:**
- `buildMonthlyContextIssue({ now, repository, runUrl }) -> { marker, targetMonth, title, body, labels }`.
- Workflow input: scheduled Monday event; output: exactly one open context Issue for target month.

- [ ] Test third-Monday guard for dates 15–21 and rejection of other Mondays.
- [ ] Test title, marker, target month, expected day count, JSON instructions, and approval label.
- [ ] Implement deterministic issue creation/update using the marker.
- [ ] Run focused workflow-plan tests.
- [ ] Commit `feat: schedule monthly context intake`.

### Task 3: Document the owner comment protocol

**Files:**
- Create: `.github/ISSUE_TEMPLATE/monthly-context-input.md`
- Modify: `.github/README.md`
- Create: `docs/monthly-context-input.md`

- [ ] Document the exact JSON fence and marker expected in comments.
- [ ] Document the `status: ready to pickup` approval step and validation failures.
- [ ] Run markdown/link checks available in the repository.
- [ ] Commit `docs: document monthly context intake`.

### Task 4: Verify idempotency with a local fixture

**Files:**
- Create: `examples/monthly-context-input.example.json`
- Create: `tests/monthly-context-input-fixtures.test.mjs`

- [ ] Add a 30-day and 31-day fixture.
- [ ] Assert stable marker and target month across reruns.
- [ ] Run `node --test tests/monthly-context-input-fixtures.test.mjs`.
- [ ] Commit `test: cover monthly context fixtures`.
