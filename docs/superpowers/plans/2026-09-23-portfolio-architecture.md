# Plan: Design the monthly product portfolio and bundle architecture

## Constraints

- Keep monthly products as independently releasable units.
- Do not change PDF templates or generated content.
- Keep identifiers stable as future months are added.
- Treat the worksheet coversheet PNG and worksheet-sized PDF/page-1 artifact as first-class monthly and bundle artifacts.

## Tasks

1. Add a failing contract test for the monthly/bundle hierarchy and October record.
2. Implement a machine-readable architecture, validator, CLI report, and English documentation.
3. Run focused and full verification, then open a PR with `Fixes #80`.
