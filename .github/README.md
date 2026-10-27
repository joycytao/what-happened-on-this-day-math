# GitHub Project Governance

This repository uses the shared governance kit from `/Users/jtao/Documents/Projects/6pm/projects/.github-governance`.

## Issue lifecycle

- New Feature Requests receive `type: feature` and `status: pending review`.
- After human review, change the status to `status: ready to pickup`.
- Agent pickup excludes `status: blocked`; the agent determines execution order from the full Issue context and project dependencies.
- Issue number and title prefixes such as `[NN/Total]` are informational only.

Run `Sync issue labels` from GitHub Actions to create or update the shared labels. When an Issue closes, `Announce next agent pickup` identifies the next eligible Issue.

When an Issue receives `needs-triage`, `decision-owner:*`, `ready-for-agent`, or
`status: ready to pickup`, `Queue agent handoff` creates one idempotent
`CODEX_AGENT_HANDOFF` queue comment. `ready-for-agent` and `status: ready to
pickup` require exactly one supported `agent:` label. GitHub Actions queues the
request for Codex; it does not call a model directly.

Agents must respond to every new PR comment: update the same PR when the implementation can be corrected, or create a linked dependency Issue and apply `status: blocked` to both the original Issue and PR when a prerequisite is missing. The dependency Issue must contain `CODEX_DEPENDENCY_FOR: owner/repository#number`. Closing it removes `status: blocked`; human review is required before the original Issue becomes ready again.

## Decision Owner routing

Apply exactly one Decision Owner label when an Issue needs a technical or
product decision:

- `decision-owner: architect`
- `decision-owner: product-manager`

The shared `Queue agent handoff` workflow adds `agent-requested` and writes a
marked Codex queue prompt to the Issue. It does not execute an agent, answer
the question, or change `status: ready to pickup`. After the agent responds,
`pm-triage` records the Decision Owner's conclusion and evidence.

## Versioned agent handoffs

The automated route is split into two layers:

- GitHub Actions validate `CODEX_HANDOFF:v1`, apply derived `agent:*` and
  `state:*` labels, and route implementation PRs to QA.
- Codex pickup uses `scripts/agent-pickup.mjs` through the repository GitHub
  connectivity runner. It claims at most one item, works in a fresh worktree
  from remote `main`, and writes the next handoff comment.

No workflow invokes an LLM and no repository OpenAI token is required. The
human `status: ready to pickup` label remains the approval gate. See
`docs/agent-governance.md` and `docs/agent-runner.md` for the contract and
recovery rules.
