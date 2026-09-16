# October 2026 Worksheet Release QA

- Status: **FAIL**
- Contract: 31 calendar days × day then reading-passage, level1, level2, level3 + 3 Answer Key pages = 127 pages.
- Actual PDF pages: 127.
- Daily pages: 124; Answer Key pages: 3.
- Answer Key order: level1, level2, level3.
- Template version: 1.0.0.
- Visual sample pages rasterized: 1, 2, 3, 4, 124, 125, 126, 127.
- Validation gates: content=true, mathematics=true, source=false, layout=true, PDF=true.
- Failure details: source: nps-edison-light source request failed: TypeError: fetch failed.

## Release decision

Release blocked: at least one independent gate failed; resolve the listed failure before release.
