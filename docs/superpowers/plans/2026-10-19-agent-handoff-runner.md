# Agent Handoff Runner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an auditable GitHub handoff protocol and a Codex pickup interface that lets role agents move work to one another without an LLM API token in GitHub Actions.

**Architecture:** GitHub Issues and PRs remain the shared state store. Pure Node modules validate and render handoff records; GitHub Actions route valid records and maintain derived labels. A Codex heartbeat uses the repository GitHub runner to list and claim one eligible handoff, then executes the selected role in a fresh worktree and writes the result back; no GitHub Action invokes a model.

**Tech Stack:** Node.js ESM, Node built-in test runner, GitHub Actions with `actions/github-script@v7`, existing `scripts/github-app-command.mjs` connectivity wrapper, Markdown handoff comments, YAML workflow files.

**Spec:** `docs/superpowers/specs/2026-10-19-agent-handoff-runner-design.md`

## Global Constraints

- GitHub Actions will not call an LLM or pretend to be an agent runner.
- The system will not store an OpenAI, Anthropic, or other model API token.
- Only the Human Accountable Owner may approve `status: ready to pickup`.
- One open question has exactly one Decision Owner.
- The Codex pickup loop claims at most one work item per cycle.
- A failed GitHub read must never be interpreted as an empty queue.
- Decision agents must not change readiness labels or merge PRs.
- Implementation work starts from the latest remote `main` in an isolated worktree.

## Review Focus

- Malformed or duplicate handoff comments must be rejected or ignored idempotently — covered by Task 1 parser tests.
- A Decision Owner must not route an Issue directly to developer before human readiness approval — covered by Task 2 routing tests.
- Stale or conflicting role/state labels must not create two active claims — covered by Task 3 pickup tests.
- GitHub connectivity failure must stop pickup instead of returning an empty queue — covered by Task 3 runner tests.
- QA failure must return to the developer with evidence rather than silently advancing — covered by Task 4 PR-routing tests.

### Task 1: Implement the versioned handoff contract

**Files:**
- Create: `src/agent-handoff.mjs`
- Create: `tests/agent-handoff.test.mjs`
- Create: `scripts/validate-agent-handoff.mjs`
- Modify: `package.json` (add `agent:handoff:validate`)

**Interfaces:**
- Consumes: Markdown containing `<!-- CODEX_HANDOFF:v1 -->` and the required handoff fields.
- Produces: `parseHandoff(markdown) -> { valid: boolean, errors: string[], handoff?: Handoff }`, `validateHandoff(handoff) -> { valid: boolean, errors: string[] }`, and `renderHandoff(handoff) -> string`.
- `Handoff` fields: `handoffId`, `from`, `to`, `workItem`, `status`, `completed[]`, `requiredNextAction[]`, `evidence[]`, `constraints[]`, `blockers[]`, `expectedOutput[]`.

- [ ] **Step 1: Write failing parser and validation tests**
  - Assert a complete v1 comment parses into the exact normalized object.
  - Assert missing marker, missing role, invalid role, invalid status, malformed work item, and empty next action each return named errors.
  - Assert duplicate handoff IDs are detectable by `findDuplicateHandoffIds` or the CLI input contract.

- [ ] **Step 2: Run the focused tests and verify failure**

  Run: `node --test tests/agent-handoff.test.mjs`
  Expected: FAIL because the parser and validator do not exist.

- [ ] **Step 3: Implement the pure parser and renderer**
  - Allow only the six role names from the spec.
  - Allow only `requested`, `accepted`, `completed`, `blocked`, and `rejected` statuses.
  - Keep comments as the audit record; do not infer a decision from labels.
  - Render a stable field order so repeated handoffs are diffable.

- [ ] **Step 4: Implement the validation CLI**
  - Accept `--file <path>` and `--stdin`.
  - Exit `0` only for a valid single handoff; exit `1` with named errors otherwise.

- [ ] **Step 5: Run focused tests and CLI checks**

  Run: `node --test tests/agent-handoff.test.mjs` and `printf '%s' '<valid fixture>' | node scripts/validate-agent-handoff.mjs --stdin`
  Expected: all tests pass and the CLI exits `0` for the valid fixture.

- [ ] **Step 6: Commit**

  ```bash
  git add src/agent-handoff.mjs tests/agent-handoff.test.mjs scripts/validate-agent-handoff.mjs package.json
  git commit -m "feat: add versioned agent handoff contract"
  ```

### Task 2: Add role/state labels and deterministic handoff routing

