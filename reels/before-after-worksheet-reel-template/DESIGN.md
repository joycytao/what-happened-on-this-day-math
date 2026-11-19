# Before–After Worksheet Reel Template

## Narrative

1. Right-originating hook message.
2. Right-originating AI prompt message.
3. Right-originating source worksheet upload message.
4. Source page 1 enlarges briefly, then returns to the thread.
5. Left-originating processing state.
6. Left-originating clean worksheet result.
7. Clean page 1 enlarges briefly.
8. Aligned before/after comparison.
9. CTA.

## Visual system

- Beige, brown, and white editorial chat interface.
- Rounded message cards without decorative speech tails.
- Conversation scrolls upward as messages accumulate.
- Source and clean page crops stay aligned.
- Only explicit sensitive regions are blurred; page 1 is the default.
- Do not display `HOOK`, `PROBLEM`, `SOLUTION`, `SOURCE PDF`, or `CLEAN PDF` labels.
- The processing state is a visual step; the Reel must not claim to execute OCR.

## Timing

Start from the current approximately 37.5-second sample. Extend timing for readability before shrinking long prompt copy.

## Source of truth

This directory is the migrated source of truth for the composition, assets, and HyperFrames configuration. The generator should reuse this composition system rather than create a second visual language.

## Build

From the math repo root:

```bash
node scripts/build-before-after-worksheet-reel.mjs
```

Pass an output path as the first argument when needed.
