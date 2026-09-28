# October Social Generation Prompts

Reusable prompts reverse-engineered from the approved October social assets:

- Reel 1: differentiated morning work
- Reel 2: homeschool routine
- Carousel: product structure explained across five slides

The prompts separate visual generation, motion/editing, and post-production text. Do not ask an image model to render worksheet copy or logos accurately. Use the real worksheet pages and supplied product-cover image as composited assets, then add text and logo overlays in a design or video editor.

## Shared creative system

Product message: October Morning Work combines one short historical reading passage with daily math word problems in three differentiated levels. The levels share the same story/topic but provide different mathematical support.

Audience:

- Homeschool parents who need one routine for learners working at different levels.
- Elementary teachers who need differentiated independent morning work.

Visual system:

- Canvas: `1080 × 1920` for Reels; `1080 × 1350` for carousel.
- Background: `#FFF2DF`.
- Primary text: `#2A313D`.
- Accent: `#FF8A00`.
- Typography: Anton, Bebas Neue Bold, League Spartan Bold, Arial Black, or Montserrat ExtraBold.
- Layout: bold centered hierarchy, generous safe margins, no text touching the edges.
- Tone: warm, clear, practical, confident, educational.
- Do not create readable worksheet text with an image model. Use supplied SVG/PNG worksheet pages for all worksheet details.

Source worksheet assets live in `reports/october-worksheet-pages/`, including `01-reading-passage.svg`, `01-level1.svg`, `01-level2.svg`, `01-level3.svg`, and date-specific reading pages such as `08-reading-passage.svg`, `15-reading-passage.svg`, and `22-reading-passage.svg`.

The product-cover visual is the supplied original TPT cover image. The family scene is an AI-generated visual reference, not a documentary photograph.

---

## Reel 1 — differentiated morning work

### Generation prompt for supporting stills

```text
Create clean editorial education-product visuals for a vertical Instagram Reel about October Morning Work. Use a warm cream background (#FFF2DF), dark navy (#2A313D), and bright orange (#FF8A00). The visual system should feel bold, practical, modern, and teacher-friendly, with strong centered composition and generous safe margins.

Use supplied real worksheet pages as composited source assets. Preserve their page proportions and do not redraw, rewrite, hallucinate, or sharpen worksheet text. Show the pages as real printed pages with subtle paper shadows. Do not generate a fake logo; reserve space for the supplied 6PM logo.

Create four visual states: an opening hook frame; a centered casual stack of October 1, October 8, October 15, and October 22 reading-passage pages; three separate full-height worksheet frames for Level 1, Level 2, and Level 3; and a clean product-cover CTA frame using the supplied original October Morning Work image. The date-page stack may overlap and rotate slightly, but no page may be cut off by the 1080 x 1920 frame. Do not show the three levels as tiny thumbnails.
```

### Motion / editing prompt

```text
Edit a 10-second silent Instagram Reel in 1080 x 1920, 30 fps, with fast but calm editorial pacing and simple horizontal swipe transitions.

0.00–2.00: cream background, centered bold text “DIFFERENT LEARNERS.” then “ONE STORY. THREE LEVELS.”
2.00–4.00: center the reading-passage stack and reveal October 1, then October 8, then October 15, then October 22. Use a casual overlapping stack while keeping the entire stack inside the frame. Add “A STORY FOR EVERY DAY.”
4.00–7.00: show Level 1, Level 2, and Level 3 one at a time with a horizontal swipe. Keep each page large enough to recognize and label the current level.
7.00–8.00: cream background with centered text “SAME STORY.” followed by “DIFFERENT MATH SUPPORT.”
8.00–10.00: center the supplied October product-cover image. Add centered CTA text “FIND IT ON TPT.” and “LINK IN BIO.”

Use only subtle scale-in, slide, and swipe movement. Do not use spinning mockups, distracting stickers, or rapid zooms that make the worksheet unreadable.
```

Required post-production text:

