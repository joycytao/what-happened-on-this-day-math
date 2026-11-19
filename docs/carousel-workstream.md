# Monthly Carousel workstream

`npm run social:carousels` consumes a monthly Carousel input plus the generated
Product Reel workstream JSON:

```text
node scripts/generate-carousels.mjs \
  --input examples/carousel-workstream.example.json \
  --reels output/social/product-reels/november.json
```

The output is deterministic scene data under
`output/social/carousels/<month>-carousels/workstream.json`. It contains exactly
four Carousels paired by week to the four Reel records, each with 5–8 slides,
source-asset references, a visual treatment, caption direction, and the same
month-specific CTA URL.

The first implementation emits reviewable scene data rather than rendered PNGs;
the renderer can consume the fixed 1:1 scene contract once the approved export
template is selected. The validator blocks missing evidence, Reel/Carousel
month or CTA mismatches, answer-key exposure, and non-deterministic pairing.
