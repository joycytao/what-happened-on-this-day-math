# GitHub Project Governance

This repository uses the shared governance kit from `/Users/jtao/Documents/Projects/6pm/projects/.github-governance`.

## Issue lifecycle

- New Feature Requests receive `type: feature` and `status: pending review`.
- After human review, change the status to `status: ready to pickup`.
- Agent pickup excludes `status: blocked`; the agent determines execution order from the full Issue context and project dependencies.
- Issue number and title prefixes such as `[NN/Total]` are informational only.

Run `Sync issue labels` from GitHub Actions to create or update the shared labels. When an Issue closes, `Announce next agent pickup` identifies the next eligible Issue.
