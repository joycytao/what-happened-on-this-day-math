# Monthly release manifest

The release manifest is the single machine-readable handoff contract for TPT
and social workstreams. It identifies one month/package, its source revision,
all required release artifacts, and the gates that prove the package is safe
to consume.

## Contract

- `schemaVersion` is `1.0.0`.
- `packageId`, `packageVersion`, `month`, `year`, and `sourceCommit` identify
  exactly one released monthly unit.
- `releaseStatus` must be `released` and `stale` must be `false`.
- Required artifact IDs are `finalPdf`, `coverPdfPage`, `pageMappings`,
  `thumbnails`, and `thumbnailQa`.
- Every artifact has a relative path, kind, lowercase SHA-256 checksum, and
  `required: true`. IDs and paths are unique.
- Required gates are `content`, `mathematics`, `source`, `layout`, `pdf`,
  `cover`, and `derivedAssets`; every gate must be `true`.

Run the validator with:

```bash
npm run release:manifest:validate
```

Use `--verify-files` to hash files under the repository root and detect a
changed final PDF or source asset before downstream generation:

```bash
npm run release:manifest:validate -- --verify-files
```

The validator writes `reports/monthly-release-manifest.json`. Any error exits
non-zero and downstream TPT/social consumers must stop. A changed artifact,
month mismatch, missing gate, or stale flag invalidates release eligibility;
the responsible artifact must be regenerated and the complete QA chain rerun.
