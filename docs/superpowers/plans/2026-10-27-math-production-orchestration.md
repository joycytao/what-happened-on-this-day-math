# Math Production Orchestration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand an approved monthly context input into idempotent Math Production Issues with explicit dependencies for source, content, worksheet, release, landing-page, and TPT work.

**Architecture:** A pure planner converts one validated raw input into a fixed nine-node workstream graph. A GitHub Actions workflow creates or updates Issues by stable monthly markers, adds them to the configured Math Production Project, and leaves status human-managed except for dependency labels required by the graph.

**Tech Stack:** Node.js 22, GitHub Actions, GitHub REST/GraphQL APIs, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-27-monthly-production-and-social-board-design.md`

## Global Constraints

- The workflow runs only after context input is valid and approved.
- Child Issues are idempotent by `YYYY-MM` and workstream key.
- Landing-page and TPT work are parallel only after worksheet release.
- Preserve existing monthly schema, renderers, release gates, and evidence contracts.
- Project owner/number must come from repository variables or workflow inputs.

## Review Focus

- Dependency ordering: landing/TPT must not become ready before release.
- 28/29/30/31-day months: planner carries expected day count without inventing February rules.
- Rerun after partial creation: update existing Issues without duplicate Project items.
- Failed upstream gates: retain blocked state and actionable evidence.
- Existing release artifacts: derive `package_id` only from the approved release record.

### Task 1: Define the monthly workstream graph

**Files:**
- Create: `src/monthly-production-orchestration.mjs`
- Create: `tests/monthly-production-orchestration.test.mjs`
- Create: `examples/monthly-production-plan.example.json`

**Interfaces:**
- `buildMonthlyProductionPlan({ month, inputIssue, inputArtifact, runUrl, project }) -> { parent, issues, dependencies }`.
- Each issue object contains `key`, `marker`, `title`, `body`, `labels`, `blockedBy`.

- [ ] Write tests for all nine workstreams, exact dependency edges, labels, and stable markers.
- [ ] Run the focused test and confirm failure.
- [ ] Implement the pure planner using the existing release/workstream naming conventions.
- [ ] Run the focused test and `npm test`.
- [ ] Commit `feat: plan monthly math production workstreams`.

### Task 2: Add approval-triggered production queue

**Files:**
- Create: `.github/workflows/monthly-production-queue.yml`
- Create: `scripts/build-monthly-production-plan.mjs`
- Create: `tests/monthly-production-queue-workflow.test.mjs`

**Interfaces:**
- `buildMonthlyProductionPlan` consumes the validated context result from Task 1.
- Workflow trigger: Issue labeled `status: ready to pickup` with the monthly-context marker.
- Workflow output: one parent plus nine idempotent Issues.

- [ ] Test trigger filtering so unrelated ready Issues do nothing.
- [ ] Test invalid input blocks and comments on the context Issue without creating children.
- [ ] Implement REST create/update and GraphQL Project item insertion by content node ID.
- [ ] Preserve human-managed status fields and avoid guessing custom Project option IDs.
- [ ] Run focused tests and a local plan fixture.
- [ ] Commit `feat: queue monthly math production`.

### Task 3: Connect release and downstream gates

**Files:**
- Modify: `.github/workflows/tpt-release-trigger.yml`
- Modify: `.github/workflows/tpt-workstream.yml`
- Modify: `.github/workflows/social-monthly-queue.yml`
- Create: `tests/monthly-downstream-dependencies.test.mjs`

- [ ] Test that landing/TPT/social inputs require the same released `package_id`.
- [ ] Test stale, wrong-month, or missing release manifests remain blocked.
- [ ] Implement explicit dependency markers and release handoff fields without replacing existing validators.
- [ ] Run TPT/social workflow tests and the repository test suite.
- [ ] Commit `feat: gate downstream monthly workstreams on release`.

### Task 4: Record orchestration evidence

**Files:**
- Modify: `docs/monthly-release-workflow.md`
- Create: `docs/monthly-production-orchestration.md`
- Create: `tests/monthly-production-documentation.test.mjs`

- [ ] Document the nine workstreams, dependency graph, markers, and failure behavior.
- [ ] Link the raw input, normalized content, release manifest, and downstream handoff artifacts.
- [ ] Run documentation validation.
- [ ] Commit `docs: document monthly production orchestration`.
