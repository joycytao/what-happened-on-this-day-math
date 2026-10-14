# Reusable Reel Skills Verification

The reusable social system now follows the requested math repo structure:

- `skills/before-after-worksheet-reel/`
- `skills/perspective-sharing-reel/`
- `reels/before-after-worksheet-reel-template/`
- `reels/perspective-sharing-reel-template/`
- `reels/product-reel-template/`
- `reels/campaign-reminder-template/`

Carousel templates are under `social/`, and their skills are under `skills/`.

Both skills define their trigger, fixed narrative, dynamic manifest, privacy/readability rules, default music, caption output, and verification requirements. Each has three eval prompts.

The migrated template compositions and their current preview exports live under `reels/*-template/`. Root-level generator/build entry points live under `scripts/`. The perspective Carousel currently has a design contract but intentionally exits before rendering until authored slide content is supplied.
