# Calendar and Page Count

Use `src/calendar-pages.mjs` to generate the calendar spine for a monthly
worksheet packet and calculate its required page count.

```js
import {
  calculateMonthlyPageCount,
  generateMonthDates,
} from "./src/calendar-pages.mjs";

const dates = generateMonthDates(2026, 8);
const pages = calculateMonthlyPageCount(2026, 8);
```

`generateMonthDates(year, month)` returns ISO-like `YYYY-MM-DD` strings for
every date in the requested month. The `month` argument is one-based, so
January is `1` and December is `12`.

`calculateMonthlyPageCount(year, month)` returns:

```json
{
  "year": 2026,
  "month": 8,
  "dayCount": 31,
  "dailyPagesPerDay": 4,
  "answerKeyPages": 6,
  "totalPages": 130
}
```

The formula follows `AGENTS.md`: four worksheet pages per calendar day plus
six answer-key pages. A 30-day month has `126` pages, a 31-day month has
`130` pages, leap-year February has `122` pages, and non-leap February has
`118` pages.

Invalid inputs fail before calculation:

- `year` must be an integer from `1` through `9999`.
- `month` must be an integer from `1` through `12`.

Run the focused verification with:

```sh
node --test tests/calendar-pages.test.mjs
```
