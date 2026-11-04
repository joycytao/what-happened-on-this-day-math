# Social Project and Issue Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate Social Production from Math Production and create eight template-specific Issue Forms that require usable asset resources before pickup.

**Architecture:** Reuse the existing social orchestration planner and dependency markers, but route monthly social Issues to configurable Social Project settings. Add one issue form per current Reel/Carousel template with shared required fields and conditional asset-usage notes.

**Tech Stack:** GitHub Issue Forms YAML, GitHub Actions, Node.js 22, GitHub GraphQL, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-27-monthly-production-and-social-board-design.md`

## Global Constraints

- Social Issues reference a released `package_id`.
- Every form requires month/cycle, asset resources, template-specific inputs, expected output, and CTA/destination.
- `Asset usage notes` is conditional for external, student, customer, or third-party assets.
- No Excel workflow is introduced.
- No social asset is published automatically.

## Review Focus

- Empty or placeholder asset resources: remain blocked and not pickup-ready.
- Template drift: form key must match a registered repository template.
- Missing package release: social Issue remains blocked.
- Project routing: social items never silently land in Math Production.
- Sensitive asset declaration: conditional notes appear when the form selects external or personal material.

### Task 1: Define the social template registry

**Files:**
- Create: `src/social-template-registry.mjs`
- Create: `examples/social-template-registry.example.json`
- Create: `tests/social-template-registry.test.mjs`

**Interfaces:**
- `listSocialTemplates() -> Template[]`.
- `validateSocialIntake(input) -> { valid, errors }`.
- Template keys must map to the four Reel and four Carousel directories documented in the repo.

- [ ] Write tests for all eight templates and unknown-template rejection.
- [ ] Implement the registry from repository paths, not duplicated free-text names.
- [ ] Run focused tests.
- [ ] Commit `feat: register social production templates`.

### Task 2: Create eight Issue Forms

**Files:**
- Create: `.github/ISSUE_TEMPLATE/social-before-after-reel.yml`
- Create: `.github/ISSUE_TEMPLATE/social-perspective-sharing-reel.yml`
- Create: `.github/ISSUE_TEMPLATE/social-product-reel.yml`
- Create: `.github/ISSUE_TEMPLATE/social-campaign-reminder-reel.yml`
- Create: `.github/ISSUE_TEMPLATE/social-learning-system-carousel.yml`
- Create: `.github/ISSUE_TEMPLATE/social-clean-worksheet-carousel.yml`
- Create: `.github/ISSUE_TEMPLATE/social-perspective-carousel.yml`
- Create: `.github/ISSUE_TEMPLATE/social-product-carousel.yml`
- Create: `tests/social-issue-forms.test.mjs`

- [ ] Test each YAML contains required month/cycle, asset resources, expected output, CTA/destination, and template-specific fields.
- [ ] Add conditional asset-usage notes for external/student/customer/third-party assets.
- [ ] Add labels for `social:product-reel` or `social:carousel`, `content:monthly`, and review/pickup state.
- [ ] Run YAML/schema checks and focused tests.
- [ ] Commit `feat: add social template issue forms`.

### Task 3: Route social queues to the Social Project

**Files:**
- Modify: `.github/workflows/social-monthly-queue.yml`
- Modify: `.github/workflows/social-utility-queue.yml`
- Modify: `.github/workflows/product-confirmed-reel-handoff.yml`
- Modify: `.github/workflows/product-confirmed-carousel-handoff.yml`
- Modify: `docs/social-orchestration.md`
- Create: `tests/social-project-routing.test.mjs`

- [ ] Test that project owner/number come from `SOCIAL_PROJECT_OWNER` and `SOCIAL_PROJECT_NUMBER` or dispatch inputs.
- [ ] Test that existing social dependency behavior remains unchanged.
- [ ] Implement routing without mutating the Project Status field or inventing option IDs.
- [ ] Run existing social orchestration tests plus the new routing test.
- [ ] Commit `feat: route social work to dedicated project`.

### Task 4: Validate asset readiness

**Files:**
- Modify: `src/social-orchestration.mjs`
- Modify: `scripts/build-social-issue-plan.mjs`
- Create: `tests/social-asset-readiness.test.mjs`

- [ ] Test missing, placeholder, and valid asset-resource declarations.
- [ ] Keep incomplete Issues blocked; allow pickup only after required resources and inputs are complete.
- [ ] Preserve existing idempotency markers and package references.
- [ ] Run all social tests.
- [ ] Commit `feat: gate social pickup on asset readiness`.
