---
name: before-after-worksheet-reel
description: Use when creating or updating a vertical Instagram Reel that shows an AI-assisted worksheet cleanup from prompt and source page to clean printable result, including before/after comparison, CTA, music, and caption.
---

# Before–After Worksheet Reel

Read [`../../reels/before-after-worksheet-reel-template/DESIGN.md`](../../reels/before-after-worksheet-reel-template/DESIGN.md) and its `dynamic-schema.json` before building a new instance. Use the migrated composition in that template directory.

## Required sequence

Build: right hook → right AI prompt → right source upload → source page 1 full-screen → left processing state → left clean result → clean page 1 full-screen → aligned before/after → CTA.

The thread scrolls upward. Use rounded cards without speech tails. Do not render `HOOK`, `PROBLEM`, `SOLUTION`, `SOURCE PDF`, or `CLEAN PDF` labels. The clean-result message must enter from the left.

## Dynamic inputs and privacy

Require the template manifest with account handle, profile image, hook, AI prompt, source and clean files, page, blur regions, CTA, audio, and caption. Page defaults to `1`. If a supplied page visibly contains a name, school, student ID, teacher information, or other identifying data, require explicit blur regions. Blur only those regions; never blur the whole page by default.

Treat the AI prompt as display copy. Show processing as a visual step, but do not claim the Reel itself performs OCR or creates the PDF.

## Audio and caption

When `musicFile` is null, use `cold winter breeze - dreamy study break [Thematic].mp3` plus the existing soft notification chimes when `notificationSounds` is true. Keep the music credit in the manifest and caption. Replace the default only when the user explicitly requests different music.

Always produce `caption.md` with hook, process/result context, CTA, and music credit.

## Outputs and verification

Produce a 1080 × 1920 MP4, the used dynamic manifest, caption, music credit metadata, and verification report. Verify readable prompt timing, page-1 selection, name-only redaction where applicable, aligned comparison, left-side clean result, CTA, audio, and HyperFrames lint/layout output. Inspect a draft render before final render.

For the migrated sample composition, run `node scripts/build-before-after-worksheet-reel.mjs` from the math repo root.
