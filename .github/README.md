# GitHub Project Governance

This repository uses the shared governance kit from `/Users/jtao/Documents/Projects/6pm/projects/.github-governance`.

## Issue lifecycle

- New Feature Requests receive `type: feature` and `status: pending review`.
- After human review, change the status to `status: ready to pickup`.
- Agent pickup excludes `status: blocked`; the agent determines execution order from the full Issue context and project dependencies.
- Issue number and title prefixes such as `[NN/Total]` are informational only.

Run `Sync issue labels` from GitHub Actions to create or update the shared labels. When an Issue closes, `Announce next agent pickup` identifies the next eligible Issue.

## Monthly context intake

The monthly context scheduler creates one `[Monthly context] YYYY-MM` Issue on the third Monday at 09:00 `America/Chicago` for the month two cycles ahead. The owner supplies one marked JSON comment and applies `status: ready to pickup` only after validation-required fields are complete. The approval label is the gate for creating the monthly production workstream; an unapproved or invalid comment does not create child Issues.

## Issue triage safety

Run `npm run github:issues:inventory -- --owner joycytao --repo what-happened-on-this-day-math` for a read-only inventory. A failed GitHub runner read is an error, not an empty result. Review the generated disposition file before any mutation. Closing duplicates or adding `backlog` requires `node scripts/apply-issue-triage.mjs --owner ... --repo ... --disposition reports/issue-triage-disposition.json --confirm`; blocked, closed, and ambiguous Issues are preserved.

Agents must respond to every new PR comment: update the same PR when the implementation can be corrected, or create a linked dependency Issue and apply `status: blocked` to both the original Issue and PR when a prerequisite is missing. The dependency Issue must contain `CODEX_DEPENDENCY_FOR: owner/repository#number`. Closing it removes `status: blocked`; human review is required before the original Issue becomes ready again.
