# Scheduled routines inventory

Status: evidence complete for repository workflows; no destructive scheduler change authorized.

## Repository workflow inventory

| Workflow | Trigger | Classification | Decision |
| --- | --- | --- | --- |
| `.github/workflows/tpt-release-trigger.yml` | `workflow_run` for successful `Monthly package release`; also manual `workflow_dispatch` | Release-event entrypoint plus manual rerun | Keep. This is the authoritative monthly release source event. |
| `.github/workflows/tpt-workstream.yml` | `workflow_call` plus manual `workflow_dispatch` | Reusable/manual workstream | Keep. It is called by the release trigger and is not a schedule. |
| `.github/workflows/agent-pickup-queue.yml` | `issues: closed` | Queue notification event | Keep. It announces eligible Issues after closure and does not generate social artifacts. |
| `.github/workflows/dependency-unblock.yml` | `issues: closed` | Dependency event | Keep. It removes blocked labels only when explicit dependency markers are present. |
| `.github/workflows/sync-labels.yml` | Manual `workflow_dispatch` | Label maintenance | Keep. It is manually invoked and does not generate social artifacts. |

## Search result

The repository contains no `on.schedule` or `cron` trigger. Product Reel and Carousel generators are repository scripts invoked manually today; no GitHub Actions workflow in this repository schedules or directly invokes them.

The intended monthly order remains:

`successful monthly release → TPT workstream + Product Reel workstream → paired Carousel workstream`

The Product Reel and Carousel workstreams must remain downstream of the release gate and must not be started by a Project status transition.

## External scheduler boundary

The current hourly Codex automation is configured outside this repository at:

`/Users/jtao/.codex/automations/math-agentic-workflow/automation.toml`

Its role is Issue orchestration and queue coordination. It is not a repository content-generation workflow. Its independent-work continuation rule was updated to allow unrelated ready Issues to continue when one workstream is blocked.

This repository cannot safely retire or modify that external automation through a GitHub PR. Any future change requires the automation owner to name the routine, desired schedule, replacement behavior, and rollback plan.

## Decision

- No repository scheduled routine is identified for retirement.
- Keep `tpt-release-trigger.yml` as the release-event source of truth.
- Do not add a duplicate social-content schedule in this Issue.
- Keep the external Codex orchestration heartbeat active unless its owner explicitly requests a separate lifecycle change.
- Issue #144 should not be marked complete until the owner confirms whether any external scheduler is in scope.
