# Final follow-up page validation

Issue #116 adds one approved follow-up page after the complete Answer Key. This
is a validation gate; the orchestration change that actually appends the page is
tracked separately in Issue #117.

## Contract

- The approved baseline totals are 124 pages for a 30-day packet and 127 pages
  for a 31-day packet.
- The final packet totals are therefore 125 and 128 pages respectively.
- The final four logical pages must be `Answer Key level 1`, `Answer Key level
  2`, `Answer Key level 3`, and exactly one `follow_up` page.
- February remains unapproved and must fail validation rather than receive an
  invented page-count rule.
- The supplied visual reference is version `1.0.0` at
  `references /worksheet-assets/follow-up-page-reference.png`; its SHA-256 is
  `47a58a4831063ae84d99ccecc77efe9dbf7b9084154decd328bab20233e3e83e`.
- The approved copy is the English copy visibly present in that supplied
  reference: `FOLLOW / FOR WHAT’S NEXT`, `Get first notice of new monthly
  resources`, the three panel messages, the early-month pricing note, and the
  `6 pm studio` footer logo.

## Validation loop

1. Generate the follow-up page from the current approved prompt/template.
2. Render the final packet and run `npm run packet:validate:final-follow-up`
   against its logical page manifest.
3. Run `npm run follow-up:visual:validate` against the versioned reference,
   recording dimensions, fixed-region similarity, exact-pixel ratios, copy
   validation, margins, clipping, overflow, and the side-by-side/overlay/
   pixel-diff artifacts in the release report.
4. If visual QA fails, revise the prompt/template, regenerate the page, and
   repeat validation. Do not mark the packet releasable while the visual gate
   fails.

Content accuracy, mathematics, page-order/page-count validation, and visual
comparison remain separate gates.
