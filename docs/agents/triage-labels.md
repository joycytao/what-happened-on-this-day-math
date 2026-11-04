# Triage Labels

Use a small canonical label set. A label is a routing signal; the matching
comment is the human-readable explanation.

## Labels that affect routing

- `agent: pm-triage`, `agent: product-manager`, `agent: architect`,
  `agent: social-expert`, `agent: developer`, `agent: quality-engineer`: the
  single current owner. Never apply more than one `agent:*` label.
- `status: pending review`: readable intake waiting for PM triage.
- `status: blocked`: a named dependency or required input prevents progress.
- `status: ready to pickup`: routine implementation may begin; it does not
  mean the Human Accountable Owner must review every ordinary task.
- `status: qa`: implementation is complete and QA evidence is requested.
- `status: paused`: intentionally deferred by an explicit priority decision.
- `status: ready to dispatch`: QA passed, but public or downstream dispatch
  still needs Human Accountable Owner approval.
- `status: done`: work is complete.
- `ready-for-human`: one specific human decision or approval is required.
- `state: decision-requested`, `state: implementation`, and
  `state: changes-requested`: active decision, implementation, or QA feedback
  states.

## Labels removed from the routing vocabulary

Do not use `needs-triage`, `needs-info`, `ready-for-agent`, `agent-requested`,
`decision-owner:*`, `state: decision-complete`, `state: ready-to-pickup`,
`state: blocked`, `state: qa`, or `state: human-review`. They duplicate a
canonical status, owner, or explicit comment.

## Bootstrap and handoff

`status: pending review` is an intake state for `pm-triage`, not a dead end.
PM triage may bootstrap a readable Issue, assign exactly one `agent:*` owner,
and record a `CODEX_HANDOFF:v1` comment. The handoff must end in one legal
outcome:

- `state: decision-requested` for a domain decision;
- `status: blocked` for a named dependency or missing required input;
- `status: ready to pickup` for routine implementation when the inputs and
  dependencies are complete; or
- `ready-for-human` for UI/UX, credential/account, publication, or another
  human approval gate.

Required inputs include monthly content, final PDF, canonical references,
source data, and approved brand assets when the Issue declares them. Missing
inputs are blockers, not permission to invent substitutes.

UI/UX previews, new or elevated key/token/account access, and public or
downstream dispatch require Human Accountable Owner review.

Type labels (`type: feature`, `type: bug`, and `type: documentation`) and the
monthly content label remain descriptive filters. They never make an Issue
eligible by themselves.
