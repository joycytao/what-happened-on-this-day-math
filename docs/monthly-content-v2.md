# Month-only Content Contract v2

Issue #33 uses `schemas/monthly-content-v2.schema.json` and writes the first
normalized artifact to `content/monthly/month-10.json`.

The public input is month-only (`--month 10`). The top-level `month` and each
daily record's `month` are integers; `day` is the calendar day. No worksheet
year is synthesized. Historical dates remain in `eventYear`, which is nullable
only for a year-independent fact accompanied by `eventYearNote`.

Daily records retain the existing reading, trivia, differentiated math, answer,
and source fields. Answer-key identifiers use `MM-DD:levelN`, and the CSV
adapter's `Date` value is `MM-DD`. The v2 contract is intentionally separate
from the legacy `YYYY-MM` contract so downstream validators and renderers can
migrate explicitly rather than silently interpreting a year.

Regenerate the deterministic October artifact with:

```bash
npm run content:generate
```
