# Complete monthly package assembly plan

## Goal

Assemble independently validated cover, daily worksheet, Answer Key, and final
follow-up PDF components into one reproducible monthly package. The existing
Issue #117 implementation only appended a follow-up page to an already combined
source PDF, which did not prove component ordering or produce the package from
its actual inputs.

## Acceptance mapping

1. Build separate 30-day and 31-day contracts with approved totals of 125 and
   128 pages.
2. Validate component manifests and actual PDF page counts before writing.
3. Assemble in cover, daily calendar order, Answer Key levels 1–3, follow-up
   order, and emit page ranges and checksums.
4. Preserve every component byte-for-byte and reject stale output or invalid
   visual QA before assembly.

## Verification

- Focused tests create independent synthetic component PDFs and prove the final
  page count, ranges, ordering, and unchanged component bytes.
- Full `npm test`, syntax checks, and `git diff --check` are required.
