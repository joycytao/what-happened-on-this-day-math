# Issue triage runbook

## Safety boundary

Inventory is read-only. A failed GitHub runner read is a failure, never an
empty inventory. Do not close, relabel, or delete anything until the inventory
and disposition file are available and the owner has reviewed each entry.
Historical closed Issues remain evidence. Blocked dependencies are never
downgraded to backlog. Age alone is not a disposition reason.

## 1. Collect evidence

```sh
npm run github:issues:inventory -- \
  --owner joycytao \
  --repo what-happened-on-this-day-math \
  --output reports/issue-triage-inventory.json
```

The command uses `scripts/github-app-command.mjs`, which performs the
repository's GitHub App connectivity check and writes retry evidence to
`reports/github-app-connectivity.json`. The inventory includes Issue state,
labels, stable body markers, linked PR references, update time, and Project
membership when the API returns it.

## 2. Review dispositions

Use `classifyIssue` from `src/issue-triage.mjs` to produce a disposition file.
Allowed outcomes are `close_duplicate`, `backlog`, `blocked`,
`preserve_closed`, and `review_required`.

Owner review must confirm the evidence and replacement Issue for every
`close_duplicate`, and explicitly approve every `backlog`. `blocked`,
`preserve_closed`, and `review_required` remain untouched.

## 3. Apply only approved changes

After approval, run:

```sh
node scripts/apply-issue-triage.mjs \
  --owner joycytao \
  --repo what-happened-on-this-day-math \
  --disposition reports/issue-triage-disposition.json \
  --confirm
```

The command comments and closes duplicates as `not planned`, adds only the
`backlog` label for approved backlog entries, skips preserved entries, and
stops before the next mutation if the GitHub runner fails. Reruns are
idempotent for already-closed or already-backlogged Issues.

## Current run

The initial run on 2026-10-27 stopped before inventory because the runner
returned `network: fetch failed` after three attempts. See
[`reports/issue-triage-2026-10-27.json`](../reports/issue-triage-2026-10-27.json)
and [`reports/github-app-connectivity.json`](../reports/github-app-connectivity.json).
No disposition review or GitHub mutation occurred.
