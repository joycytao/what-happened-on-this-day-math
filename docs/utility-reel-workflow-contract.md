# Utility Reel cycle contract

This workflow starts only from one explicitly supplied completed and graded
test. It creates a three-week hand-off contract: Recover, Understand, and
Practice. It does not discover files, overwrite the source, diagnose a child,
or publish automatically.

## Intake entry point and privacy contract

Submitters use the private GitHub Issue Form `.github/ISSUE_TEMPLATE/utility_reel_intake.yml`.
Only the owner may submit or view originals. The original attachment remains an
immutable intake reference and is not copied into the repository.

The approved consent wording is version `2026-10-06`:

> I confirm that I have permission to submit this student work for internal processing. I confirm that the submission contains no unnecessary names, faces, or private information. The original file may be reviewed internally, retained for up to 90 days, and deleted afterward. Only the approved clean copy may be used for downstream rendering or release.

The original and redaction report are retained for 90 days, then deleted. The
clean review copy is stored separately at
`output/utility/<cycleId>/clean-review-copy.pdf`; the redaction report is stored
at `reports/utility/<cycleId>/redaction-report.json`.

## Intake gate

The intake JSON must include:

- an absolute source-file path and SHA-256 checksum;
- an explicit permission confirmation;
- an explicit privacy-redaction confirmation and repository-relative report;
- a positive source page count;
- a separate repository-relative clean-review-copy output;
- one or more high-confidence categories from the supported error taxonomy.

Uncertain or unsupported categories are rejected. The original file remains an
immutable input reference and is never used as a writable output path.

## Generation

```bash
npm run social:utility-reels -- --input examples/utility-reel-intake.example.json
```

The deterministic output contains exactly three records in order. Week 1
preserves the printed source structure through a clean review copy. Week 2
reports only high-confidence categories. Week 3 requires new practice values
and contexts, plus independent math and layout QA. Every record is
`1080x1920`, silent-by-default, and human-review gated.

This contract is a safe orchestration layer. PDF cleaning, OCR, error analysis,
and video rendering must consume these records through their own validated
implementations; none is silently replaced by a guessed result here.
