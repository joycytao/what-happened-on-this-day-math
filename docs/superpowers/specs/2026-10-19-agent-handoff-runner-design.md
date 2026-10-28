# Agent Handoff and Codex Pickup Runner Design

Date: 2026-10-19
Status: Ready for user review before implementation planning

## Context

The repository now has role-specific decision skills and GitHub workflows that
can create manual prompts, but those workflows do not execute Codex. The
project needs independent agents to hand work to one another without an
OpenAI API token in GitHub Actions.

The existing governance model requires one Decision Owner per open question,
Human Accountable Owner approval before `status: ready to pickup`, and explicit
evidence in Issue decisions. The new system must preserve those rules while
automating the movement of work between roles.

## Goals

- Make agent handoff a first-class, machine-detectable contract.
- Let Codex pickup automation periodically claim eligible GitHub work without
  an API token stored in the repository or GitHub Actions.
- Route work through the existing roles: `pm-triage`, `product-manager`,
  `architect`, `social-expert`, `developer`, and `quality-engineer`.
- Prevent duplicate pickup, duplicate handoff, conflicting Decision Owner
  answers, and accidental readiness approval.
- Preserve an auditable record of what each agent completed and what the next
  agent must do.
- Support implementation work in an isolated worktree and PR-based review.

## Non-goals

- GitHub Actions will not call an LLM or pretend to be an agent runner.
- The system will not store an OpenAI, Anthropic, or other model API token.
- Agents will not merge PRs or bypass Human Accountable Owner approval.
- The first version will not create separate `ig-expert`, `fb-expert`, or
  `tpt-expert` agents; `social-expert` is the initial channel specialist.
- The first version will not automatically publish content externally.

## Proposed architecture

The system has two execution layers:

1. **GitHub coordination layer**
   - GitHub Issues and PRs are the shared state store.
   - Actions validate handoff markers, apply role/state labels, and emit queue
     comments.
   - Actions are idempotent and never invoke a model.

2. **Codex execution layer**
   - A Codex pickup automation periodically scans the repository queue using
     the authenticated repository runner.
   - It claims one eligible handoff, reads the Issue/PR and role skill, performs
     the work in a dedicated worktree, and writes a result handoff.
   - The Codex runtime supplies agent capability and authentication; no model
     API token is exposed to GitHub Actions.

This boundary is necessary because a GitHub-hosted workflow cannot directly
start the Codex desktop/runtime available to the user.

## Agent roles and boundaries

| Role | Owns | Handoff output |
|---|---|---|
| `pm-triage` | routing, completeness, dependencies, readiness recommendation | one Decision Owner or next implementation role |
| `product-manager` | product scope, audience, priority, timing, offer facts | product decision with evidence and acceptance intent |
| `architect` | interfaces, schemas, storage, orchestration, failure policy | technical decision or implementation constraints |
| `social-expert` | Carousel/Reel/social channel rules and content format | domain decision and required content contract |
| `developer` | code, tests, branch, PR, implementation notes | implementation PR and QA handoff |
| `quality-engineer` | verification evidence, test results, output QA | pass/fail report and return-to-developer handoff when needed |

One open question has exactly one Decision Owner. A handoff may name consulted
roles, but a consulted role must not issue a competing authoritative answer.

## State model

The following labels are coordination state, not authorization to merge:

- `agent: pm-triage`
- `agent: product-manager`
- `agent: architect`
- `agent: social-expert`
- `agent: developer`
- `agent: quality-engineer`
- `state: decision-requested`
- `state: decision-complete`
- `state: ready-to-pickup`
- `state: implementation`
- `state: qa`
- `state: changes-requested`
- `state: blocked`
- `state: done`

The existing `status: ready to pickup` label remains the Human Accountable
Owner gate. The new `state: ready-to-pickup` label may describe a proposed
handoff, but it must not replace or silently imply the human-approved status.

## Handoff contract

Every agent handoff is represented by one Issue or PR comment containing the
following marker and fields:

