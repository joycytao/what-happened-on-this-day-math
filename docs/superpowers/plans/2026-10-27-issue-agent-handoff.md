# Issue Agent Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert supported GitHub Issue labels into idempotent, copyable agent handoff queue records without requiring an OpenAI token in GitHub Actions.

**Architecture:** A tested Node routing module resolves the triggering label and existing agent labels into one handoff plan. A GitHub Actions workflow runs on Issue label events, renders that plan, and posts one marked comment; it never invokes an external model. Missing or ambiguous agent routing is reported as a blocked handoff and receives `needs-info`.

**Tech Stack:** GitHub Actions, `actions/github-script`, Node.js ESM, `node:test`.

**Spec:** `docs/agent-governance.md` and `docs/agents/triage-labels.md`.

## Global Constraints

- GitHub Actions must not require an OpenAI or other model token.
- A handoff comment must be idempotent for one Issue, role, and trigger label.
- Every automatic handoff must identify exactly one agent role and skill path.
- Existing `status: ready to pickup` workflow behavior remains supported.
- `pm-triage` remains responsible for routing and may not invent domain decisions.

## Review Focus

- Repeated label events must not create duplicate handoff comments.
- `ready-for-agent` without an agent label must not silently route to an arbitrary role.
- Multiple agent labels must be treated as ambiguous rather than selecting one by accident.
- Decision-owner labels must continue to route architect and product-manager requests.
- The generated prompt must preserve the no-label-mutation boundary for the worker.

---

### Task 1: Build and test the routing contract

**Files:**
- Create: `src/agent-handoff-queue.mjs`
- Create: `scripts/build-agent-handoff-plan.mjs`
- Test: `tests/agent-handoff.test.mjs`

- [ ] Define the supported trigger and agent-role mappings.
- [ ] Return a blocked plan for missing or ambiguous agent routing.
- [ ] Add CLI input/output support for a GitHub `issues:labeled` event payload.
- [ ] Test supported routing, duplicate marker identity, missing routing, and ambiguity.

### Task 2: Connect GitHub labels to the queue workflow

**Files:**
- Create: `.github/workflows/agent-handoff-queue.yml`
- Modify: `.github/labels.yml`
- Modify: `.github/workflows/sync-labels.yml`
- Modify: `docs/agent-governance.md`
- Modify: `docs/agents/triage-labels.md`

- [ ] Trigger on Issue label events and filter through the routing module.
- [ ] Post one `CODEX_AGENT_HANDOFF` comment per plan marker.
- [ ] Add `agent-requested` for actionable plans and `needs-info` for blocked plans.
- [ ] Document that GitHub queues the handoff for Codex pickup rather than executing a model.

### Task 3: Verify and package

**Files:**
- Modify: none beyond Tasks 1–2.

- [ ] Run the focused routing tests.
- [ ] Run the complete repository test command.
- [ ] Run `git diff --check` and inspect the full diff.
- [ ] Commit the change and create a PR from the isolated branch.
