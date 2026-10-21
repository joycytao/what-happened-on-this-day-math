# Codex pickup runner

The pickup runner is a model-execution loop, not a GitHub Action. GitHub
remains the shared state store; the repository's `scripts/github-app-command.mjs`
is the only permitted GitHub command boundary.

## Cycle contract

1. A Codex heartbeat reads the current role and invokes
   `node scripts/agent-pickup.mjs list --role <role>`.
2. If the result is invalid or contains a connectivity blocker, it makes no
   claim and retries on the next cycle. If the result has no work, it stays
   quiet.
3. It claims at most one item with `claim --role <role> --issue <number>`.
4. It creates a dedicated worktree from the latest remote `main`, reads the
   role skill and issue evidence, then performs only that role's responsibility.
5. It writes one `CODEX_HANDOFF:v1` comment with completed work, evidence,
   constraints, blockers, and the required next action. The GitHub router then
   applies the next role/state labels.

Claims are deterministic and idempotent. A stale claim is never silently
released; use `release --issue <number> --handoff-id <id> --status blocked|rejected`
after verifying the existing claim. The existing `status: ready to pickup`
label remains a human approval gate and is never added by an agent.

Implementation PRs are routed by `.github/workflows/pr-handoff.yml`. A
developer PR creates one QA handoff. Governance/schema/orchestration changes
request architect consultation, and social-format changes request
social-expert consultation. QA rejection returns the PR to developer with the
review URL as evidence; QA completion creates a human-review handoff and never
merges automatically.

## Quiet heartbeat behavior

The heartbeat reports only a meaningful claim, completion, blocker, failed
connectivity check, or required human action. Repeated no-work results and
unchanged queue state produce no notification.

The recovery policy is intentionally conservative: blocked work returns to
`pm-triage`, duplicate handoff IDs are ignored, stale claims require explicit
verification before release, and connectivity errors stop the cycle without a
claim. The complete token-free route is covered by the offline fixture test.

## Supported commands

```text
node scripts/agent-pickup.mjs list --role developer --dry-run
node scripts/agent-pickup.mjs claim --role developer --issue 203
node scripts/agent-pickup.mjs release --issue 203 --handoff-id <id> --status blocked
```
