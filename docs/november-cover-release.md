# November worksheet cover release

Issue #86 is the first monthly instance of the reusable cover pipeline. The current branch produces a reviewable draft PNG and worksheet-sized PDF while keeping the existing 123-page source packet unchanged.

## Contract

- Source packet: `output/pdf/november-worksheet-packet-source.pdf`, 123 pages.
- Draft cover: `output/worksheet-cover/november-worksheet-cover.png` and `.pdf`.
- Final packet after approval: `output/pdf/november-worksheet-packet.pdf`, 124 pages.
- Final mapping: page 1 cover; pages 2–121 daily worksheets; pages 122–124 Answer Key pages.
- The cover has no day-count text and no November-specific doodle.
- The official versioned logo asset is reused unchanged.

Run `npm run cover:prepare:november` to regenerate the draft and manifest. The reusable pipeline refuses to merge unless `approval.status` is `approved` with `approvedBy` and `approvedAt`; this preserves the source PDF and prevents duplicate covers on reruns.

The final merge and release QA remain blocked until the owner explicitly approves the draft PNG. After approval, rerun the cover pipeline with the approved config, merge page 1, update the final manifest, and run `npm run release:validate:november` against the 124-page final artifact.
