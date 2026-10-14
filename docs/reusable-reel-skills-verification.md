# Reusable Reel Skills Verification

The reusable Reel system now follows the math repo structure:

- `skills/before-after-worksheet-reel/`
- `skills/perspective-sharing-reel/`
- `reels/before-after-worksheet-reel-template/`
- `reels/perspective-sharing-reel-template/`

Both skills define their trigger, fixed narrative, dynamic manifest, privacy/readability rules, default music, caption output, and verification requirements. Each has three eval prompts.

The migrated template compositions and their current preview exports live under `reels/*-template/`. Root-level build wrappers live under `scripts/`.
