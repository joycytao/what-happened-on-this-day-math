# Monthly context input protocol

The monthly context Issue is the human input gate for a future production cycle. It is created on the third Monday at 09:00 `America/Chicago` for the month two calendar months ahead.

## Owner workflow

1. Open the generated `[Monthly context] YYYY-MM` Issue.
2. Add exactly one comment containing the target marker and a fenced JSON block:

````text
<!-- monthly-content-input: 2026-12 -->
```json
{
  "month": "2026-12",
  "days": [
    {
      "date": "12/1",
      "title": "...",
      "context": "...",
      "questions": {
        "level1": {"prompt": "...", "answer": "..."},
        "level2": {"prompt": "...", "answer": "..."},
        "level3": {"prompt": "...", "answer": "..."}
      }
    }
  ]
}
```
````

3. Keep the raw context, questions, and answers in the language most convenient for input; Chinese is supported.
4. Apply `status: ready to pickup` only when all days and all three levels are present.

## Validation behavior

The validator checks the marker, JSON syntax, target month, calendar day count, duplicate dates, non-empty title/context, and all three question/answer pairs per day. It does not execute Python or other code embedded in the comment.

After approval, the production workflow preserves the raw JSON as evidence, researches historical claims, converts content to English, and validates the normalized monthly content against the existing schema.

Invalid input remains pending or blocked with actionable errors. It does not create downstream production Issues.
