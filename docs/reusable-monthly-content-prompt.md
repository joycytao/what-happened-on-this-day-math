# Reusable monthly content-generation prompt

Use this specification whenever generating a monthly `content/monthly/month-N.json` file. Read the month-specific content example first. For October, use `examples/oct-content-example.rtf`; use `examples/monthly-content.example.json` for JSON field names and answer-key shape.

## Rules

- Research one defensible historical anchor for each calendar day. Keep the historical anchor, event year, source IDs, and classroom practice quantities distinguishable.
- Produce English student-facing output. The internal generation prompt may be written in another language, but every title, passage, question, work step, and final answer shown to students must be English.
- Preserve the existing JSON schema, CSV headers, canonical field names, and four-page daily module.
- Write one Level 1 question, one Level 2 question, and one Level 3 question for every day.
- Level 1 is a short direct addition, subtraction, or simple multiplication question; Level 2 is a distinct multiplication, division, sharing, time, or measurement question; Level 3 is a multi-step, conversion, time, money, comparison, average, or remainder question.
- Use a historical anchor and event-specific wording; do not copy generic scaffolding or duplicate prompts. Pasting an event title into a generic sentence is not event grounding.
- Numbers must be passage-backed or explicitly marked hypothetical. State units and conversion facts when needed.
- Multiple subquestions in Level 3 use semicolon-separated equations in order and complete intermediate/final answers with units.
- Recompute every equation, including every subanswer, and reject duplicate prompts, unsupported numbers, malformed equations, or generic scaffolding.

Before rendering, separately verify calendar coverage, source alignment, English output, prompt uniqueness, event grounding, level distinction, number provenance, multi-equation answer coverage, historical accuracy, and layout.
