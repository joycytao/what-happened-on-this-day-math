# Monthly Content Schema

## Purpose

`schemas/monthly-content.schema.json` defines the canonical JSON contract between research, writing, math generation, validation, and printable rendering for one "What Happened on This Day" monthly worksheet packet.

The schema follows the project requirements in `AGENTS.md` and the files in `references `:

- `Daily History & Math Data Processing.md`
- `question_types_and_examples.md`
- `reading_passage.md`
- `tpt_pdf_layout.md`

## Required Fields

Top-level monthly content requires:

- `schemaVersion`: fixed at `1.0.0`.
- `month`: the target calendar month in `YYYY-MM` format.
- `days`: one ordered daily record per calendar day in the month.
- `answerKey`: answer-key entries grouped by `level1`, `level2`, and `level3`.
- `sources`: source metadata cited by daily records.

Each daily record requires:

- `date`: the calendar date in `YYYY-MM-DD` format.
- `emoji`: exactly one topic emoji for the day.
- `theme`: one approved theme: `inventions_daily_life`, `animals_dinosaurs`, or `incredible_challenges`.
- `title`: short student-facing title.
- `hook`: everyday-life setup or question.
- `readingPassage`: English passage intended to be validated at 150-250 words.
- `trivia`: one or two bite-sized facts.
- `mathLevels`: one task each for `level1`, `level2`, and `level3`.
- `answers`: equation, working, and final answer for all three levels.
- `answerKeyEntries`: the three stable answer-key IDs for this date.
- `sourceIds`: one or more IDs from top-level `sources`.

## Invalid Fields

The schema sets `additionalProperties: false` on the top-level object and nested record objects. Unknown fields are invalid unless the schema is intentionally versioned and updated.

Invalid values include:

- dates outside `YYYY-MM` or `YYYY-MM-DD` format;
- themes outside the approved set;
- missing math levels or answer fields;
- empty prompts, source IDs, equations, working, or final answers;
- non-HTTPS source URLs;
- answer-key IDs outside the `YYYY-MM-DD:levelN` format.

## Daily Page Model

Each daily record maps to four printable student pages:

1. Reading Passage
2. Level 1 Math Task
3. Level 2 Math Task
4. Level 3 Math Task

`level1` should use direct addition or subtraction, normally within 50. `level2` should use multiplication, division, equal sharing, or simple comparison. `level3` should use a stronger challenge such as elapsed time, multi-step arithmetic, unit conversion, money comparison, or logic.

## Answer Key Model

The monthly answer key groups entries by level so renderers can produce the final six answer-key pages:

- `answerKey.level1`: Level 1 answer entries.
- `answerKey.level2`: Level 2 answer entries.
- `answerKey.level3`: Level 3 answer entries.

Every answer key entry uses `entryId` in the form `YYYY-MM-DD:levelN` and repeats the date, level, equation, working, and final answer from the daily record.

## Validation Rules

The example validator at `scripts/validate-content-example.mjs` checks the repository's example record against the schema contract and project-specific requirements that JSON Schema alone does not express cleanly:

- the schema declares JSON Schema draft 2020-12;
- all required top-level and daily fields are present;
- the example uses schema version `1.0.0`;
- the passage is 150-250 English words;
- the theme is in the approved set;
- each level has a prompt, skill, page type, and numbers used;
- each answer has equation, work, and final answer;
- daily source IDs resolve to top-level sources;
- answer-key IDs link each date and level to the grouped answer key.

The reusable validator at `src/content-validation.mjs` additionally checks each daily record before rendering:

- required fields, approved themes, real dates, source references, and duplicate dates;
- 150-250-word reading passages and exactly one topic emoji;
- level-appropriate skills and story/task number relationships;
- arithmetic equations by independently evaluating both sides and matching the final answer;
- answer-key entries against the corresponding daily answers.

It returns `{ valid, errors }`, where each error includes the row-like path to the invalid field. Invalid fixtures should assert both a failing result and the actionable reason.

## Canonical CSV Contract

The monthly CSV generator uses this exact header order:

