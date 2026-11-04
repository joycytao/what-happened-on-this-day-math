# Monthly thumbnail package regeneration

Use one manifest-driven command to generate the five monthly thumbnails, QA
reports, handoff JSON, and deterministic TPT listing/metadata outputs:

```bash
npm run thumbnails:package -- \
  --manifest examples/november-thumbnail-manifest.json \
  --output-dir output/monthly-thumbnail-package
```

The manifest must provide the final PDF checksum and page count, the month
product fields, the month-specific doodle, and every declared source-page
mapping. The command fails before writing a package when the manifest or final
PDF is stale. `package-manifest.json` records sorted output paths, byte sizes,
and SHA-256 values so a second clean run can be compared byte-for-byte.

Publication remains pending human QA; generated assets are evidence for the
downstream visual-review handoff, not an automatic release approval.
