# November Research Artifact

The tracked research artifact is `research/november-events.json`, validated against `schemas/november-research.schema.json`. This is the contract for Issues #54 and #55.

## Date model

The artifact is month-only and uses an explicit `month/day` pair: the top-level `month` and every record's `month` are `11`, and `day` is `1` through `30`. `eventYear` is separate historical metadata and is never the worksheet calendar year.

`dateQualifier` is `exact`, `approximate`, `disputed`, or `year-independent`. Exact records require a positive `eventYear`. Approximate or disputed records require `eventYearNote`. Year-independent records set `eventYear` to `null` and require `eventYearNote`.

## Fields and boundaries

Each record has a title, a child-accessible claim, one approved theme (`inventions_daily_life`, `animals_dinosaurs`, or `incredible_challenges`), and `sourceIds`. Each source has `id`, `title`, `publisher`, an HTTPS `url`, and ISO `accessedDate` (`YYYY-MM-DD`). Source IDs are retained as `Source_IDs` for later content generation and validation.

The example at `examples/november-research.example.json` demonstrates shape only. Production `research/november-events.json` must contain all 30 unique days; completeness and source resolution are later validation rules in Issue #56. This contract does not store reading passages, trivia, math prompts, or answer keys; Issue #55 generates those in the monthly-content v2 schema.
