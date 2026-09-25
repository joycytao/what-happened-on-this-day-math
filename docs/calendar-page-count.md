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

The approved rendered packet totals are:

```json
{
  "year": 2026,
  "month": 8,
  "dayCount": 31,
  "dailyPagesPerDay": 4,
  "answerKeyPages": 3,
  "totalPages": 127
}
```

The final PDF is authoritative. A 30-day month has `124` pages and a 31-day
month has `127` pages. February totals are not yet specified and must be
confirmed before adding a page-count rule for February.

Invalid inputs fail before calculation:

- `year` must be an integer from `1` through `9999`.
- `month` must be an integer from `1` through `12`.

Run the focused verification with:

```sh
node --test tests/calendar-pages.test.mjs
```
