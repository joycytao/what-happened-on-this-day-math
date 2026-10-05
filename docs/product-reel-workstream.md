# Monthly Product Reel workstream

This contract turns one verified monthly worksheet package into four
deterministic Product Reel hand-off records. It does not invent worksheet copy,
logos, testimonials, outcomes, or answer-key displays, and it does not publish
to Instagram automatically.

## Input

The input JSON must provide an English `month`, month-specific `productName`,
HTTPS `productUrl` and `redirectUrl`, `numberOfDays`, verified
`packageFeatures`, and these real package assets:

- `cover`
- `preview`
- `readingPassage`
- `level1`
- `level2`
- `level3`

An `answerKey` asset is rejected. The redirect URL must identify the same month
as the package so a copied campaign cannot silently point to another release.

## Output

Run:

```bash
npm run social:product-reels -- --input examples/product-reel-workstream.example.json
```

The output is a deterministic JSON workstream with exactly four records,
`1080x1920` canvas, 30 fps, ten-second silent-by-default timing, a distinct
weekly hook, source asset manifest, CTA, claim policy, and human-QA flags.
The records are renderer hand-offs; a later renderer may produce video or
editable scene data without changing the source contract.

## QA gates

- Every Reel has at least one real product-evidence asset.
- Every CTA uses the same month-specific redirect URL.
- Answer keys are never included.
- Full pages remain subject to the repository's public-display policy; crops,
  zooms, and collages are the default worksheet treatments.
- Human review remains required before publication.
- The same input produces byte-stable record JSON apart from the caller's file
  path and output location.

## Monthly reuse

Copy the input example, replace the month/product/URLs, verify the actual asset
paths and day count, and write four new hooks only when the package's evidence
supports them. Do not retain October-specific wording or hashtags in another
month.

## October release manifest

The approved October input is
`examples/october-product-reel-workstream.input.json`; its deterministic output
is `output/social/product-reels/october/workstream.json`. It records the
October package identity, source release manifest, source commit, and SHA-256
checksums for every evidence asset. The October source gate is preserved as
`source: false` and explicitly marked with the owner-approved waiver in the
input; the waiver does not rewrite the underlying release QA report.

The paired Carousel workstream consumes
`examples/october-carousel-workstream.input.json` plus the Product Reel output:

```bash
npm run social:carousels -- \
  --input examples/october-carousel-workstream.input.json \
  --reels output/social/product-reels/october/workstream.json \
  --output output/social/carousels/october-carousels/workstream.json
```
