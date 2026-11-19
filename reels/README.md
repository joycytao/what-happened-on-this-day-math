# Reel Templates

Reusable vertical Reel templates for the math repo.

## Shared contract

- Output: 1080 × 1920, 9:16 MP4.
- English copy by default.
- Every render produces an MP4, dynamic manifest, `caption.md`, music credit metadata when applicable, and a verification report.
- Current music remains the default unless the user explicitly requests a replacement.
- Before–After default: `cold winter breeze - dreamy study break [Thematic].mp3` plus soft notification chimes.
- Perspective default: `Chilly Kitty - captain fluff [Thematic].mp3`.
- Protect names, school information, student IDs, teacher information, and other sensitive data.

## Templates

- [`before-after-worksheet-reel-template`](before-after-worksheet-reel-template/DESIGN.md): AI prompt → source worksheet → cleanup → clean result → before/after → CTA.
- [`perspective-sharing-reel-template`](perspective-sharing-reel-template/DESIGN.md): warm lifestyle scene with connected message cards for a parenting or learning perspective.
- [`product-reel-template`](product-reel-template/DESIGN.md): four weekly product-evidence Reels for a verified monthly package.
- [`campaign-reminder-template`](campaign-reminder-template/DESIGN.md): launch and ending-soon variants for free and paid campaigns.

The corresponding triggering and production instructions live under [`../skills/`](../skills/).

Root-level build scripts:

- `node scripts/build-before-after-worksheet-reel.mjs`
- `node scripts/build-perspective-sharing-reel.mjs`
