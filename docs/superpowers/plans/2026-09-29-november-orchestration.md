# November orchestration implementation plan

## Goal

Make the month-only release entry point execute the completed November content,
worksheet, Answer Key, coversheet, and release-QA stages without confusing the
123-page source packet with the 124-page approved final packet.

## Acceptance mapping

1. Parse `--month 11` and `--template-version`; reject other months or versions.
2. Validate the existing content, mathematics, source, worksheet, Answer Key,
   and cover artifacts before any final PDF is written.
3. Require an explicitly approved cover and a passing cover visual-QA report;
   a draft or failed visual report must block release with actionable errors.
4. Merge exactly one cover page before the 123-page source packet, preserve the
   source PDF, and record page mappings and both page counts in a manifest.
5. Make reruns deterministic and reject an already cover-bearing source packet
   or stale manifest instead of inserting a duplicate cover.

## Verification

- Add unit tests for argument parsing, contract validation, mapping, approval and
  visual-QA gates, duplicate-cover rejection, and the final 124-page manifest.
- Run the focused tests, full `npm test`, and `git diff --check`.
- Run the command against the checked-in November artifacts and record that it
  blocks safely while the cover remains draft/visual-QA-failed.
