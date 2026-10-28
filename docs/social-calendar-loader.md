# Social calendar loader contract

Issue #187 defines the workbook boundary for the monthly social orchestrator.
`content/social/content-calendar.xlsx` is the human-facing source of truth. The
runtime reads it once through `loadSocialCalendar`, validates rows, and returns
normalized records; downstream builders must not read worksheet cells directly.

## API

```js
loadSocialCalendar({
  workbookPath: "content/social/content-calendar.xlsx",
  month: "2026-11",
  root: process.cwd(),
})
```

The result is `{ valid, errors, rows, source }`. A valid result contains rows
sorted by `publicationDate`, then `contentId`. Dates are normalized to ISO
`YYYY-MM-DD` strings, asset paths and hashtags are arrays, and workbook cell
formatting does not affect the returned record shape.

## Required worksheet columns

`Content ID`, `Content Type`, `Template ID`, `Trigger`, `Publication Date`,
`Asset Paths`, `Hook`, `Caption`, and `Hashtags` are required. Optional columns
are `Output Format`, `Generation Status`, `Campaign ID`, and `Campaign Name`.

`Content Type` must be `Carousel` or `Reel`. The corresponding template IDs are
`carousel-v1` and `reel-v1`. `Trigger` must be `START` or `ENDING_SOON`.
Multiple assets or hashtags may be separated by commas, semicolons, or line
breaks. Invalid rows produce row-numbered errors before any media generation.

The loader filters by the requested `YYYY-MM` month and performs no generation
or publication itself.

