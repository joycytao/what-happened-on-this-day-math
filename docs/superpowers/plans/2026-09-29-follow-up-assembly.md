# Final follow-up page assembly plan

## Goal

Append the validated follow-up page exactly once after the complete Answer Key
section while preserving the source packet and any page-one worksheet cover.

## Acceptance mapping

1. Validate the source packet, Answer Key order, and one-page follow-up artifact
   before writing final output.
2. Derive final counts from the source count plus one follow-up page; support the
   approved 30-day 125-page and 31-day 128-page contracts.
3. Record cover pages, daily pages, Answer Key pages, follow-up pages, page-one
   role, final-page role, and source-to-final mappings.
4. Reject missing, invalid, misplaced, or duplicate follow-up artifacts and any
   stale final output before writing.
5. Append the follow-up PDF with deterministic `pdf-lib` assembly and preserve
   the source PDF unchanged.

## Verification

- Add focused tests for 30-day and 31-day totals, cover/no-cover mappings,
  Answer Key adjacency, duplicate/stale output, and invalid follow-up input.
- Run the focused tests, full `npm test`, `git diff --check`, and the command
  against the current repository to record the expected missing-artifact block.
