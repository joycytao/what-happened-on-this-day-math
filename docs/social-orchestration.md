# Social content orchestration contract

This contract separates queue plumbing from production work.

## Responsibilities

- GitHub Actions creates or updates idempotent parent and child Issues, applies
  workstream/status labels, adds the Issues to the existing `Content Pipeline`
  Project (`https://github.com/users/joycytao/projects/2`), and unblocks the
  next dependent Issue after a child closes.
- Codex automation is the only production worker. It picks up the ready Issues,
  runs the documented Reel/Carousel command, creates the implementation PR, and
  records artifact, QA, and blocker evidence.
- GitHub Actions does not render social assets, diagnose student work, publish
  to social platforms, or run a competing production-generation cron.

## Monthly queue

`.github/workflows/social-monthly-queue.yml` listens for a successful
`Monthly package release` workflow and also supports manual dispatch. The
workflow creates or updates one monthly parent, four Product Reel Issues, and
four paired Carousel Issues using the stable `package_id` marker. Product Reel
week N is ready first; its paired Carousel is blocked until the Reel Issue
closes. The existing release gate remains the source event.

The monthly queue requires these inputs: `month`, `year`, `package_id`,
`manifest_path`, `content_path`, and `thumbnail_manifest_path`. The Project
owner/number default to `joycytao`/`2` and can be overridden by dispatch inputs
or repository variables. The workflow only adds items to the Project and does
not update the existing `Status` field or invent custom field option IDs.

## Utility queue

`.github/workflows/social-utility-queue.yml` runs when the owner labels a
`[Utility Reel intake]` Issue `status: ready to pickup`, or by manual dispatch.
It creates or updates one cycle parent and three sequential Utility Reel Issues.
Only week 1 is initially ready; later weeks are unblocked after the prior child
closes. The intake and 90-day privacy contract remain defined in
`docs/utility-reel-workflow-contract.md`.

## Labels and idempotency

Workstream labels are `social:product-reel`, `social:carousel`, and
`social:utility-reel`. Source labels are `content:monthly` and
`content:utility`; lifecycle remains `status:ready to pickup`, `status:blocked`,
`status:pending review`, and `status:qa`. Issue bodies carry month/cycle,
source paths, workflow run, week, and artifact instructions so the existing
Project can remain the operational view without requiring custom fields.

Rerunning a queue workflow finds the marker in an existing Issue body and
updates that Issue instead of creating a duplicate. It never changes a closed
historical Issue into a new identity without the same marker.

## Failure and release behavior

The release workflow must succeed before the monthly queue is eligible. Missing
source/package inputs fail plan generation. A failed generator, privacy gate,
or QA gate stays in the Issue's `status:blocked` or `status:qa` state; no
workflow marks an artifact published or deploys it automatically.
