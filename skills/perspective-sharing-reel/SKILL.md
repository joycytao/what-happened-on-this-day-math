---
name: perspective-sharing-reel
description: Use when creating or updating a vertical Instagram Reel that turns a parenting, homeschool, learning, or creator perspective into connected message cards over a warm lifestyle scene.
---

# Perspective-Sharing Reel

Read [`../../reels/perspective-sharing-reel-template/DESIGN.md`](../../reels/perspective-sharing-reel-template/DESIGN.md) and its `dynamic-schema.json` before building a new instance. Use the migrated composition in that template directory.

## Required sequence

Use five connected cards by default: hook → problem or tension → deeper perspective → practical shift → closing thought or soft CTA.

Cards push horizontally as connected thoughts while the background uses a slow, subtle scale-up. Do not use literal two-sided DM UI. Do not render `HOOK`, `PROBLEM`, `PERSPECTIVE`, `SOLUTION`, or `CTA` labels.

## Dynamic inputs and copy rules

Require the template manifest with account handle, profile image, background image, card copy, timing, audio, and caption. Use complete thoughts with enough words to make the perspective clear. If a card cannot be read comfortably, extend `cardDuration` rather than shrinking or deleting the copy. Keep the background subordinate to the cards.

## Audio and caption

When `musicFile` is null, use `Chilly Kitty - captain fluff [Thematic].mp3`. Keep the music credit in the manifest and caption. Replace the default only when the user explicitly requests different music.

Always produce `caption.md` with hook, perspective, practical takeaway, soft CTA, and music credit.

## Outputs and verification

Produce a 1080 × 1920 MP4, the used dynamic manifest, caption, music credit metadata, and verification report. Verify at least three cards, normally five, readable hold durations, quiet background, no structural labels, audio, and HyperFrames lint/layout output. Inspect a draft render before final render.

For the migrated sample composition, run `node scripts/build-perspective-sharing-reel.mjs` from the math repo root.
