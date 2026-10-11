---
name: free-worksheets-campaign-reel
description: Use when creating, updating, or scheduling the Free Worksheets campaign Reel for a free worksheet promotion, including the promotion launch and the three-day ending reminder.
---

# Free Worksheets Campaign Reel

Create the reusable campaign Reel for a free worksheet promotion. The source design is the existing Free November Worksheets Reel, but each campaign must produce two publishable variants.

## Required outputs

For one free-worksheet campaign, create exactly two MP4 files:

1. `free-worksheets-start.mp4`
2. `free-worksheets-ending-soon.mp4`

The Content Calendar therefore receives two publication rows from this skill.

## Dynamic inputs

Require these values:

- `campaignName`
- `promotionStartDate`
- `promotionEndDate`
- `publishStartDate` (normally the promotion start date)
- `publishEndingSoonDate` (promotion end date minus 3 days)
- `sceneAssetPath`
- `avatarAssetPath`
- `linkCta`

The generator derives the visible date marker, trigger label, deadline copy, output filename, and caption metadata. Do not hardcode a month, deadline, or date marker in the reusable source.

## Fixed visual system

- 8 seconds, 30 fps, silent H.264 MP4.
- 610×1086 vertical canvas, 9:16.
- Darkened scene background with the cream notification card.
- Circular profile image centered near the top of the card.
- Navy typography, beige accent, cream card.
- Card enters during the first 0.6 seconds; use the existing slide-in/fade rhythm.
- Preserve the top date marker, account label, footer rule, and `SAVE + SHARE` treatment.

## Copy variants

`START` communicates availability:

- Free worksheets are here.
- Include the actual promotion window.
- Use the link-in-bio CTA.

`ENDING_SOON` communicates urgency:

- State that the free promotion ends in 3 days.
- Keep the deadline visible.
- Use the same link-in-bio CTA.

Do not publish the exact same copy for both variants.

## Routing

Use this skill when the user mentions free worksheets, free monthly worksheets, a free download, or the launch/end of a free worksheet promotion. If the request is for a paid early-bird campaign, use `early-bird-sale-reel` instead.

## Verification

Before delivery, verify that both MP4s exist, are 610×1086, 30 fps, approximately 8 seconds, and contain no audio stream. Confirm that the two variants have different trigger copy and dates.
