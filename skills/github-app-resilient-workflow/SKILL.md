---
name: github-app-resilient-workflow
description: Use when GitHub App-backed CLI calls fail with `fetch failed`, DNS errors, timeouts, rate limits, or ambiguous authentication/network errors.
---

# GitHub App Resilient Workflow

## Contract

Every GitHub CLI operation uses the shared App wrapper through:

```bash
node scripts/github-app-command.mjs -- gh <args...>
```

The runner performs a read-only `/rate_limit` preflight, retries only network/transient failures with a bounded 3-attempt backoff, and writes `reports/github-app-connectivity.json`. It never prints or stores tokens or private keys.

## Required decisions

- `network`: retry on the same run, then defer to the next heartbeat with the report path and exact error.
- `transient`: retry boundedly; do not mutate GitHub until the command succeeds.
- `authentication`: stop immediately and report configuration/HTTP evidence; never use a personal token.
- `fatal`: stop and report the command and error.

Do not convert a missing response into “no comments,” “no open PRs,” or “no eligible work.” A GitHub read is successful only when the runner exits zero and the requested JSON is available.

## Review-gate use

Before issue pickup, run the runner for PR list, complete PR metadata/comments/reviews/checks, and issue dependency data. If any required read fails, preserve the current issue state, record the blocker, and do not pick up new work. Retry at the next heartbeat; after repeated network failures, investigate DNS/proxy access to `api.github.com` rather than adding more unbounded retries.

## Verification

Run `node --test tests/github-app-resilience.test.mjs` and inspect `reports/github-app-connectivity.json`. A passing content/layout test does not prove GitHub connectivity, and a successful preflight does not prove a write succeeded; verify each command independently.
