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
  `state: changes-requested`: active decision, implementation, or QA feedback.

Do not use `needs-triage`, `needs-info`, `ready-for-agent`, `agent-requested`,
`decision-owner:*`, `state: decision-complete`, `state: ready-to-pickup`,
`state: blocked`, `state: qa`, `state: human-review`, or `state: done`.
They duplicate a canonical status, owner, or explicit comment.

Type labels and the monthly content label remain descriptive filters. They
never make an Issue eligible by themselves.
