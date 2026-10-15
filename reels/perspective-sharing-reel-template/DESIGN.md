# Perspective-Sharing Reel Template

## Narrative

Use five connected cards by default:

1. Hook thought.
2. Problem or tension.
3. Deeper perspective.
4. Practical shift.
5. Closing thought or soft CTA.

## Visual system

- Warm lifestyle or homeschool scene as the background.
- Cream cards, cocoa typography, beige border, and quiet shadow.
- Cards push horizontally as connected thoughts.
- Background uses a slow, subtle scale-up.
- Cards are the primary reading surface and must remain readable on a phone.
- Do not use literal two-sided DM UI.
- Do not display `HOOK`, `PROBLEM`, `PERSPECTIVE`, `SOLUTION`, or `CTA` labels.
- Use complete thoughts; do not reduce every card to one slogan.

## Timing

Start from the current approximately 23-second / five-card sample. Extend `cardDuration` when a card contains more than one readable sentence.

## Source of truth

This directory is the migrated source of truth for the composition, assets, and renderer configuration. `design-tokens.json` is the shared layout contract consumed by the fallback renderer and injected into the HyperFrames renderer. Do not tune card coordinates, font sizes, CTA position, or transition timing in only one renderer.

Dynamic per Reel:

- `handle`, `studio`, `backgroundImage`, `musicFile`, and `musicCredit`.
- Card `headline`, `body`, optional `cta`, and card count.
- `cardDuration`, `targetDuration`, and `transitionDuration` when a Reel needs a deliberate timing change.

Static design contract:

- 1080×1920 canvas.
- Five-card clean message-card structure by default.
- Profile row, divider, rounded cream card, Georgia headline, Avenir Next body, dots, and final CTA pill.

## Build

From the math repo root:

```bash
node scripts/build-perspective-sharing-reel.mjs
```

Pass an output path as the first argument when needed.

The default build uses the repo's FFmpeg fallback so the sample can be rendered without a globally installed HyperFrames CLI. Pass `--hyperframes` after the input path when the HyperFrames CLI is available and the full composition renderer is desired.