```text
DIFFERENT LEARNERS.
ONE STORY. THREE LEVELS.
A STORY FOR EVERY DAY.
LEVEL 1
LEVEL 2
LEVEL 3
SAME STORY.
DIFFERENT MATH SUPPORT.
FIND IT ON TPT.
LINK IN BIO.
```

Caption:

```text
Looking for differentiated morning work?

This October resource includes daily math word problems in three levels, helping students work within the same classroom routine while receiving the right level of support.

Find the full resource on TPT.
Link in bio.

#differentiatedinstruction #morningwork #mathworksheets #wordproblems #elementarymath #teachersoftpt #printandgomath #6PM
```

---

## Reel 2 — homeschool routine

### Image-generation prompt for the family hero

```text
Create a warm, realistic editorial photograph for a homeschool math routine, formatted vertically at 1080 x 1920 (9:16). Show one mother with shoulder-length shag hair and two elementary-age children seated together at a light wood dining table in a bright, calm home. The mother is helping both children with a shared learning routine; the children are engaged and relaxed, not posing at the camera.

The scene should communicate “different learners, one homeschool routine.” Include pencils, a few blank or intentionally unreadable worksheet pages, and a welcoming autumn atmosphere. Use natural window light, warm neutral clothing, soft depth of field, and open space near the top and center for bold overlay text.

Keep the same general child age range and family composition as the supplied reference image, but do not copy a real person’s identity. Do not render readable worksheet words, dates, equations, logos, brand marks, or any text. Avoid extra fingers, distorted hands, duplicated pencils, warped paper, or exaggerated stock-photo smiles.
```

### Motion / editing prompt

```text
Edit a 10-second silent Instagram Reel in 1080 x 1920, 30 fps, using the generated 9:16 family hero and supplied real worksheet assets.

0.00–2.00: slow zoom into the family hero. Centered text: “DIFFERENT LEARNERS.” then “ONE HOMESCHOOL ROUTINE.”
2.00–4.00: cut to the real reading-passage page, large and centered. Overlay: “A STORY FOR EVERY DAY.”
4.00–7.00: show the real Level 1, Level 2, and Level 3 pages one at a time with a clean horizontal swipe. Overlay: “CHOOSE THE LEVEL THAT FITS.”
7.00–8.00: centered text card: “SAME STORY. DIFFERENT MATH SUPPORT.”
8.00–10.00: show the supplied original October product-cover image centered on the cream background. Overlay: “FIND IT ON TPT.” and “LINK IN BIO.”

Use the family hero only for context and real worksheet pages for product proof. Keep text inside safe margins and use bold condensed sans-serif typography in #2A313D and #FF8A00.
```

Required post-production text:

```text
DIFFERENT LEARNERS.
ONE HOMESCHOOL ROUTINE.
A STORY FOR EVERY DAY.
CHOOSE THE LEVEL THAT FITS.
SAME STORY.
DIFFERENT MATH SUPPORT.
FIND IT ON TPT.
LINK IN BIO.
```

Caption:

```text
A simple daily routine can give students a consistent way to read, think, and solve.

The October Morning Work resource includes daily math word problems in three levels for elementary classrooms and homeschool families.

Find the full October resource on TPT.
Link in bio.

#octobermath #mathwordproblems #morningwork #elementaryworksheets #homeschoolmath #mathpractice #teacherspayteachers #6PM
```

---

## Carousel — explain the product structure

### Shared generation / layout prompt

```text
Create a cohesive five-slide Instagram carousel in 1080 x 1350 portrait format for an elementary math product called October Morning Work. Use a warm cream background (#FFF2DF), dark navy (#2A313D), bright orange (#FF8A00), heavy condensed sans-serif typography, generous margins, centered hierarchy, and subtle paper shadows.

Use the original supplied TPT product-cover image on Slides 1 and 5. Use real October worksheet pages from reports/october-worksheet-pages/ on Slides 2 and 3. Use the supplied 9:16 AI-generated homeschool family hero on Slide 4, cropped to a wide upper image area. Do not ask the image model to recreate worksheet text or logos. Add all copy and logos as post-production text/assets.

The five slides should tell one story: product promise, historical passage, differentiated levels, real-life routine, CTA. Keep the visual system consistent while giving each slide a distinct purpose.
```

