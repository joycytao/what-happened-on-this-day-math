# Plan: Validate the final follow-up page after Answer Key

**Goal:** Add a reusable validation contract for the approved follow-up page that must be the final page after the three Answer Key pages.

**Evidence:** User-provided follow-up-page reference image and Issue #116. The current workflow validates 124/127 pages and ends at Answer Key; the requested change adds one final follow-up page and therefore requires independent page-order and page-count checks.

## Tasks

- [x] Add a versioned follow-up reference asset and checksum metadata.
- [x] Add failing tests for expected totals, terminal page role, uniqueness, and Answer Key ordering.
- [x] Implement a reusable final-packet validation module without changing orchestration output generation.
- [x] Add a focused CLI/report contract and document the optimize → regenerate → revalidate loop.
- [x] Run focused tests, the full test suite, and repository hygiene checks.
- [x] Add fixed-region visual parity, copy validation, and visual artifacts.

## Verification

- 30-day packet expects 125 pages and 31-day packet expects 128 pages when the final follow-up page is included.
- The final four pages are Answer Key Level 1, Level 2, Level 3, then exactly one follow-up page.
- Missing, duplicated, or misplaced follow-up pages fail validation with actionable errors.
