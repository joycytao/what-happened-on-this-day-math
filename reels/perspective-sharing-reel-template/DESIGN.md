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

This directory is the migrated source of truth for the composition, assets, and HyperFrames configuration. The generator should reuse that composition system rather than create a literal messaging-app clone.

## Build

From the math repo root:

```bash
node scripts/build-perspective-sharing-reel.mjs
```

Pass an output path as the first argument when needed.