```text
Date,Emoji,Title,Hook,Core_Story,Trivia,Math_Level_1,Math_Level_2,Math_Level_3,Math_Answer_1,Math_Answer_2,Math_Answer_3,Source_IDs,Source_URLs,Source_Titles,Source_Accessed_Dates
```

`Math_Level_1` through `Math_Level_3` contain the three task prompts. Each `Math_Answer_*` cell contains a JSON object with `equation`, `work`, and `finalAnswer`. `Trivia` and the plural `Source_*` cells contain JSON arrays so commas, quotes, line breaks, Markdown, emoji, and multiple sources round-trip without an implicit delimiter. New files do not include the legacy `Math_Challenge` or `Math_Answer` columns. The renderer should read only these canonical columns.

The Answer Key renderer reads `answerKey.level1`, `answerKey.level2`, and
`answerKey.level3`, then emits six SVG pages in level order (two pages per
level). Entries are placed left to right, then top to bottom in the
`template-05.png` grid; unused slots remain blank. Each page is `1545 × 1999`.

Generate or update a file with:

```bash
npm run csv:generate -- examples/monthly-content.example.json history_today_1969-07.csv
```

When the destination already exists, its canonical header is required, matching dates are replaced, and unrelated existing rows are retained.

Validate a monthly CSV before worksheet rendering with:

```bash
npm run csv:validate -- history_today_1969-07.csv [validation-report.json]
```

Validation checks the exact canonical header, row widths, complete real dates in chronological calendar order, required story/math fields, 150-250-word passages, JSON arrays for trivia and sources, aligned HTTPS source metadata, and independently recomputed answer equations. It exits non-zero and prints row- and field-level errors when invalid; the report records the inferred month, expected date count, row count, and date-order result.

Run:

```bash
npm test
```

## Versioned worksheet templates

Issue #5's supplied PNG designs are preserved under `assets/templates/v1/`.
The versioned `manifest.json` identifies the five canonical variants, their
pixel dimensions, source attachment URLs, SHA-256 hashes, layout properties,
and content-field mapping:

- `reading-passage.png`: Reading Passage, using `Date`, `readingPassage`, `title`,
  `hook`, `trivia`, and `Emoji`.
- `level-1.png`: Level 1, using `Date` and `Math_Level_1`.
- `level-2.png`: Level 2, using `Date` and `Math_Level_2`.
- `level-3.png`: Level 3, using `Date` and `Math_Level_3`.
- `template-05.png`: Answer Key grid, using the three `Math_Answer_*` fields.

The old `template-01.png` through `template-04.png` local copies were
duplicates of the semantic files and are not stored twice. Their source URLs
and hashes remain recorded as `sourceOnly` provenance entries in the manifest.
Validate that the retained files remain unchanged with:

```bash
npm run templates:validate
```

The Reading Passage renderer reconstructs the supplied visual composition as
an SVG page, preserving the `1545 × 2000` portrait dimensions and the
`reading-passage.png` v1 field mapping. It validates required fields, the
150–250 word passage limit, question hook, and text-area capacity before
writing output:

```bash
npm run reading:render -- examples/monthly-content.example.json /tmp/reading-passage.svg 1969-07-20
```

The optional date selects a record from `days`; without it, the first record
is rendered. The output is one self-contained printable SVG page.

For review, this branch includes a generated example at
`docs/mockups/reading-passage-1969-07-20.svg`, produced from the same CLI and
the July 20 example record.

The renderer validates the daily `emoji` and `trivia` fields for schema
completeness, but does not print either field on the Reading Passage page;
the supplied design reserves the centered calendar for the date and leaves
the bottom area for the supplied 6pm logo.

The article text is grouped in a `1235`-unit-wide container from x=`155` to
x=`1390`, matching the full span of the Name/Date header. The regenerated
article is shifted down visibly while retaining the prior body font size.

The supplied 6pm footer logo is rendered as one grouped mark and scaled to
approximately 50% of the prior mockup size while remaining anchored in the
same bottom-right area.
