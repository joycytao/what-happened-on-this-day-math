# Landing-page thumbnail

The monthly thumbnail pipeline produces five deterministic 1260×1260 assets.
`landing-page` is the canonical product-preview image for the external learning
landing page; it is not interchangeable with `different-math`.

Generate it with the same verified monthly manifest and PDF used by the other
thumbnail types:

```bash
npm run thumbnails:generate -- \
  --manifest examples/november-thumbnail-manifest.json \
  --output-dir output/thumbnails/november
```

The output is named `november-v1.0-landing-page.png` and contains, left to
right, the real Reading Passage, Level 1, Level 2, Level 3, and Answer Key
pages. The generated report and TPT handoff include its source-page mapping,
PDF checksum, dimensions, and output checksum. Visual QA also writes
`landing-page-pixel-diff.png` and `landing-page-overlay.png`, plus the
fixed-region SSIM and pixel-matching metrics used for acceptance. The `home`
repository should consume `landingPageImage.path` from that handoff through
its own PR.
