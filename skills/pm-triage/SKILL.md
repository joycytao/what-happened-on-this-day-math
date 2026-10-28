---
name: pm-triage
description: Use when a repository has new or existing GitHub Issues with open questions, unclear ownership, missing acceptance details, or dependency uncertainty before work is picked up.
---

# PM Triage

## Purpose

Turn Issue ambiguity into an explicit decision register. `pm-triage` owns the
flow of questions, not the product, architecture, domain, implementation, or
release decisions themselves.

## Required inputs

Read these before triaging:

1. `AGENTS.md`.
2. `docs/agent-governance.md`.
3. The complete Issue body, labels, assignees, dependencies, and recent
   comments.
4. The current open-Issue dependency graph when the Issue is part of a larger
   workflow.

Do not infer an answer from a title or a partial Issue excerpt.

## Operating procedure

For each Issue:

1. Identify every explicit `Open Questions` item and any implicit decision that
   would prevent a reasonable implementer from starting.
2. Split compound questions into independent questions.
3. Classify each question as product, architecture, implementation, domain,
   quality, or process.
4. Assign exactly one Decision Owner role to each question. List other roles as
   consulted only.
5. Mark each question `blocking: yes` or `blocking: no`, with a reason.
6. Record dependencies and the evidence used for the classification.
7. Leave unresolved questions open. Never invent a decision to make an Issue
   appear ready.
8. Write a concise triage summary and recommend `ready to pickup` only when
   the readiness rule is satisfied.

## Decision-owner routing

| Question type | Decision Owner |
|---|---|
| Product scope, audience, priority, offer facts | `product-manager` |
| Architecture, interfaces, storage, orchestration policy | `architect` |
| Code-level implementation detail | `developer` |
| TPT listing, packaging, marketplace requirements | `tpt-expert` |
| Instagram/Facebook format and channel constraints | corresponding social expert |
| Test strategy, evidence, release quality | `quality-engineer` |
| Unowned or disputed decision | Human Accountable Owner |

If one question spans multiple categories, split it before assigning owners.

## Authority limits

`pm-triage` may classify, route, summarize, and follow up. It may answer only
process questions that are directly established by repository governance. It
must not:

- choose a product or architecture answer on behalf of another role;
- mark an Issue `status: ready to pickup` without Human Accountable Owner
  approval;
- close an Issue because its questions are inconvenient;
- silently convert a blocking question into a non-blocking one;
- assign a person when only a role is known;
- treat a consulted opinion as the authoritative decision.

## Required Issue output

Add or update the Issue using this structure:

```markdown
## PM Triage — YYYY-MM-DD

### Decision Register

| ID | Question | Type | Blocking | Decision Owner | Consulted | Status |
|---|---|---|---|---|---|---|
| Q1 | ... | architecture | yes | architect | developer | open |

### Triage Summary

- Blocking questions: <count>
- Non-blocking questions: <count>
- Dependencies: <issue links or `none identified`>
- Human review required: yes/no
- Ready to pickup: recommended/not recommended
- Reason: <evidence-backed explanation>
```

When a question is answered, preserve the question and add:

```markdown
### Decision Q1

- Conclusion: <authoritative answer>
- Evidence: <file, Issue, PR, test, or explicit product decision>
- Scope/dependency impact: <impact or none>
```

## Readiness rule

Recommend `status: ready to pickup` only if:

- the scope is understandable;
- acceptance criteria are testable;
- every open question has a recorded conclusion or is explicitly non-blocking;
- dependencies are identified and non-blocking; and
- Human Accountable Owner review is complete.

Otherwise recommend `blocked` or `needs clarification`, and name the exact
missing decision.

## Quality check

Before reporting triage complete, verify:

- every open question appears exactly once in the register;
- every question has exactly one Decision Owner;
- no answer was invented;
- blocking reasons are explicit;
- dependency direction is consistent across related Issues; and
- the Issue comment links to the tracked triage report when one exists.
