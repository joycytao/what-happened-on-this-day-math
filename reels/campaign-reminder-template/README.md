# Engineer Mom Worksheets — Reel Template

## Deliverables

This project contains two reusable campaign Reel designs. Each design supports two publication moments, so one campaign produces four publishable MP4s:

| Campaign | Start | Ending soon |
|---|---|---|
| Free Worksheets | `free-worksheets-start.mp4` | `free-worksheets-ending-soon.mp4` |
| Early-Bird Sale | `early-bird-sale-start.mp4` | `early-bird-sale-ending-soon.mp4` |

All outputs are 8-second vertical reels at 610 × 1086 (9:16), using a generated full-screen scene image and the supplied image as the circular profile image. The supplied screen recording is used only as a layout reference, not as a source background.

The reusable skill instructions live in:

- `skill/free-worksheets-campaign-reel/SKILL.md`
- `skill/early-bird-sale-reel/SKILL.md`

The ending-soon variant is published three days before the campaign ends. It is a separate publication item with distinct urgency copy, not an identical replay of the launch Reel.

## Template anatomy

- Muted, darkened work-desk background for an editorial/productivity feel.
- Split date marker at top left.
- Full-screen scene image with the source URL locally removed; `@engineermom.worksheets` appears inside the notification card.
- White rounded-corner notification card with a centered circular profile image.
- Dark navy typography, warm beige accent, and restrained white rules.
- Opening slide-in/fade animation during the first 0.6 seconds.
- Two-line title and two-line body copy so the card stays legible on a phone.
- Bottom source label and save/share prompt.

## Copy architecture

1. Hook: free November math resource and deadline.
2. Conversion: Early-Bird price, deadline, and link-in-bio CTA.

The copy is intentionally compressed from the supplied long-form descriptions. Full details belong in the Instagram caption or carousel, while the reel card acts as the stop-and-read hook.

## Rebuild

Run `./build_reels.sh` from this directory. The source paths are defined at the top of the script.

For the four campaign publication variants, run `./build_campaign_reels.sh`. The script accepts `FREE_START_DATE`, `FREE_ENDING_DATE`, `SALE_START_DATE`, `SALE_ENDING_DATE`, `FREE_DEADLINE`, `SALE_DEADLINE`, and `SALE_PRICE` as overrides. Ending-soon dates should be set to the campaign end date minus three days.
