# TPT visual asset handoff

The monthly TPT workflow writes the generated visual package to
`output/tpt/<package-id>/visual-assets/`.

The authoritative consumer contract is `landing-page-handoff.json`. It records the
released final PDF checksum, month-specific doodle checksum, source-page mappings,
all five 1260x1260 PNGs, and `landingPageImage`. The landing page should use the
asset identified by `landingPageImage` rather than guessing a filename.

The handoff also contains `landingPage` metadata: `monthSlug`, display `title`,
card `description`, and the deterministic redirect URL
`https://6pm-studio.com/go/<monthSlug>`. The TPT workstream commits the generated
visual-assets directory to `main` before dispatching the downstream landing-page
workflow, so the consumer reads an immutable repository revision.

Generation is fail-closed: a missing manifest, stale final PDF, missing doodle,
missing source page, wrong dimensions, or failed structural visual QA stops the TPT
workstream before downstream packaging.

Visual QA intentionally separates invariant geometry from month-variable copy,
worksheet content, and doodle artwork. The generated report records fixed-region
structural SSIM evidence; exact month/day copy, source checksums, dimensions, and
asset completeness are checked independently.