### Slide 1 — cover / hook

```text
Use the original TPT product-cover image as the central hero visual, large enough to recognize but with cream breathing room around it. Keep the product cover undistorted. Add a strong top title and an orange value statement below.
```

Text:

```text
DAILY MATH WORD PROBLEMS
FOR OCTOBER

ONE STORY.
THREE LEVELS.
```

### Slide 2 — story-to-math connection

```text
Place the real October 1 reading-passage page large in the center of the cream canvas. Keep it readable as a page object, but do not rely on tiny worksheet copy. Use an orange setup statement at the top and a navy explanation at the bottom.
```

Text:

```text
START WITH A SHORT
HISTORICAL PASSAGE.

THEN TURN READING
INTO MATH PRACTICE.
```

### Slide 3 — differentiated levels

```text
Place the real October 1 Level 1, Level 2, and Level 3 pages in three large columns. Keep all three pages visibly distinct and inside the safe area. Add labels aligned with their corresponding pages, plus a short bottom takeaway. Do not shrink the pages into unreadable thumbnails.
```

Text:

```text
CHOOSE THE LEVEL
THAT FITS EACH LEARNER.

LEVEL 1        LEVEL 2        LEVEL 3
SAME STORY. DIFFERENT MATH SUPPORT.
```

### Slide 4 — routine / context

```text
Use the AI-generated homeschool family image as a wide upper photo. Keep the mother and both children visible. Place a large cream text panel below the image, with centered navy text. The image should support the idea of one shared routine without implying that it is a real customer testimonial.
```

Text:

```text
A CONSISTENT ROUTINE
FOR CLASSROOMS
AND HOMESCHOOL.
```

### Slide 5 — CTA

```text
Use the original TPT product-cover image centered on the cream canvas. Do not show extra worksheet mockups outside the product-cover image. Add a clear centered CTA beneath it and place the supplied 6PM logo at the bottom. Keep the CTA visually stronger than the logo.
```

Text:

```text
OCTOBER MORNING WORK
FIND THE FULL RESOURCE ON TPT.
LINK IN BIO.
```

Caption:

```text
Daily math practice does not have to look exactly the same for every student.

This October resource combines a short historical passage with daily math word problems in three levels, making it easier to build one shared routine with different levels of support.

Find the full resource on TPT.
Link in bio.

#dailymath #mathwordproblems #octobermath #morningwork #differentiatedmath #elementarymath #homeschoolworksheets #teachersoftpt #6PM
```

---

## Negative prompt and acceptance checks

```text
No readable invented worksheet text, no fake logos, no misspelled words, no extra limbs or fingers, no duplicated children, no warped paper, no cropped worksheet edges, no text touching the frame edge, no neon palette, no cluttered classroom, no exaggerated stock-photo expressions, no watermark, no artificial UI, no unrelated school supplies dominating the frame.
```

Before publishing, verify:

- Reel 1 is 1080×1920, 10 seconds, and keeps the October 1/8/15/22 page stack fully inside the frame.
- Reel 2 is 1080×1920, 10 seconds, and uses the family image only as contextual imagery.
- The Carousel has five 1080×1350 slides.
- Slide 1 and Slide 5 use the original TPT product-cover image without distortion.
- Worksheet copy comes from real SVG/PNG source pages, not generated text.
- Every CTA says `FIND IT ON TPT.` plus `LINK IN BIO.`
- The palette is limited to `#FF8A00`, `#FFF2DF`, and `#2A313D`, with source images allowed as photographic content.
- Every visual has safe margins for Instagram UI overlays and cropping.
