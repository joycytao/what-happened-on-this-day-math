# Monthly Product Carousel workflow

The Product Carousel is a monthly social output driven by the same monthly
worksheet packet as the Product Reel. It is a separate template and produces
two publishable variants from one product source:

- `product-carousel-evergreen`: a reusable product-led version.
- `product-carousel-campaign-aligned`: a campaign-led version with a hook and
  availability badge. It must not add free or sale claims unless those facts
  are supplied in the calendar or input contract.

## Automation

Run:

```bash
npm run social:product-carousel -- \
  --month november \
  --output-dir output/social/product-carousels/november
```

The renderer reads:

- `output/worksheet-cover/<month>-worksheet-cover.png`
- `reports/<month>-worksheet-pages/NN-reading-passage.svg` for each day in the month
- `reports/<month>-worksheet-pages/NN-level1.svg`
- `reports/<month>-worksheet-pages/NN-level2.svg`
- `reports/<month>-worksheet-pages/NN-level3.svg`
- fixed scene/profile assets under `social/product-carousel-template/media/`

It writes two directories, each containing four 1080×1350 PNG slides and a
`manifest.json`. Slide 2 uses source-backed worksheet pages. Slide 3 discovers
the full monthly reading-passage count and uses it only in the title (`30 DAILY
READINGS.` or `31 DAILY READINGS.`); the visual keeps six readable sample pages
in the original six-card layout. The manifest records both the full count and
the six-page sample.
Answer-key pages are never rendered into public slides. The output is
review-only and requires human QA before publishing.

## Calendar contract

`content/social/content-calendar.xlsx` is the scheduling source of truth. A
monthly Product Carousel contributes two rows:

- `product-carousel-001` / `product-carousel-evergreen`
- `product-carousel-002` / `product-carousel-campaign-aligned`

The `Asset Path` points to the rendered variant directory. `Hook Idea`, `Scene /
Visual Direction`, `On-screen Text`, `Caption`, and `Hashtags` are the dynamic
content fields. The monthly packet and renderer remain fixed until the product
source changes.
