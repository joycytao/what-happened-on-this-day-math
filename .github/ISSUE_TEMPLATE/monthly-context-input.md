---
name: Monthly context input
about: Supply the approved raw context and math questions for a monthly production cycle.
title: ""
labels: "content:monthly, status: pending review"
---

# Monthly context input

This Issue is created by the scheduled monthly intake workflow. Add one comment containing the target month's JSON input, then apply `status: ready to pickup` only after the complete input is present.

The JSON must contain the `month`, one `days` entry for every calendar day, and each day's `date`, `title`, `context`, and `questions.level1` through `questions.level3` with `prompt` and `answer`.

Use this comment shape:

````text
<!-- monthly-content-input: YYYY-MM -->
```json
{ "month": "YYYY-MM", "days": [] }
```
````

The workflow accepts Chinese raw content and converts the final student-facing content to English. Invalid JSON, missing days, duplicate dates, missing context, missing levels, or missing answers keep the monthly cycle blocked.
