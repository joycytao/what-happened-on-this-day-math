# Social Monthly Orchestrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build a deterministic monthly social orchestrator that reads the merged XLSX calendar contract, validates the requested month, plans supported Reel/Carousel generation, and fails closed for unsupported or incomplete rows.

**Architecture:** Keep XLSX parsing in `src/social-calendar-loader.mjs`; keep monthly dispatch and dry-run behavior in a separate `src/social-monthly-orchestrator.mjs`. The orchestrator will reuse existing Product Reel and Product Carousel builders through explicit adapters and will report unsupported template IDs instead of silently selecting a different generator. It will emit one deterministic run manifest mapping every Content ID to its planned or generated output.

**Tech Stack:** Node.js ESM, `xlsx`, existing monthly social builders, Node test runner, JSON manifests.

**Spec:** `docs/superpowers/specs/2026-10-27-monthly-production-and-social-board-design.md`, GitHub Issue #190, and the merged Issue #187 contract in PR #208.

## Global Constraints

- The spreadsheet is the human-facing scheduling source of truth; the loader is the only workbook boundary.
- Rows are sorted by publication date, then Content ID.
- Missing required fields, duplicate Content IDs, unsupported templates, and missing assets fail closed before that row writes output.
- A dry run performs no media writes.
- No social publishing is performed.
- Existing Product Reel and Product Carousel builders remain the generation boundary; unsupported weekly/campaign templates remain actionable validation errors until their dedicated issues land.
- The monthly run is keyed by requested month and produces deterministic output paths and manifest content.

## Review Focus

- A workbook with duplicate Content IDs must fail before any row is dispatched — covered by loader/orchestrator validation tests.
- A valid row with an unsupported template must produce an actionable error rather than fall back to Product Reel/Carousel — covered by dispatch tests.
- A mixed month with one invalid row must report the invalid row and avoid partial writes for that row — covered by run-manifest tests.
- Dry-run mode must not create output directories or media files — covered by CLI integration test.
- A rerun of the same month must produce byte-equivalent planning output — covered by determinism test.

### Task 1: Restore the merged calendar-loader boundary on this branch

**Files:**
- Create: `src/social-calendar-loader.mjs`
- Create: `tests/social-calendar-loader.test.mjs`
- Create: `docs/social-calendar-loader.md`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces `loadSocialCalendar({ workbookPath, month, root }) -> { valid, errors, rows, source }`.
- Normalized rows expose `contentId`, `contentType`, `templateId`, `trigger`, `publicationDate`, `assetPaths`, `hook`, `caption`, `hashtags`, and optional campaign/output fields.

- [x] Copy the merged PR #208 loader contract and fixtures into this branch without changing its public interface.
- [x] Run the loader tests and confirm they pass.
- [x] Commit `feat: add social calendar loader`.

### Task 2: Define the orchestrator plan and dispatch contract

**Files:**
- Create: `src/social-monthly-orchestrator.mjs`
- Create: `tests/social-monthly-orchestrator.test.mjs`

**Interfaces:**
- `buildMonthlySocialRunPlan({ rows, month, outputRoot }) -> { valid, errors, month, rows, outputRoot }`.
- Each planned row contains `contentId`, `templateId`, `publicationDate`, `status`, `generator`, `input`, and `outputPath`.
- Supported mappings are `reel-v1 -> product-reel` and `carousel-v1 -> product-carousel`; any other template is `unsupported-template`.

- [x] Write failing tests for supported mapping, unsupported template failure, deterministic ordering, and duplicate-content rejection.
- [x] Implement the minimal pure planning function using the loader's normalized row shape.
- [x] Run the focused tests and then the full test suite.
- [x] Commit `feat: plan monthly social generation`.

### Task 3: Add the month CLI with dry-run and generation manifest

**Files:**
- Create: `scripts/run-monthly-social.mjs`
- Create: `tests/run-monthly-social.test.mjs`
- Modify: `package.json`

**Interfaces:**
- CLI: `npm run social:monthly -- --month YYYY-MM [--calendar <path>] [--output <path>] [--dry-run]`.
- Output manifest contains `schemaVersion`, `month`, `source`, `rows`, `valid`, `errors`, and `dryRun`.

- [x] Write failing tests proving dry-run writes only the manifest, not media output directories.
- [x] Implement CLI input parsing, loader invocation, plan generation, and manifest writing.
- [x] Use explicit generator adapters for supported rows; unsupported rows remain in the manifest with actionable errors.
- [x] Run focused CLI tests and the full test suite.
- [x] Commit `feat: add monthly social orchestrator CLI`.

### Task 4: Document queue handoff and automation boundary

**Files:**
- Modify: `docs/social-orchestration.md`
- Modify: `docs/superpowers/plans/2026-10-28-social-monthly-orchestrator.md`

- [x] Document that GitHub Actions or Codex automation invokes the CLI from the ready Issue, while the CLI owns deterministic validation and generation planning.
- [x] Document the current supported template boundary and dependencies on Issues #188 and #189.
- [x] Record verification results and any environment-only GitHub CLI limitation.
- [x] Run `git diff --check` and the full test suite.
- [ ] Commit `docs: document monthly social orchestrator`.

## Verification record

- Focused new tests: 11/11 passed.
- Full `npm test`: 249 passed, 14 failed in pre-existing worksheet-cover
  Playwright/MachPort environment checks and the existing Issue #48 source-count
  assertion. No new social test failed.
- `git diff --check`: passed.
- GitHub CLI/network reads remain subject to the repository connectivity gate;
  this change does not add a new direct GitHub call.
