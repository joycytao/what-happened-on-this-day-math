# Monthly Morning Work Math release workflow

This workflow keeps each month independently releasable while making the
dependency between source PDFs, worksheet covers, thumbnails, QA, metadata,
and release records explicit. The monthly release is the unit of production;
an annual bundle references only released monthly units.

## Ordered stages

1. **Source and content readiness** — resolve the month, calendar day count,
   historical sources, English reading passages, and three differentiated math
   levels. The source and content gates must pass before rendering.
2. **Mathematics and answer-key validation** — independently recompute every
   answer and validate the three answer-key levels.
3. **Worksheet rendering** — render the four page types for every calendar day
   in the required order: Reading Passage, Level 1, Level 2, Level 3.
4. **Answer-key rendering** — render the three answer-key pages after the daily
   modules and verify level order and coverage.
5. **Worksheet coversheet** — produce the approved portrait coversheet PNG and
   worksheet-sized PDF page. This is a manual approval gate; an unapproved
   cover cannot enter the final packet.
6. **PDF assembly and final QA** — assemble the source packet, insert exactly
   one approved cover as page 1, record page count and source-page mappings,
   and run independent content, mathematics, source, layout, PDF, and visual
   gates. The current November pre-cover baseline remains 123 pages; the final
   cover-bearing November contract is 124 pages.
7. **Derived assets** — generate thumbnails only from the approved final PDF
   and record the source checksum and page mappings. A PDF or cover change
   invalidates affected thumbnails and their visual QA records.
8. **Listing and landing-page handoff** — prepare TPT metadata/copy and
   landing-page assets from the released monthly record without publishing
   automatically.
9. **Release record** — write the human-readable and machine-readable report,
   checksums, artifact paths, gate results, approval status, and failure details.

## Gate and failure rules

Every stage records its inputs, outputs, and pass/fail gate. Any failed gate
blocks release and identifies the affected month, day, page type, field,
artifact, and actionable reason. A changed PDF, cover, source asset, or page
mapping invalidates downstream derived artifacts and requires regeneration and
revalidation.

## Reuse rules

The same workflow applies to 30-day and 31-day months; calendar math derives
the actual day count. February remains subject to the project’s confirmed
month-specific page-count rules. A future bundle consumes released monthly
records and does not bypass any monthly gate.

Run `npm run release:workflow:validate` to validate the machine-readable
workflow contract.
