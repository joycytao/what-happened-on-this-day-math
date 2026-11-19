# Monthly Production and Social Board Design

**Status:** Draft for owner review
**Date:** 2026-10-27
**Scope:** Monthly math production scheduling, user-provided content intake, downstream product work, social intake, and issue/project organization.

## 1. Decision summary

The math repository will use a two-stage monthly orchestration model:

1. On the third Monday of every month at 09:00 `America/Chicago`, GitHub Actions creates one context-input Issue for the month two months ahead.
2. The owner supplies the month's raw content as a JSON code block in an Issue comment and applies `status: ready to pickup`.
3. The workflow validates the input, researches and records sources, converts Chinese input to English student-facing content, and creates the production workstream Issues.

Math/product work and social work will use separate GitHub Projects. Landing-page and TPT work remain in the Math Production Project because they depend on the released worksheet package. Reels and Carousels use the Social Production Project and are linked to the released monthly package by `month` and `package_id`.

No Excel-based schedule or status source is introduced.

## 2. Evidence and constraints

This design is grounded in the existing repository contracts and issue-linked PR history:

- `docs/content-schema.md` and `schemas/monthly-content-v2.schema.json` define the normalized monthly content contract.
- `docs/november-research-schema.md` and Issues #54–56 separate research, content generation, and validation.
- `docs/monthly-release-workflow.md` defines the ordered release gates and downstream handoff.
- Issues #85, #86, and #96 establish separate cover production and visual QA boundaries.
- Issues #116 and #117 establish separate follow-up-page validation and assembly boundaries.
- Issues #105, #109, and #139 establish social, Carousel, TPT, and landing-page downstream workstreams.
- `docs/agent-governance.md` requires explicit decision ownership, evidence, dependencies, and human approval before `status: ready to pickup`.
- `math/reels/README.md` defines Reel outputs and sensitive-data protection requirements.

Live GitHub issue/project state was not used as an input to this design because the repository runner reported repeated network failure in `reports/github-app-connectivity.json`. Cleanup must therefore begin with a fresh read-only inventory.

## 3. Monthly schedule and trigger

The scheduler runs at 09:00 `America/Chicago` on the third Monday. Since GitHub Actions cron does not express “third Monday” directly, the implementation should use a Monday schedule with a job-level calendar guard for day-of-month 15–21.

The target cycle is two calendar months after the scheduler's current month. For example, the 2026-11-16 run creates the 2027-01 context Issue.

The schedule must be idempotent. A stable marker based on the target `YYYY-MM` must cause reruns to update the existing context Issue rather than create duplicates.

## 4. Context-input Issue

The scheduled Issue is an intake gate, not a generated content artifact. It must include:

- target month and year;
- expected calendar day count;
- JSON input instructions;
- the exact approval label: `status: ready to pickup`;
- the downstream workstream outline;
- a stable monthly marker.

The owner supplies one JSON code block in a comment. The raw input is allowed to be Chinese. The minimum per-day contract is:

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

The workflow must reject malformed JSON, missing days, duplicate dates, missing context, missing levels, or missing answers. It must not treat an unapproved comment as production authorization.

## 5. Normalization, research, and language conversion

After the owner applies `status: ready to pickup`, the workflow creates or updates the monthly production parent and child Issues.

The production worker then:

1. preserves the raw JSON as evidence;
2. researches each historical claim against reliable sources and records source URLs and source metadata;
3. converts context and questions into English student-facing content;
4. preserves all supplied numbers, units, mathematical operations, and intended answers;
5. normalizes the result into the existing monthly content schema;
6. runs content, math, source, and schema validation.

Translation is not allowed to silently change a number, unit, date, operation, or answer. A conflict between the supplied question/answer and the independently recomputed answer blocks the workstream for human review.

## 6. Math Production Project workstreams

For each approved monthly input, create these linked Issues:

