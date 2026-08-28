# One-Day Historical Content Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one researched, schema-compatible daily record that proves the project’s historical content model and differentiated math requirements.

**Architecture:** Store the pilot as a standalone monthly-content JSON fixture so it can be consumed by the existing schema and future renderers. Add a focused Node test for the pilot’s date, reading constraints, differentiated skills, arithmetic answers, and source linkage; include that test in the repository test command.

**Tech Stack:** JSON, Node.js built-in `node:test`, existing project validator, NASA History source.

**Spec:** `AGENTS.md`, `docs/content-schema.md`, and the four files under `references `.

## Global Constraints

- Student-facing content is English.
- The reading passage is 150–250 words and begins with a child-friendly everyday question.
- The theme is one of `inventions_daily_life`, `animals_dinosaurs`, or `incredible_challenges`.
- Exactly one math task is provided for each of levels 1, 2, and 3.
- Each answer includes an equation, working, and final answer.
- Historical claims use a reliable source retained in the record’s `sources` metadata.

### Task 1: Add and verify the October 16 content pilot

**Files:**
- Create: `examples/october-16-content-pilot.json`
- Create: `tests/content-pilot.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `schemas/monthly-content.schema.json` and the existing `npm test` validator.
- Produces: a one-day `1983-10-16` record with three math levels and answer-key entries.

- [x] Write a failing test for the missing pilot fixture.
- [x] Run `node --test tests/content-pilot.test.mjs` and confirm it fails because the fixture is missing.
- [x] Add the NASA-sourced JSON record with reading, trivia, differentiated math, answers, and source metadata.
- [x] Add the focused test to the `npm test` command.
- [ ] Run the focused test and full `npm test` command.
- [ ] Run `git diff --check` and commit the focused change.

**Verification:**

```bash
node --test tests/content-pilot.test.mjs
npm test
git diff --check
```
