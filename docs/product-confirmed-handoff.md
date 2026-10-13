# Product-confirmed Product Reel handoff

The Product Reel and Carousel handoffs are release-gated story contracts. Each
is emitted only after the owner labels the approved release Issue `status: ready to dispatch`.
The normalized payload is `product-confirmed/v1`; the payload's `event` must be
`product.confirmed` and its template must be either `reel-v1` or `carousel-v1`.

Run the local builder for a validated payload:

```bash
npm run social:product-confirmed -- \
  --input path/to/product-confirmed.json \
  --output-dir output/social/product-reels/november/handoff
```

For a Carousel payload, add `--template carousel`; the builder writes the
Carousel story filename and uses `carousel-v1` from the payload.

The builder writes `product-confirmed.json` and `product-reel-story.md`. The
story contains the complete payload, the fixed `reel-v1` checklist, the
production command, and the exact idempotency marker
`<!-- product-handoff-id: <handoff_id> -->`. A retry updates the existing
open story with that marker instead of creating a duplicate.

The manual GitHub workflows `Emit product.confirmed Product Reel handoff` and
`Emit product.confirmed Carousel handoff`
checks the approval Issue label before creating or updating the story. It fails
closed with `approval_label_missing` when the label is absent, and the payload
validator separately rejects missing files, checksum mismatches, invalid URLs,
wrong template IDs, stale source revisions, and incomplete worksheet assets.
The workflow creates the story in this repository with labels `status: ready to
pickup` and `type: feature`; it does not render or publish the final Reel.

The Codex production worker starts from the created story, runs
`npm run social:product-reels` with the validated input, attaches the rendered
MP4/sidecar (or the Carousel output) and QA evidence, and keeps the story open
until human review is complete.