**Files:**
- Create: `.github/workflows/handoff-router.yml`
- Create: `src/agent-handoff-routing.mjs`
- Create: `tests/agent-handoff-routing.test.mjs`
- Modify: `.github/labels.yml`
- Modify: `.github/workflows/sync-labels.yml`
- Modify: `AGENTS.md`
- Modify: `docs/agent-governance.md`

**Interfaces:**
- Consumes: normalized `Handoff` from Task 1 and an Issue/PR snapshot containing labels and comments.
- Produces: `routeHandoff(handoff, context) -> { valid, errors, addLabels[], removeLabels[], nextRole, nextState, shouldComment }`.

- [ ] **Step 1: Write routing tests**
  - Assert `architect` completed → `pm-triage` decision-complete.
  - Assert human-approved `status: ready to pickup` → `developer` implementation.
  - Assert developer completed PR → `quality-engineer` QA.
  - Assert QA failure → `developer` changes-requested.
  - Assert decision agents cannot produce a developer route without the existing human readiness label.
  - Assert duplicate handoff IDs produce no new routing action.

- [ ] **Step 2: Run focused tests and verify failure**

  Run: `node --test tests/agent-handoff-routing.test.mjs`
  Expected: FAIL because routing rules do not exist.

- [ ] **Step 3: Implement pure routing rules**
  - Treat comments as authoritative audit records and labels as derived indexes.
  - Never add `status: ready to pickup` from an agent handoff.
  - Return explicit `blocked` routing for missing prerequisites.

- [ ] **Step 4: Add GitHub workflow adapter**
  - Trigger on `issue_comment: created`, `issues: labeled`, `pull_request: opened`, and `pull_request_review: submitted`.
  - Use least-privilege `issues`, `pull-requests`, and `contents: read` permissions.
  - Ignore comments without the exact `CODEX_HANDOFF:v1` marker.
  - Use the handoff ID to make repeated events idempotent.
  - Add the role/state labels declared by the pure router and emit one routing comment when the transition is new.

- [ ] **Step 5: Synchronize labels and document the protocol**
  - Add all `agent:*` and `state:*` labels to both label manifests.
  - Document that `state: ready-to-pickup` is not the human approval label.
  - Document the event-to-route table and the no-token boundary in `AGENTS.md` and governance docs.

- [ ] **Step 6: Validate workflow and tests**

  Run: `node --test tests/agent-handoff-routing.test.mjs`, `git diff --check`, and a YAML parse check for every changed workflow.
  Expected: tests pass, no whitespace errors, and all changed workflows parse.

- [ ] **Step 7: Commit**

  ```bash
  git add .github/workflows/handoff-router.yml .github/labels.yml .github/workflows/sync-labels.yml src/agent-handoff-routing.mjs tests/agent-handoff-routing.test.mjs AGENTS.md docs/agent-governance.md
  git commit -m "feat: route agent handoffs through GitHub state"
  ```

### Task 3: Build the Codex pickup queue and claim interface

