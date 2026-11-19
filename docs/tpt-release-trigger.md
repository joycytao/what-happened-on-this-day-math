# TPT release trigger

`.github/workflows/tpt-release-trigger.yml` is the idempotent entrypoint for the
monthly TPT workstream.

- A `workflow_run` starts only when the workflow named **Monthly package release**
  completes successfully.
- A manual dispatch accepts the same six source inputs as the reusable TPT
  workflow, including the thumbnail manifest for the released final PDF.
- The release-trigger path reads repository variables
  `TPT_RELEASE_MONTH`, `TPT_RELEASE_YEAR`, `TPT_PACKAGE_ID`,
  `TPT_RELEASE_MANIFEST_PATH`, `TPT_CONTENT_PATH`, and
  `TPT_THUMBNAIL_MANIFEST_PATH`.
- Both paths call the same reusable `tpt-workstream.yml`; there is no second
  implementation that can drift from the normal TPT gates.

If the release workflow name or any required repository variable is missing, the
reusable workflow's existing input/release validation fails closed and creates a
blocked QA record rather than generating a package from an inferred or stale
month.
