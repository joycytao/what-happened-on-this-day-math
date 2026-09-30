# Reusable worksheet coversheet prompt

Use `references /worksheet-assets/worksheet-cover-reference.png` as the canonical visual reference. Generate a portrait printable educational worksheet coversheet for `[MONTH]`.

Preserve the reference layout: warm ivory background, thin rounded orange frame, deep navy bold uppercase month headline, smaller `MORNING WORK MATH` title, two centered supporting lines `DAILY WORD PROBLEMS` and `HISTORICAL MINI-STORIES`, one centered orange outline-only monthly illustration, `3 LEVELS` between short orange rules, and the official `6 pm studio` logo centered above long orange footer rules.

Fixed variables: page proportions, frame inset/radius/stroke, ivory/navy/orange palette, typography hierarchy, alignment, safe areas, whitespace, illustration scale range, level-rule geometry, logo placement, and footer-rule geometry. Allowed substitutions: `[MONTH]`, `[NUMBER OF DAYS]` in metadata only, and `[MONTHLY LINE-ART ILLUSTRATION]`. Do not add day-count copy to the visible cover unless the approved reference changes.

## Reusable monthly doodle prompt

Use this prompt for the centered monthly object illustration. Replace only `[MONTHLY OBJECT]`; keep the visual system fixed across the twelve-month series.

```text
Create one simple hand-drawn doodle illustration of [MONTHLY OBJECT].
The doodle should be a minimal, friendly, recognizable line drawing designed for a clean educational worksheet brand.

STYLE
- Simple hand-drawn outline
- Slightly imperfect organic strokes
- Playful but restrained
- Clean editorial classroom aesthetic
- Minimal detail
- No realistic shading
- No 3D effects
- No gradients
- No texture
- No background
- No text
- No letters or numbers
- No people
- No calendar icon

COLOR
- Use one solid orange line: #FF8A00
- Optional very small orange fill areas only if needed for recognition
- Do not use additional colors
- Keep the line weight visually consistent with the orange border in the reference design

COMPOSITION
- Show only one centered object
- Keep the object upright and easy to recognize
- Use a balanced silhouette with generous empty space around it
- Do not crop any part of the object
- Keep the design compact and suitable for placement in the center of a portrait worksheet cover
- Transparent background
- Export as a clean PNG with transparency

BRAND DIRECTION
The doodle should feel like a small seasonal accent within the 6pm Studio visual system: simple, warm, modern, spacious, and suitable for repeated use across a twelve-month worksheet series.

VARIABLE
Replace [MONTHLY OBJECT] with a month-related object, such as:
- pumpkin
- turkey
- snowflake
- mitten
- flower
- kite
- apple
- leaf
- sun
- beach ball
- pencil
- backpack

Do not add the month name or any written label.
```

### November usage: turkey

```text
Create one simple hand-drawn doodle illustration of a turkey.

Use a minimal orange outline in #FF8A00, with a slightly imperfect hand-drawn stroke. Show a friendly simplified turkey silhouette with only essential features: a fan tail with distinct feathers, a pear-shaped body, a round head, a small beak, a wattle, one eye, and two feet. Use no text, no background, no shadow, no gradient, no additional colors, and no realistic detail.

The turkey should be centered, compact, upright, friendly, and clearly recognizable. Use a transparent background and export as a clean PNG. The doodle must match a modern educational worksheet brand with generous whitespace and a simple editorial classroom aesthetic.
```

### Negative prompt

```text
photorealistic, realistic illustration, detailed cartoon, complex background, multiple objects, text, letters, numbers, calendar, people, full-color illustration, gradients, shadows, 3D render, watercolor, painted texture, cluttered composition, cropped object, asymmetrical framing, thick inconsistent lines, dark outline, black line art, decorative pattern
```

Negative prompt for the complete coversheet: no photographs, photorealism, 3D, gradients, shadows, filled artwork outside the optional tiny doodle recognition areas, decorative patterns, extra copy, extra icons, serif/script fonts, distorted letters, cropped borders, clipped logo, footer overlap, asymmetry, or month-specific redesign.

If visual QA fails, preserve the iteration prompt version and metrics, optimize this prompt or the compositor rule, regenerate, and rerun the complete QA suite until it passes.
