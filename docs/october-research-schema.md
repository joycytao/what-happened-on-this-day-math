# October Research Artifact

The tracked research artifact is `research/october-events.json`, validated against `schemas/october-research.schema.json`.

## Date model

The artifact is month-only and uses an explicit `month/day` pair: top-level `month` and each record's `month` are the integer `10`, while `day` is 1 through 31. `eventYear` is separate historical metadata and may differ for every day; it is never the worksheet calendar year.

`dateQualifier` is `exact`, `approximate`, `disputed`, or `year-independent`. Exact records require a positive `eventYear`. Approximate or disputed records require `eventYearNote`. Year-independent records set `eventYear` to `null` and require `eventYearNote`.

## Fields and boundaries

Each record has `title`, an elementary-student-accessible `claim`, one approved theme (`inventions_daily_life`, `animals_dinosaurs`, or `incredible_challenges`), and `sourceIds`. Each source has `id`, `title`, `publisher`, an HTTPS `url`, and ISO `accessedDate` (`YYYY-MM-DD`). IDs resolve within the artifact and are retained by #33 as `Source_IDs`, `Source_URLs`, `Source_Titles`, and `Source_Accessed_Dates`.

The example at `examples/october-research.example.json` demonstrates shape only. Production `research/october-events.json` must contain all 31 unique days; completeness and source resolution are validator rules after research is added. This contract does not store reading passages, trivia, math prompts, or answer keys; #33 generates those in the existing monthly content schema.