**Files:**
- Create: `src/agent-pickup.mjs`
- Create: `scripts/agent-pickup.mjs`
- Create: `tests/agent-pickup.test.mjs`
- Create: `docs/agent-runner.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: Issue/PR JSON retrieved through `node scripts/github-app-command.mjs -- gh ...` and the role/state labels from Task 2.
- Produces: `listEligibleWork(items, options) -> { valid, items[], blockers[] }`, `buildClaimHandoff(item, role) -> Handoff`, and CLI modes `list`, `claim`, `release`.

- [ ] **Step 1: Write queue and claim tests**
  - Assert oldest eligible work is selected by creation time.
  - Exclude blocked, paused, already claimed, and unapproved Issues.
  - Assert a role mismatch is excluded.
  - Assert connectivity failure returns a blocker and never an empty eligible list.
  - Assert one cycle can claim only one item.

- [ ] **Step 2: Run focused tests and verify failure**

  Run: `node --test tests/agent-pickup.test.mjs`
  Expected: FAIL because queue selection and claim construction do not exist.

- [ ] **Step 3: Implement pure queue selection and claim construction**
  - Use the existing `status: ready to pickup` label as the developer gate.
  - Require a role/state handoff for decision and QA roles.
  - Use a deterministic claim marker and handoff ID.

- [ ] **Step 4: Implement the CLI using the repository GitHub runner**
  - `node scripts/agent-pickup.mjs list --role developer [--dry-run]` lists one eligible item or an explicit no-work/blocker result.
  - `... claim --role <role> --issue <number>` writes the accepted handoff and labels through the repository runner.
  - `... release --issue <number> --handoff-id <id> --status blocked|rejected` writes the terminal handoff without silently releasing stale claims.
  - Never call `gh` directly; invoke the existing `github-app-command.mjs` wrapper.

- [ ] **Step 5: Document the Codex heartbeat runner**
  - Specify quiet behavior when no work is available.
  - Specify one-claim-per-cycle behavior, fresh worktree creation from remote `main`, required role skill reads, and result handoff requirements.
  - Specify retry/no-claim behavior when GitHub connectivity is invalid.

- [ ] **Step 6: Run focused tests and dry-run pickup**

  Run: `node --test tests/agent-pickup.test.mjs` and `node scripts/agent-pickup.mjs list --role developer --dry-run`.
  Expected: tests pass; dry-run reports the current queue without writing labels or comments.

- [ ] **Step 7: Commit**

  ```bash
  git add src/agent-pickup.mjs scripts/agent-pickup.mjs tests/agent-pickup.test.mjs docs/agent-runner.md AGENTS.md
  git commit -m "feat: add Codex pickup queue interface"
  ```

### Task 4: Add PR and QA handoff routing

**Files:**
- Create: `.github/workflows/pr-handoff.yml`
- Create: `tests/pr-handoff-contract.test.mjs`
- Modify: `docs/agent-runner.md`

**Interfaces:**
- Consumes: opened/synchronized PR metadata, changed file paths, review events, and Task 1 handoff contract.
- Produces: QA handoff for implementation PRs, specialist review handoff when contract-owned paths change, and developer return handoff on QA failure.

- [ ] **Step 1: Write contract tests**
  - A PR opened from a `developer` handoff routes to `quality-engineer`.
  - Changes to governance/schema/orchestration paths add `architect` consultation.
  - Changes to social template/format paths add `social-expert` consultation.
  - A failed QA review routes back to `developer` with the review evidence.
  - A passing QA result routes to human maintainer review and does not merge automatically.

- [ ] **Step 2: Implement the PR workflow**
  - Use explicit marker comments and idempotent handoff IDs.
  - Preserve `status: blocked` and dependency behavior.
  - Do not create a second PR or invoke an LLM.

- [ ] **Step 3: Run workflow contract tests and YAML validation**

  Run: `node --test tests/pr-handoff-contract.test.mjs` and the repository workflow validation command available in the worktree.
  Expected: all tests pass and the workflow parses.

- [ ] **Step 4: Commit**

  ```bash
  git add .github/workflows/pr-handoff.yml tests/pr-handoff-contract.test.mjs docs/agent-runner.md
  git commit -m "feat: route implementation PRs to QA"
  ```

### Task 5: Add dry-run integration fixtures and operational documentation

**Files:**
- Create: `tests/fixtures/agent-handoff-issues.json`
- Create: `tests/agent-workflow-integration.test.mjs`
- Modify: `docs/agent-governance.md`
- Modify: `.github/README.md`
- Modify: `docs/agent-runner.md`

**Interfaces:**
- Consumes: fixture Issues/PRs and the pure modules from Tasks 1–4.
- Produces: an offline proof of the complete route `pm-triage → decision owner → developer → quality-engineer → human merge`.

- [ ] **Step 1: Write fixture-driven integration tests**
  - Start with a decision request and assert the exact next role.
  - Complete the decision and assert the developer route is still withheld until human readiness approval.
  - Add human readiness and assert developer pickup.
  - Complete implementation and assert QA pickup.
  - Fail QA and assert developer return.
  - Pass QA and assert human merge gate.

- [ ] **Step 2: Implement fixture harness and documentation**
  - Keep the fixture offline and token-free.
  - Document recovery from blocked handoffs, duplicate events, stale claims, and connectivity failure.

- [ ] **Step 3: Run full verification**

  Run: `npm test`, `node --test tests/agent-handoff.test.mjs tests/agent-handoff-routing.test.mjs tests/agent-pickup.test.mjs tests/pr-handoff-contract.test.mjs tests/agent-workflow-integration.test.mjs`, `git diff --check`, and workflow YAML parsing.
  Expected: all tests pass; no workflow syntax or whitespace errors.

- [ ] **Step 4: Commit**

  ```bash
  git add tests/fixtures/agent-handoff-issues.json tests/agent-workflow-integration.test.mjs docs/agent-governance.md .github/README.md docs/agent-runner.md
  git commit -m "test: verify end-to-end agent handoffs"
  ```

## Execution order

Execute Tasks 1–5 sequentially. Each task has a focused test cycle and commit.
Do not enable write-mode Codex pickup automation until Tasks 1–5 pass and a
dry-run confirms the current queue is interpreted correctly.
