# Social calendar loader

The monthly social workflow reads the human-facing XLSX calendar through
`loadSocialCalendar({ workbookPath, month, root })` in
`src/social-calendar-loader.mjs`. The loader is the only workbook boundary for
the social workflow.

The workbook must contain these columns: `Content ID`, `Content Type`,
`Template ID`, `Trigger`, `Publication Date`, `Asset Paths`, `Hook`, `Caption`,
and `Hashtags`. `Content Type` currently accepts `Carousel` and `Reel`, with
template IDs `carousel-v1` and `reel-v1`; triggers are `START` and
`ENDING_SOON`.

Rows are normalized, filtered to the requested `YYYY-MM` month, and sorted by
publication date and Content ID. Missing fields, duplicate Content IDs,
unsupported content types or triggers, invalid dates, and mismatched template
IDs produce row-numbered errors. Invalid input is returned as `valid: false`
so the downstream orchestrator can fail closed before writing output.