```markdown
<!-- CODEX_HANDOFF:v1 -->

## Handoff

- Handoff ID: `<repository>:<issue-or-pr>:<from>:<to>:<sequence>`
- From: `<role>`
- To: `<role>`
- Work item: `owner/repository#<number>`
- Status: `requested | accepted | completed | blocked | rejected`
- Completed:
  - ...
- Required next action:
  - ...
- Evidence:
  - ...
- Constraints:
  - ...
- Blockers:
  - `none` or explicit dependency
- Expected output:
  - ...
```

The router must reject a handoff when the marker, role, work item, status, or
next action is missing. A handoff ID is idempotency key: reprocessing the same
ID must not create another assignment or comment.

## Pickup protocol

The Codex pickup automation follows this sequence:

1. Run the repository GitHub connectivity runner for Issues, PRs, comments,
   labels, reviews, and checks.
2. If any required read fails, stop without claiming work and record the
   connectivity blocker for the next heartbeat.
3. Select the oldest eligible handoff with no `state: blocked`, no active
   claim, and a role supported by an installed skill.
4. Claim the work by adding one role label and one state label, then write a
   `CODEX_HANDOFF:v1` comment with `Status: accepted`.
5. Read the complete Issue/PR, governance documents, relevant skill, current
   dependencies, and repository instructions.
6. Create or reuse a dedicated worktree from the latest remote `main`.
7. Perform only the role's authorized work. Implementation agents must create
   tests and a PR; decision agents must not change readiness labels.
8. Write a completed or blocked handoff with evidence, next action, and exact
   files/PRs affected.
9. Let the GitHub router assign the next role/state. The Codex pickup loop
   exits after one handoff so another heartbeat can make the next transition.

The runner must not claim two work items in one cycle. Claims expire only by an
explicit `blocked` or `rejected` handoff; stale claims require human review
rather than silent takeover.

## Routing rules

- New or changed Issue with open questions → `pm-triage`.
- Question assigned to a role → corresponding Decision Owner.
- All blocking questions resolved → `pm-triage` review.
- Human approval adds existing `status: ready to pickup` → `developer` pickup.
- Developer PR opened → `quality-engineer`, plus `architect` or
  `social-expert` when the PR touches their contract.
- QA failure → `developer` with `state: changes-requested`.
- QA pass → Human Maintainer review and merge gate.
- Missing prerequisite → `state: blocked` and a linked dependency Issue.

For the current social workstream, #188 and #192 remain paused by product
direction. #187 and #189 are upstream contracts; #190 consumes those contracts;
#191 is downstream of #190.

## GitHub workflow responsibilities

The workflow changes should be split into small, testable Actions:

- `handoff-router.yml`: validate handoff comments and route labels.
- `agent-pickup-queue.yml`: list eligible work and avoid duplicate queue
  comments.
- `decision-owner` trigger: request a role handoff without executing a model.
- `pr-handoff.yml`: route opened PRs to QA and required specialists.
- `handoff-labels.yml`: synchronize role/state labels.

All workflows must use least-privilege permissions, explicit repository-local
markers, and idempotent lookups. They must never treat a failed GitHub read as
an empty queue.

## Verification strategy

- Unit-test handoff parsing, required fields, role allow-list, status
  transitions, and idempotency keys.
- Test that duplicate handoff comments do not create duplicate labels or
  assignments.
- Test that a Decision Owner cannot transition an Issue to
  `status: ready to pickup`.
- Test that an unapproved Issue is not sent to `developer`.
- Test blocked dependency routing and return-to-developer QA routing.
- Validate all workflow YAML and run `git diff --check`.
- Use a dry-run pickup command against fixture Issue/PR data before enabling
  write operations.
- Verify the Codex pickup automation reports a clear no-work, blocked, or
  completed state and leaves no stale claim after a successful handoff.

## Open implementation decisions

The implementation plan must resolve these details without changing the
architecture above:

1. The exact Codex automation heartbeat schedule and quiet/no-op behavior.
2. The local command used by the Codex pickup automation to claim and release
   a work item.
3. Whether labels or Issue comments are the primary visible queue state when
   they disagree; the recommendation is comments are the audit record and
   labels are the derived routing index.
4. The minimum repository permissions needed for branch creation and PR
   creation from the Codex worktree.
