# Plan: Define the one-story, three-level differentiation framework

## Global constraints

- Student-facing material remains English.
- The framework must preserve the existing four-page daily module and the source/reference rules.
- Level 1, Level 2, and Level 3 must use the same dated story while testing distinct mathematical ideas.
- This change is documentation and validation only; it does not alter PDF templates or generated monthly content.

## Review focus

- Verify that the contract states learner profile, number boundaries, skill families, and reasoning-step expectations for every level.
- Verify that three October examples demonstrate progression without inventing facts or silently changing the current content schema.
- Verify that a machine-readable example and validator make the framework reusable by future month generation.

## Tasks

### Task 1: Add a failing contract test

- Add `tests/differentiation-framework.test.mjs` covering the framework shape, shared-story requirement, differentiated levels, and three October examples.
- Run `node --test tests/differentiation-framework.test.mjs` and record the expected failure before implementation.

### Task 2: Implement the framework and validator

- Add `examples/differentiation-framework.example.json` and `src/differentiation-framework.mjs`.
- Add `scripts/validate-differentiation-framework.mjs` and a package script.
- Add the reusable English documentation in `docs/differentiation-framework.md`.
- Run the focused validator and focused tests.

### Task 3: Document the dependency correction

- Update `AGENTS.md` with evidence-based current follow-up graph language: #79, #80, #81, and #82 have no explicit prerequisites in their current bodies and may proceed independently; #61 still depends on #60.
- Add `reports/issue-79-differentiation-framework.json` from the validator.

### Task 4: Verify and hand off

- Run `npm test`, `git diff --check`, and the focused validator.
- Commit, push the focused branch, and create a PR with `Fixes #79`.
- Add a concise Issue #79 pickup comment and inspect the newly opened PR through the PR review gate.