1. **Context input and source validation** — validate completeness and research evidence.
2. **Chinese-to-English content conversion** — produce normalized student-facing content.
3. **Math and content validation** — independently recompute answers and validate reading/content rules.
4. **Worksheet pages and answer key** — render daily pages and the three answer-key levels.
5. **Cover** — produce and visually QA the approved cover artifact.
6. **Last/follow-up pages** — produce, validate, and assemble the final follow-up page.
7. **PDF assembly and release QA** — assemble the final package and run release gates.
8. **Landing-page assets and copy** — start only after the worksheet package is released.
9. **TPT assets and copy** — start only after the worksheet package is released.

Issues 8 and 9 are independent and may run in parallel. Issues 5 and 6 remain separate because their prior implementations have separate artifacts and QA evidence. A stable `package_id` is the cross-workstream identity after release.

## 7. Social Production Project

Social work is separated from Math Production. The monthly package release is the dependency boundary. Social Issues must reference the released `package_id`, source artifact paths, and the applicable template.

Create one Issue Form per existing design template:

- Reels: before-after worksheet, perspective sharing, product reel, campaign reminder.
- Carousels: learning system, clean worksheet, perspective, product carousel.

Every social form requires:

- month or cycle;
- asset resources;
- template-specific content inputs;
- expected output;
- CTA and destination.

`Asset usage notes` is conditionally required when assets include external, student, customer, or third-party material. It records whether the material may be publicly used and whether sensitive information is present. It is not required for ordinary internal repository assets.

An Issue is eligible for `status: ready to pickup` only when its required asset resources and template-specific inputs are complete.

## 8. Existing Issue triage

The cleanup workflow must be read-first and reversible in intent:

- close duplicates or work already replaced by the new workflow, with a comment linking the replacement;
- add `backlog` to valid work that is not part of the current cycle;
- retain `status: blocked` for unresolved dependencies;
- preserve completed historical Issues and their evidence as closed;
- leave ambiguous Issues untouched until triage confirms their disposition.

No Issue is deleted. No Issue is closed solely because it is old.

## 9. Project boundaries and configuration

The Math Production Project and Social Production Project must be configured independently. Project owner/number values must be repository variables or workflow inputs; the implementation must not rely on an undocumented hard-coded Project number.

The social queue may continue to use the existing social orchestration logic, but its Project target must be changed to the Social Production Project. Math/product Issues must be added to the Math Production Project. Cross-project links use Issue URLs, `month`, `package_id`, and explicit dependency markers.

## 10. Failure and idempotency behavior

- Missing or invalid input leaves the context Issue open and marked blocked or pending review with an actionable validation report.
- A failed source, translation, math, or rendering gate blocks only the affected monthly workstream and records the evidence.
- Rerunning the scheduler or approval workflow updates Issues using stable markers rather than creating duplicates.
- Downstream work cannot start from an unreleased or stale package.
- A changed final PDF, cover, source asset, or page mapping invalidates affected downstream derived artifacts, matching the existing release contract.

## 11. Acceptance criteria

The implementation is complete only when:

1. A third-Monday 09:00 Central schedule creates exactly one context Issue for the month two months ahead.
2. The context Issue accepts the documented JSON comment format and rejects malformed or incomplete data.
3. Applying `status: ready to pickup` creates the expected Math Production child Issues exactly once.
4. Chinese raw input is converted to English without changing mathematical meaning.
5. Source evidence and validation reports are recorded for every daily historical claim.
6. Landing-page and TPT Issues remain blocked until worksheet release, then become parallel-ready.
7. Social template forms enforce asset resources and expected output, with conditional asset-usage notes.
8. Math and Social Issues land in separate configured Projects.
9. Existing Issue triage produces an auditable close/backlog/blocked decision for every reviewed Issue.
10. Reruns are idempotent and do not duplicate Issues or Project items.

## 12. Out of scope

- Automatically publishing to TPT, landing pages, or social platforms.
- Replacing the existing monthly content schema.
- Introducing Excel as a source of truth.
- Deleting GitHub Issues.
- Deciding the disposition of live Issues without a successful read-only GitHub inventory.
