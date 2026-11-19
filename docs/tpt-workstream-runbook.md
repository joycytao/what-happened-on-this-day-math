# Monthly TPT workstream runbook

The TPT workflow is release-gated and review-gated. It consumes one released monthly manifest and one matching monthly content file; it never publishes to TPT automatically.

## Local fixture

Run the deterministic end-to-end fixture with:

```sh
node --test tests/tpt-workstream-e2e.test.mjs
```

The fixture proves a successful run, idempotent rerun, stale-release blocking, wrong-month blocking, and missing-asset blocking without private files or network access.

## Actions workflow

The reusable workflow is `.github/workflows/tpt-workstream.yml`. Required inputs are `month`, `year`, `package_id`, `manifest_path`, and `content_path`. The workflow:

1. checks out the released source and installs the locked dependencies;
2. validates the manifest and generates deterministic metadata, listing copy, public asset inventory, and `workstream.json`;
3. uploads the complete output directory and reports as a workflow artifact;
4. creates or updates exactly one monthly TPT Issue using the package marker;
5. writes a Project sync plan and, when configured, updates the matching Project item;
6. leaves the Issue in `QA` or `Blocked`, never `Published`.

## Recovery

- `Blocked` means inspect `output/tpt/<package-id>/workstream.json` and the failure reason before rerunning.
- A stale or wrong-month manifest must be regenerated from the release process; do not edit the manifest by hand to bypass the gate.
- A missing public asset must be restored through the release artifact pipeline, then rerun with the same package ID/version.
- Reruns use the package ID marker and deterministic idempotency key, so they update the existing TPT Issue and artifact set instead of creating duplicates.
- Human QA must confirm copy, source mapping, dimensions, public-answer-key policy, and final artifact completeness before any marketplace upload.
