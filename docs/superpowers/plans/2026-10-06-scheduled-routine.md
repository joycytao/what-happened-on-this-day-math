# Scheduled Routine Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Identify the routine that could duplicate social-content generation and document the safe keep/change decision for Issue #144.

**Architecture:** Inspect repository workflow triggers and the external Codex heartbeat separately. Treat event-driven release workflows as distinct from scheduled routines. Make no destructive scheduler change without an explicit target, owner, replacement, and rollback plan.

**Tech Stack:** GitHub Actions YAML, Markdown contract documentation, Node.js repository tests.

**Spec:** Issue #144.

## Global Constraints

- Do not disable a routine based only on its filename or display order.
- Preserve the successful monthly release gate as the source event.
- Keep independent workstreams running when one workstream is blocked.
- Student-facing content and existing worksheet contracts are unchanged.

## Review Focus

- Scheduled versus event-driven triggers: inventory must distinguish `schedule`, `workflow_run`, `workflow_dispatch`, and `issues` triggers.
- Duplicate generation risk: the inventory must identify whether any workflow directly generates Product Reel or Carousel artifacts.
- External scheduler boundary: the repo document must not claim authority to disable the Codex heartbeat outside the repository.
- Missing owner approval: no destructive change is allowed without a named routine and rollback plan.

### Task 1: Record the scheduler inventory

**Files:**
- Create: `docs/scheduled-routines-inventory.md`

- [ ] Record every `.github/workflows/*.yml` trigger and classify it as scheduled, release-event, manual, reusable, or issue-event.
- [ ] Record the external Codex heartbeat boundary and its current role.
- [ ] State the evidence-backed decision: no repository schedule is retired; the release trigger remains authoritative; any external scheduler change requires owner approval.
- [ ] Run `npm test`.
- [ ] Commit the documentation and create a PR containing `Fixes #144`.

### Task 2: Update the issue decision record

**Files:**
- GitHub Issue #144 comment and labels; no repository source change.

- [ ] Link the inventory document and list the exact unresolved external decision, if any.
- [ ] If no external routine is approved for retirement, remove `status: ready to pickup` and add `status: blocked` with the evidence gap.
