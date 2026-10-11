---
name: early-bird-sale-reel
description: Use when creating, updating, or scheduling the Early-Bird Sale campaign Reel for a paid worksheet promotion, including the sale launch and the three-day ending reminder.
---

# Early-Bird Sale Campaign Reel

Create the reusable campaign Reel for an early-bird worksheet sale. The source design is the existing Early-Bird Sale Reel, but each campaign must produce two publishable variants.

## Required outputs

For one early-bird sale campaign, create exactly two MP4 files:

1. `early-bird-sale-start.mp4`
2. `early-bird-sale-ending-soon.mp4`

The Content Calendar therefore receives two publication rows from this skill.

## Dynamic inputs

Require these values:

- `campaignName`
- `saleStartDate`
- `saleEndDate`
- `publishStartDate` (normally the sale start date)
- `publishEndingSoonDate` (sale end date minus 3 days)
- `price`
- `sceneAssetPath`
- `avatarAssetPath`
- `linkCta`

The generator derives the visible date marker, trigger label, price copy, deadline copy, output filename, and caption metadata. Do not hardcode a month, price, or deadline in the reusable source.

## Fixed visual system

- 8 seconds, 30 fps, silent H.264 MP4.
- 610×1086 vertical canvas, 9:16.
- Darkened scene background with the cream notification card.
- Circular profile image centered near the top of the card.
- Navy typography, beige accent, cream card.
- Card enters during the first 0.6 seconds; use the existing slide-in/fade rhythm.
- Preserve the top date marker, account label, footer rule, and `SAVE + SHARE` treatment.

## Copy variants

`START` communicates that the sale is live:

- State the early-bird price.
- State the sale window.
- Use the link-in-bio CTA.

`ENDING_SOON` communicates urgency:

- State that early-bird pricing ends in 3 days.
- Keep the price and deadline visible.
- Use the same link-in-bio CTA.

Do not publish the exact same copy for both variants.

## Routing

Use this skill when the user mentions an early-bird sale, paid worksheet promotion, sale launch, sale deadline, or discounted worksheet resource. If the offer is free, use `free-worksheets-campaign-reel` instead.

## Verification

Before delivery, verify that both MP4s exist, are 610×1086, 30 fps, approximately 8 seconds, and contain no audio stream. Confirm that the two variants have different trigger copy, price, and dates.
