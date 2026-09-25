# November PDF release QA

- Release status: PASS
- Coverage: 30 days × 4 daily pages + 3 Answer Key pages = 123 pages; the cover-bearing release contract is 124 pages (one cover + baseline). PDF contains 123 pages in the current pre-cover baseline.
- Cover gate: pending_issue_86; cover_pages: 0; current page 1 is the first daily Reading Passage. After Issue #86, rerun with exactly one worksheet coversheet at page 1 and shifted source mappings.
- Page order: daily pages are day-major (reading passage, Level 1, Level 2, Level 3), followed by Answer Key Levels 1–3.
- Page dimensions: daily SVG 1545×2000 px; Answer Key SVG 1545×1999 px; PDF dimensions are recorded in the machine-readable report.
- Content, mathematics, source, layout, and PDF gates: content: PASS, mathematics: PASS, source: PASS, layout: PASS, pdf: PASS.
- Visual samples: pages 1, 5, 60, 120, 121, 122, 123 rasterized to /var/folders/cd/mxdnrktd5rs268sx4xyp7bkm0000gn/T/november-release-qa-final; inspect these for margins, clipping, overflow, ordering, and legibility.
- Errors: none

This report is the current pre-cover November QA baseline. After Issue #86 adds the approved coversheet, rerun the same gate and require page-1 cover placement, shifted source mappings, and a 124-page total. Any failure is recorded with its date, page, field, artifact, cover status, and actionable reason in the JSON report.
