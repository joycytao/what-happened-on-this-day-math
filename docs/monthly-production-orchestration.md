# Monthly production orchestration

## Scheduling and source of truth

`.github/workflows/monthly-context-queue.yml` runs on the third Monday at
09:00 Central. GitHub Actions cron is UTC-only, so it schedules both possible
UTC hours and applies an `America/Chicago` 09:00 job guard. The generated
Issue targets the month two months ahead. The stable marker is
`<!-- monthly-context: YYYY-MM -->`.

The owner supplies one comment containing
`<!-- monthly-content-input: YYYY-MM -->` and a fenced JSON object. The
validator checks calendar-day coverage, dates, context, and all three question
levels. Chinese is allowed in the raw input; conversion to student-facing
English is a production workstream, not a requirement on the intake author.
Only the exact label `status: ready to pickup` starts production queueing.

## Math Project graph

`.github/workflows/monthly-production-queue-v2.yml` reacts to that label and
creates or updates one parent plus these nine idempotent Issues in the Math
Production Project:

```text
context-source -> content-conversion -> math-validation
                                      ├-> worksheet-answer-key ─┐
                                      ├-> cover                  ├-> release-qa
                                      └-> follow-up-pages       ┘
release-qa -> landing-page
release-qa -> tpt
```

The final two branches are parallel after release QA. Every child body carries
the month marker, source Issue, raw input comment identity, workflow run, and
completion-evidence requirements. The queue adds Issues to the configured
Project when the repository variables `MATH_PROJECT_OWNER` and
`MATH_PROJECT_NUMBER` are present, but deliberately does not guess or overwrite
Project status options. If those variables are not configured, Issue creation
still succeeds and the run emits a warning.

Project routing is optional metadata, not a monthly-content validation gate. An
empty or partially configured owner/number pair is treated as not configured:
the workflow may omit Project insertion and warn, but it must still validate
the monthly input and create the production Issues. This behavior was added
after the monthly context validation reported `project owner and number are
required` even though the input contract itself does not contain Project
metadata. Acceptance: a plan with missing or partial Project configuration is
valid and records `Math Production Project: not configured`.

Because this repository uses a user-owned Project, configure the repository
secret `PROJECTS_TOKEN` with a classic Personal Access Token using the `project`
scope and repository access. The default Actions `GITHUB_TOKEN` cannot access
user-owned Projects.

## Release handoff and social separation

Landing-page and TPT work consume the released monthly package. Their workflows
check out the exact release run commit and validate the release manifest's
release status, stale flag, required gates, month/year, and `packageId` before
doing downstream work. Social work remains in the separate Content Pipeline
Project; its monthly queue starts only after the successful monthly release.

## Failure evidence and recovery

- Missing or invalid context: the queue comments the source Issue with the
  validation errors and creates no production children.
- Duplicate scheduler delivery: marker lookup updates the existing Issue; it
  does not create a second identity.
- Stale or mismatched release: the downstream validation step fails before
  asset generation or handoff.
- Generation or QA failure: the workstream Issue records the run/artifact and
  remains blocked or pending review; publication is never automatic.

For recovery, correct the source evidence or release artifact, rerun the
corresponding workflow, and inspect the marker-matched Issue and run URL. Do
not delete historical Issues to repair a duplicate; preserve the evidence and
use the stable marker to reconcile state.

## Local verification

Run the focused contracts with:

```sh
node --test tests/monthly-production-orchestration.test.mjs tests/monthly-production-queue.test.mjs tests/monthly-production-queue-workflow.test.mjs tests/monthly-downstream-dependencies.test.mjs
```

The queue tests use local issue/comment fixtures and do not mutate GitHub.
The implementation work in this repository likewise performs no live GitHub
mutation during local verification; live triage remains a separate, explicit
operator action.
