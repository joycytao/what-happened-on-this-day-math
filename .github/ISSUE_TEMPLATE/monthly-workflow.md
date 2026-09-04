---
name: Monthly production workflow
about: Create the repeatable research-to-PDF sequence for one calendar month.
title: "[Monthly workflow] {{MONTH_NAME}}"
labels: "type: feature, status: pending review"
---

# {{MONTH_NAME}} monthly production workflow

## Run parameters

- Month: `{{MONTH_NAME}}` (`{{MONTH_NUMBER}}`)
- Calendar year: `{{CALENDAR_YEAR}}` (worksheet identity only; historical event years remain per record)
- Parent Issue: `#{{PARENT_ISSUE}}`
- Research artifact: `research/{{MONTH_NAME_LOWER}}-events.json`
- Expected calendar days: `{{DAY_COUNT}}`
- Expected packet pages: `{{EXPECTED_PAGE_COUNT}}` (`31`-day example: `130 pages`)
- Public command: `node scripts/generate-monthly.mjs --month {{MONTH_NUMBER}}`

## Child Issue sequence

Create or link one child Issue for each action. Every child Issue must record its
status, branch, PR, verification command, and blocker (or `none`).

### 1. Research historical events — {{MONTH_NAME}} 1–{{DAY_COUNT}}

- [ ] Research one defensible event or fact for every `month/day`.
- [ ] Record title, claim, theme, source IDs, and source metadata.
- [ ] Keep each historical `eventYear` separate from the worksheet month/day.
- [ ] Qualify approximate, disputed, or year-independent dates.

### 2. Normalize source and content records

- [ ] Transform the research artifact into the monthly content schema.
- [ ] Preserve the exact CSV contract, including `Source_IDs` and related source fields.
- [ ] Keep student-facing content in English.

### 3. Validate content and mathematics

- [ ] Validate dates, themes, passage length, and source resolution.
- [ ] Independently recompute every Level 1, Level 2, and Level 3 answer.
- [ ] Confirm math numbers appear in the passage or are explicitly introduced.

### 4. Render worksheet pages

- [ ] Render one Reading Passage and three math pages per calendar day, in that order.
- [ ] Check dimensions, margins, clipping, overflow, and legibility.

### 5. Render Answer Key pages

- [ ] Render Level 1, Level 2, and Level 3 answer keys, two pages per level.
- [ ] Check answer-key order, dimensions, margins, clipping, overflow, and legibility.

### 6. Assemble and QA the monthly PDF

- [ ] Assemble all daily pages followed by the six Answer Key pages.
- [ ] Independently derive the calendar day count and verify the expected page count.
- [ ] Verify page order and that the packet has `{{EXPECTED_PAGE_COUNT}}` pages.
- [ ] Keep content, mathematics, and layout validation results separate.

## Release gate

- [ ] All child Issues are closed or explicitly approved for release.
- [ ] All source claims and historical dates have reliable citations.
- [ ] Content and math checks pass.
- [ ] Layout checks pass, including page dimensions, orientation, margins, clipping, overflow, and legibility.
- [ ] Human review confirms the final packet.
- [ ] Release PR: `{{PR_URL}}` with `Fixes #{{PARENT_ISSUE}}`

## Dependency map

```text
Research → Normalize → Validate → (Worksheet Render + Answer Key Render)
         → Assemble and QA → Release gate
```

## Status record

- Overall status: `{{STATUS}}`
- Branch: `{{BRANCH}}`
- PR: `{{PR_URL}}`
- Blocker: `{{BLOCKER_OR_NONE}}`
