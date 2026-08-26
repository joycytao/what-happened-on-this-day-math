# AGENT.md

## Project purpose

This project creates one monthly elementary-school learning packet based on
“What Happened on This Day.” Each daily entry combines a short, engaging
historical story with three differentiated math tasks that use numbers from
the story.

All student-facing content must be written in English. Internal notes,
validation messages, and implementation documentation may be written in
Chinese or English.

## Source of truth

Before creating or changing content, read the relevant files in the directory
whose exact filesystem name is `references ` (it includes a trailing space):

- `references /Daily History & Math Data Processing.md`
- `references /question_types_and_examples.md`
- `references /reading_passage.md`
- `references /tpt_pdf_layout.md`

Use those files as the project’s content, question-design, reading-level, and
layout requirements. Do not silently invent a different schema or page
structure. If a reference file is missing or its path cannot be resolved,
report the problem before generating final content.

## Monthly production model

The packet has one four-page module for every calendar day in the requested
month, followed by a six-page answer key.

Each daily module is always ordered as follows:

1. Reading Passage
2. Level 1 Math Task
3. Level 2 Math Task
4. Level 3 Math Task

The answer key is always the final six pages:

- Level 1 Answer Key: 2 pages
- Level 2 Answer Key: 2 pages
- Level 3 Answer Key: 2 pages

The expected total page count is:

- 30-day month: `30 × 4 + 6 = 126 pages`
- 31-day month: `31 × 4 + 6 = 130 pages`

Always determine the actual number of days from the requested month. Do not
use 30 or 31 by assumption, and do not count February incorrectly.

## Historical topic selection

Choose topics that are interesting and accessible to elementary students. The
preferred themes are:

- Inventions & Daily Life
- Animals & Dinosaurs
- Incredible Challenges

Avoid politics, wars, treaties, partisan controversy, graphic violence, and
topics that require extensive background knowledge. A date may be connected to
an invention, an inventor’s birthday, an animal or dinosaur fact, a record,
an exploration or challenge, a patent, or a quirky holiday when the connection
is historically defensible.

Prefer one clear event or fact per day. Do not combine unrelated events merely
to fill space.

## Daily content requirements

Every daily entry must provide the following fields or equivalent page
content:

- **Date**: the specific calendar date.
- **Emoji**: exactly one attention-catching emoji that fits the topic.
- **Title**: short, suspenseful, surprising, or counter-intuitive.
- **Hook**: one or two lines that connect the topic to a child’s daily life or
  ask an engaging question.
- **Core Story**: a concise historical explanation focused on one funny,
  surprising, risky, or challenging detail.
- **Trivia**: one or two bite-sized facts.
- **Math Level 1**: a low-grade subtraction or addition task.
- **Math Level 2**: a multiplication, division, sharing, or basic scale task.
- **Math Level 3**: a multi-step task, unit conversion, time calculation,
  money comparison, or other elementary-school logic challenge.
- **Answer Key**: the equation, working, and final answer for all three levels.

The Reading Passage must be 150–250 English words. Its first paragraph must
begin with a child-friendly, everyday-life question or situation. Keep the
story focused on one conflict, mistake, challenge, or memorable detail.

Naturally include the key numbers needed by the math tasks, such as years,
ages, quantities, distances, heights, weights, temperatures, prices, or
durations. The math should grow out of the story rather than use unrelated
numbers.

Use a friendly, humorous, relatable tone. Keep sentences readable for
elementary students. Use Markdown bolding for important names, events, and
numbers when the output format supports Markdown, and use emojis sparingly
outside the required topic emoji.

## Differentiated math design

Create exactly one task for each level per day. The three levels must use the
same historical context while increasing in complexity.

### Level 1

- Intended for lower elementary students.
- Use direct addition or subtraction, normally within 50.
- Keep the wording short and literal.
- Prefer numbers already stated in the passage.
- Avoid unnecessary reading load, regrouping, fractions, and multi-step logic.

### Level 2

- Intended for middle elementary students.
- Use multiplication, division, equal sharing, simple multiples, or a basic
  length/weight comparison.
- Include an everyday scenario such as sharing snacks, arranging objects, or
  comparing the story’s measurement with a familiar object.
- Use remainders only when the question clearly asks what remains.

### Level 3

- Intended for upper elementary students.
- Use two or more operations, time or money comparisons, unit conversion,
  proportional reasoning, or a logical measurement challenge.
- State all units and conversion facts needed to solve the problem.
- Ensure the numbers are appropriate for elementary arithmetic and that the
  task has one unambiguous answer.

Do not make Level 2 or Level 3 merely longer versions of Level 1. They must
test a distinct mathematical idea while remaining grounded in the same story.

## Answer-key requirements

The answer key must be complete and teacher-friendly. For every date, list:

1. the level and task identifier;
2. the equation or equations;
3. any unit conversion or intermediate step;
4. the final answer with its unit or meaning.

Before finalizing, independently recompute every answer. Check that each
number in a math task appears in the story or is explicitly introduced as an
allowed comparison or conversion value.

## Research and factual accuracy

Historical claims must be checked against a reliable source before being
presented as fact. Prefer primary sources, museums, universities, libraries,
official institutions, or well-established reference works. Record or retain
the source used for each entry when the surrounding workflow supports source
metadata.

When a date is disputed, approximate, or commonly misreported, choose a more
defensible fact or clearly qualify the wording. Never fabricate a precise date,
number, quote, record, or attribution just to make the math work.

## Validation checklist

Before delivering a monthly packet, verify all of the following:

- The requested month has the correct number of calendar days.
- There are exactly four pages/modules per day in the required order.
- There are exactly six answer-key pages at the end.
- The computed total is 126 pages for a 30-day month or 130 pages for a
  31-day month.
- Every date appears exactly once and is in calendar order.
- Every entry uses one preferred theme and avoids unsuitable subject matter.
- Every Reading Passage is 150–250 English words and starts with a relatable
  hook.
- The passage contains the numbers used by the associated math tasks.
- Level 1, Level 2, and Level 3 are genuinely differentiated.
- Every problem is solvable with elementary-school mathematics and has one
  clear answer.
- Every answer key equation, intermediate step, unit, and final answer is
  correct.
- Names, dates, measurements, and historical claims have been fact-checked.
- Student-facing output is in English and uses consistent terminology,
  punctuation, formatting, and units.
- The final layout keeps the four daily page types separate so that teachers
  can print or assign levels independently.

If any validation check fails, fix the content before producing the final
packet and report any unresolved limitation explicitly.

## Output discipline

Follow the requested output medium exactly. If a CSV template is supplied,
update the matching monthly file and preserve its headers and row structure.
If a PDF or printable packet is requested, preserve the five-part layout model
and page-count rules above. Do not replace the requested artifact with a plain
text summary.

When generating a monthly packet, begin by stating the target month, number of
calendar days, expected page count, and source files used. Finish by reporting
the validation result and any remaining issues.
