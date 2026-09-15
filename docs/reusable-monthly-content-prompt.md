# Reusable monthly content-generation prompt

Use this specification whenever generating a monthly `content/monthly/month-N.json` file. Read the month-specific content example first. For October, use `examples/oct-content-example.rtf`; use `examples/monthly-content.example.json` for JSON field names and answer-key shape.

## Rules

- Research one defensible historical anchor for each calendar day. Keep the historical anchor, event year, source IDs, and classroom practice quantities distinguishable.
- Produce English student-facing output. The internal generation prompt may be written in another language, but every title, passage, question, work step, and final answer shown to students must be English.
- Preserve the existing JSON schema, CSV headers, canonical field names, and four-page daily module.
- Write one Level 1 question, one Level 2 question, and one Level 3 question for every day.
- Write the reading passage as a history-first story, separate from all three math questions. Do not put practice numbers, answer hints, worksheet instructions, validation language, or generic teaching commentary in `readingPassage`.
- Before drafting each passage, answer six internal questions: Who is the subject and who is the child audience? What is the single event or idea? When did it happen? Where did it happen? Why does the event matter? How did the event, invention, action, or response work? Use only answers supported by the historical source.
- Shape the passage with 起承轉合 (beginning, development, turn, conclusion): begin with a child-facing question or immediate point; develop the time, place, people, and concrete fact; use the turn to show the event's central challenge or solution; conclude with the historical significance without adding a lesson-plan or worksheet message.
- Keep the first three sentences focused on why the event matters to the child. Use one central event, concrete details, and age-appropriate English. Delete digressions, repeated transitions, unsupported drama, and abstract filler during revision.
- Make the displayed `hook` specific to the historical event; never repeat a generic date clue such as `What clue would you check first on October X?` when the passage already opens with its own child-facing question.
- Level 1 is a short direct addition, subtraction, or simple multiplication question; Level 2 is a distinct multiplication, division, sharing, time, or measurement question; Level 3 is a multi-step, conversion, time, money, comparison, average, or remainder question.
- Use a historical anchor and event-specific wording; do not copy generic scaffolding or duplicate prompts. Pasting an event title into a generic sentence is not event grounding.
- Numbers must be passage-backed or explicitly marked hypothetical. State units and conversion facts when needed.
- Multiple subquestions in Level 3 use semicolon-separated equations in order and complete intermediate/final answers with units.
- Recompute every equation, including every subanswer, and reject duplicate prompts, unsupported numbers, malformed equations, or generic scaffolding.
- For passages, reject repeated sentences, generic filler, worksheet/meta phrases, missing six-question coverage, and passages that drift away from the single historical fact.

Before rendering, separately verify calendar coverage, source alignment, English output, prompt uniqueness, event grounding, level distinction, number provenance, multi-equation answer coverage, historical accuracy, and layout.
