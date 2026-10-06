# November worksheet cover release

Issue #86 is the first monthly instance of the reusable cover pipeline. The current branch produces a reviewable draft PNG and worksheet-sized PDF while keeping the existing 123-page source packet unchanged.

## Contract

- Source packet: `output/pdf/november-worksheet-packet-source.pdf`, 123 pages.
- Draft cover: `output/worksheet-cover/november-worksheet-cover.png` and `.pdf`.
- Cover-only packet after approval: `output/pdf/november-worksheet-packet.pdf`, 124 pages.
- Final release packet: `output/pdf/november-worksheet-packet-final.pdf`, 125 pages.
- Final mapping: page 1 cover; pages 2–121 daily worksheets; pages 122–124 Answer Key pages; page 125 approved follow-up.
- The cover has no day-count text and uses a centered orange outline-only turkey doodle for November.
- The turkey is a deterministic SVG illustration, so the reusable pipeline keeps the same geometry, palette, and placement across regeneration.
- The official versioned logo asset is reused unchanged.

Run `npm run cover:prepare:november` to regenerate the draft and manifest. The reusable pipeline refuses to merge unless `approval.status` is `approved` with `approvedBy` and `approvedAt`; this preserves the source PDF and prevents duplicate covers on reruns.

The final merge and release QA remain blocked until the owner explicitly approves the draft PNG. After approval, rerun the cover pipeline with the approved config, add the approved follow-up page, update the final manifest, and run the final-package validator against the 125-page release artifact.
