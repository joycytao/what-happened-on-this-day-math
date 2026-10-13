---
name: product-carousel
description: Generate the two reusable monthly Product Carousel variants from the month packet assets and content calendar.
---

# Product Carousel

Use this workflow when a monthly worksheet product needs a reusable Instagram
carousel. It creates exactly two four-slide variants:

- `evergreen`: product-led cover for repeated publishing.
- `campaign-aligned`: campaign-led cover using only the supplied campaign facts.

## Inputs

Required month assets:

- `output/worksheet-cover/<month>-worksheet-cover.png`
- `reports/<month>-worksheet-pages/NN-reading-passage.svg` for every day in the month
- `reports/<month>-worksheet-pages/NN-level1.svg`
- `reports/<month>-worksheet-pages/NN-level2.svg`
- `reports/<month>-worksheet-pages/NN-level3.svg`
- `content/social/content-calendar.xlsx` rows with the matching month and template IDs.

## Fixed output

The renderer writes two directories under
`output/social/product-carousels/<month>/` with `01.png` through `04.png`,
plus `manifest.json` containing the source assets, copy, variant, and QA
constraints. It does not publish to Instagram.

## Guardrails

- Keep the canvas at `1080x1350`.
- Do not show answer-key pages in the public carousel.
- Preserve worksheet page proportions; never crop worksheet content.
- Keep Slide 2 and Slide 3 source-backed by the month packet.
- Slide 3 title must represent the complete monthly reading library: `30 DAILY READINGS.` or `31 DAILY READINGS.` based on the discovered `NN-reading-passage.svg` count. The visual remains the original six readable sample cards.
- Do not invent sale/free claims for the campaign-aligned variant.
- Human review is required before publication.
