# Triage Labels

The repository uses the following labels for the Matt-style triage workflow:

- `needs-triage`: the issue has not completed initial triage.
- `needs-info`: the issue cannot proceed until an open question is answered.
- `ready-for-agent`: the issue has sufficient context and exactly one `agent:` label.
- `ready-for-human`: the issue requires human judgment, approval, or action.
- `wontfix`: the issue will not be addressed.

These labels are additive to the repository's existing labels. Existing labels
such as `status: pending review` and `status: ready to pickup` remain available
for the repository's current workflow.

The `Queue agent handoff` workflow produces a queue comment for Codex pickup;
it does not call a model directly.
