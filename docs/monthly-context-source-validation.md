# Monthly context-source validation

Issue #215 is the structural handoff between the raw monthly context comment
and the downstream content-validation workstream.

Run it with the Issue and comments JSON returned by GitHub:

```sh
node scripts/validate-monthly-context-source.mjs \
  --issue /tmp/monthly-context-issue.json \
  --comments /tmp/monthly-context-comments.json \
  --output /tmp/monthly-context-source-report.json
```

The report checks the `monthly-context` marker, the marked JSON comment, the
target month, calendar-day coverage, duplicate dates, non-empty context, and
all three question/answer levels. It records the source comment id and the
event year when the input explicitly includes one in the title or context.

This validator does not claim that a historical fact has been independently
researched. The input schema has no citation field; external source research
belongs to the downstream content-validation workstream and must be recorded
before student-facing content is released.
