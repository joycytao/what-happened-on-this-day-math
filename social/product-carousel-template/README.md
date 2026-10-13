# Product Carousel Template

This is the reusable monthly Product Carousel for `@engineermom.worksheets`.

## Fixed design contract

- Instagram canvas: `1080x1350`.
- Four slides per variant.
- Palette: `#203245`, `#D8C6B2`, `#F6F0E2`.
- Slide 1: seasonal family-learning scene, monthly cover, reading passage, Level 1, and Level 3.
- Slide 2: six packet pages in two rows: Level 1, Level 2, Level 3.
- Slide 3: six representative reading-passage pages. The title shows the full monthly count: `30 DAILY READINGS.` or `31 DAILY READINGS.` depending on the month.
- Slide 4: fixed profile CTA using the back-view profile asset and link-in-bio language.
- Worksheet cards preserve the full page and use a small `10px` corner radius; the renderer adds no separate white backing panel or shadow, so the only paper color comes from the source worksheet itself. No answer key is exposed in the Cover preview.

## Monthly variants

The monthly build creates exactly two four-slide sets:

1. `evergreen`: product-led hook for repeat publishing.
2. `campaign-aligned`: campaign-led hook and availability badge. It must not invent a discount or free offer unless those fields are supplied in the input.

Both variants share Slides 2–4 and intentionally differ on Slide 1 through the scene, hook, support line, and optional campaign badge.

## Build

```bash
npm run social:product-carousel -- \
  --month november \
  --output-dir output/social/product-carousels/november
```

The build reads the generated monthly worksheet SVGs from
`reports/<month>-worksheet-pages/` and the month cover from
`output/worksheet-cover/<month>-worksheet-cover.png`.

The reading-library slide uses the original six-card layout. The title carries
the full monthly count while the six source-backed pages provide a readable
sample of the library. The output is review-only until a human confirms the
assets and copy. The spreadsheet row for each variant is the scheduling source
of truth.
