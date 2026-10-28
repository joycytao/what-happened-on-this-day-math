# Social calendar loader contract

Issue #187 uses the workbook as the human-facing and runtime source of truth.
The runtime reads `content/social/content-calendar.xlsx` directly at one
ingestion boundary, then passes normalized records to downstream generators.
No generated CSV or JSON export is committed as a second source of truth.

## Canonical `Content Calendar` columns

| Column | Contract |
| --- | --- |
| `Content ID` | Unique stable identifier within the requested month. |
| `Content Type` | `Carousel` or `Reel`. |
| `Template ID` | `carousel-v1` for Carousel; `reel-v1` for Reel. |
| `Trigger` | `manual`, `monthly-release`, or `scheduled`. |
| `Publish Date` | A valid spreadsheet date, normalized to `YYYY-MM-DD`. |
| `Asset Paths` | One or more repository-relative paths separated by semicolons or new lines. |
| `Hook` | The short opening hook. |
| `Caption` | The publication caption. |
| `Hashtags` | One or more hashtags separated by commas, semicolons, spaces, or new lines. |
| `Campaign ID` | Stable campaign identifier. |
| `Campaign Week` | Integer from 1 to 5. |
| `Output Format` | `png` for Carousel; `mp4` for Reel. |
| `Generation Status` | `planned`, `ready`, `generated`, `review`, `published`, or `blocked`. |

`loadSocialCalendar({ workbookPath, month })` accepts a `YYYY-MM` month,
returns records in deterministic publish-date/content-ID order, and reports
row-specific validation errors before any generator is called.
