# Monthly product portfolio and bundle architecture

The product portfolio has two stable layers: a standalone monthly product and
one future full-year bundle. The monthly product remains the unit of
production, QA, listing preparation, and release. The bundle references
released monthly products; it does not duplicate or rename their files.

## Product hierarchy

```text
morning-work-math-year-bundle
├── morning-work-math-{year}-01
├── morning-work-math-{year}-02
├── ...
└── morning-work-math-{year}-12
```

Each monthly product includes the final PDF, worksheet coversheet PNG,
worksheet-sized PDF cover/page 1, answer keys, thumbnails, listing copy, and
release record. A month is bundle-complete only when its release status is
`released` and all of those artifacts have passed the applicable QA gates,
including cover approval/QA.

## Naming and identifiers

- Machine identifier: `morning-work-math-{year}-{month}`, with a two-digit
  month such as `morning-work-math-2026-10`.
- Display title: `{Month} Morning Work Math`, such as **October Morning Work
  Math**.
- Bundle identifier: `morning-work-math-year-bundle`.
- Release versions belong in the release record and do not replace the stable
  month identifier.
- Adding a new month appends a new identifier; it never restructures existing
  identifiers.

## Inclusion rules

The monthly unit groups these artifacts under one identifier:

1. the final monthly PDF;
2. the worksheet coversheet PNG and worksheet-sized PDF cover/page 1;
3. the separate Answer Key pages or source artifact;
4. derived thumbnails tied to the final PDF checksum;
5. TPT listing copy and metadata handoff;
6. the release record containing QA status, cover approval/QA status, and source references.

The bundle includes only monthly identifiers whose release record says
`released`. A failed or incomplete month remains outside the bundle until its
release gates pass.

## October reference product

October is represented as `morning-work-math-2026-10` with display title
**October Morning Work Math**. Its status can move through `planned`,
`in-progress`, `qa`, `released`, and `retired` without changing its identity.
The machine-readable record in
`examples/portfolio-architecture.example.json` is the reusable template for a
future month.

## Validation

Run `npm run portfolio:validate` to verify the hierarchy, identifiers, October
reference record, required artifacts, and future-month rules. This issue
changes a portfolio contract and documentation; it does not render or modify
a PDF, so the report records mathematics and layout as not applicable.
