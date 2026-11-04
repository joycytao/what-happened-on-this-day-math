# Reusable Monthly Social Generation Prompts

This document reverse-engineers the approved Reel 1, Reel 2, and Carousel assets into a month-agnostic generation package. October is included only as a completed example. Replace the bracketed variables for every new monthly product.

The workflow separates visual generation, motion/editing, post-production text, social captions, and product description copy. Image and video models must not be asked to generate readable worksheet copy or accurate logos. Use real worksheet pages and the supplied product-cover image as composited assets.

## Monthly input contract

Provide these values before generation:

```yaml
month_name: "[MONTH]"
product_name: "[MONTH] Morning Work"
product_url: "[TPT PRODUCT URL]"
redirect_url: "[MONTHLY REDIRECT URL]"
primary_audience: "elementary teachers and homeschool families"
reel_1_keyword: "[MONTH] morning work"
reel_2_keyword: "three levels of math worksheets"
carousel_keyword: "daily math word problems"
level_labels: ["Level 1", "Level 2", "Level 3"]
number_of_days: "[NUMBER OF DAYS]"
story_role: "[one short historical or thematic story per day]"
```

Asset contract:

- `[MONTH]-reading-passage.svg` and `[DAY]-reading-passage.svg`: real reading pages.
- `[DAY]-level1.svg`, `[DAY]-level2.svg`, `[DAY]-level3.svg`: real worksheet pages.
- `[MONTH]-product-cover.png`: the original TPT product-cover image.
- `[MONTH]-family-hero-9x16.png`: optional AI-generated context image, never presented as a real customer photograph.
- `[BRAND_LOGO.png]`: supplied logo asset.

Shared visual system:

- Reels: `1080 × 1920`, 30 fps, 9:16.
- Carousel: `1080 × 1350`, 4:5.
- Background: `#FFF2DF`.
- Primary text: `#2A313D`.
- Accent: `#FF8A00`.
- Typography: Anton, Bebas Neue Bold, League Spartan Bold, Arial Black, or Montserrat ExtraBold.
- Use centered hierarchy, generous safe margins, subtle paper shadows, and strong contrast.
- Do not create readable invented worksheet text, dates, equations, or logos.

---

## Universal asset-generation prompt

```text
Create a cohesive social-content asset system for [PRODUCT_NAME], a printable elementary math resource for [PRIMARY_AUDIENCE]. The product combines [STORY_ROLE] with daily math word problems in [LEVEL_LABELS] levels.

Use a warm cream background (#FFF2DF), dark navy (#2A313D), and bright orange (#FF8A00). Use bold condensed sans-serif typography, generous safe margins, centered hierarchy, and subtle paper shadows. The tone is warm, clear, practical, confident, and educational.

Use the supplied real worksheet pages as composited source assets. Preserve their page proportions and do not redraw, rewrite, hallucinate, or sharpen their text. Use the supplied original product-cover image without distortion. Do not generate a fake logo. Add all text and logos in post-production.

If a family context visual is needed, create a warm realistic editorial homeschool scene in the requested aspect ratio. Keep the family composition consistent with the supplied reference, but do not copy a real person’s identity. Do not render readable worksheet words, equations, dates, logos, or any text. Avoid extra fingers, distorted hands, duplicated children, warped paper, or exaggerated stock-photo expressions.
```

Universal negative prompt:

```text
No readable invented worksheet text, no fake logos, no misspelled words, no extra limbs or fingers, no duplicated children, no warped paper, no cropped worksheet edges, no text touching the frame edge, no neon palette, no cluttered classroom, no exaggerated stock-photo expressions, no watermark, no artificial UI, no unrelated school supplies dominating the frame.
```

---

## Reel 1 — monthly morning-work discovery

### Visual and motion prompt

```text
Edit a 10-second silent Instagram Reel in 1080 x 1920, 30 fps, for [REEL_1_KEYWORD]. Use [MONTH]-product-cover.png and real worksheet pages from the monthly asset set.

0.00–2.00: cream background. Centered hook text: “Need [MONTH] morning work?”
2.00–5.00: show a clean, large view of the monthly product cover or a controlled product-preview crop. Overlay: “Daily math word problems.”
5.00–7.00: show the three real level pages one at a time with clean horizontal swipes. Overlay: “Three levels.”
7.00–9.00: show the product cover or a tidy page grouping. Overlay: “One ready-to-use routine.”
9.00–10.00: centered CTA: “Find the full resource on TPT.” Use [PRODUCT_URL] in the caption or platform link field, not as tiny unreadable text inside the visual.

Use subtle scale-in, slide, and swipe movement. Keep every page inside the safe area. Do not shrink three worksheets into unreadable thumbnails.
```

Required post-production text:

```text
Need [MONTH] morning work?

Daily math word problems
Three levels
One ready-to-use routine
```

October example:

```text
Need October morning work?

Daily math word problems
Three levels
One ready-to-use routine
```

### Caption-generation prompt

```text
Write one natural Instagram Reel caption for [PRODUCT_NAME]. Use the keyword “[REEL_1_KEYWORD]” in the first sentence. Explain that the printable resource includes daily word problems in three levels and supports different learners in the same classroom. Mention both elementary classrooms and homeschool families. End with the exact product URL: [PRODUCT_URL]. Add 8–10 relevant lowercase hashtags, including the brand tag #6PM. Keep the tone clear and helpful, not hype-heavy.
```

October example caption:

```text
Looking for October morning work that students can use every day?

This printable math resource includes daily word problems in three levels, making it easier to support different learners in the same classroom.

Designed for elementary classrooms and homeschool families.

Find the full worksheet on TPT:
https://www.teacherspayteachers.com/Product/October-Morning-Work-Math-Worksheets-Daily-Math-Word-Problems-3-Levels-17671758

#octobermath #morningwork #mathworksheets #wordproblems #elementarymath #differentiatedinstruction #teachersoftpt #homeschoolmath #printandgomath #6PM
```

---

## Reel 2 — three levels in one routine

### Visual and motion prompt

```text
Edit a 10-second silent Instagram Reel in 1080 x 1920, 30 fps, for [REEL_2_KEYWORD]. Use a calm opening routine frame, the real [MONTH] Level 1/2/3 worksheet pages, and the original product-cover image.

0.00–2.00: centered text card: “One daily routine.”
2.00–4.00: show the three real pages in sequence, each large enough to recognize. Overlay: “Three levels of math.”
4.00–7.00: show Level 1 → Level 2 → Level 3 with a clean horizontal swipe and centered labels.
7.00–9.00: cream text card: “Same month. Different ways to practice.”
9.00–10.00: centered product-cover CTA: “See the full [MONTH] resource on TPT.”

Use the family hero only when a real-life context is needed. Use real worksheet pages for product proof. Keep all text inside safe margins and preserve the three-level distinction.
```

Required post-production text:

```text
One daily routine.
Three levels of math.

Level 1
Level 2
Level 3

Same month.
Different ways to practice.
```

### Caption-generation prompt

```text
Write one natural Instagram Reel caption for [PRODUCT_NAME]. Use the keyword “[REEL_2_KEYWORD]” naturally in the opening or second sentence. Explain that one classroom may include different math levels, and that this monthly resource provides three levels of daily math word problems within the same routine. End with a soft invitation to see the full resource on TPT. Add 8–10 relevant lowercase hashtags, including #6PM. Do not claim a universal grade match or guaranteed learning outcome unless supported by the product data.
```

October example caption:

```text
One classroom does not always mean one math level.

This October morning work resource includes three levels of daily math word problems so students can practice within the same classroom routine.

See the full October resource on TPT.

#differentiatedmath #mathwordproblems #octobermorningwork #elementaryworksheets #morningwork #mathpractice #teacherspayteachers #homeschoolworksheets #6PM
```

---

## Carousel — five-slide monthly explanation

### Shared carousel prompt

```text
Create a cohesive five-slide Instagram carousel in 1080 x 1350 portrait format for [PRODUCT_NAME]. Use the original [MONTH]-product-cover.png on Slides 1 and 5, real monthly worksheet pages on Slides 2 and 3, and an optional [MONTH]-family-hero-9x16.png on Slide 4.

Use #FFF2DF, #2A313D, and #FF8A00 with heavy condensed sans-serif typography. Each slide must have one clear message, strong centered hierarchy, generous margins, and enough contrast for mobile reading. Do not shrink evidence pages into unreadable thumbnails. Do not ask the image model to recreate worksheet text or logos; add copy and logos as post-production layers.
```

### Slide prompts and copy

Slide 1 — cover:

```text
Use the original [MONTH]-product-cover.png as the central product visual, kept at its original aspect ratio. Add a large centered title above or below it. Leave generous cream breathing room.
```

```text
[PRODUCT_NAME]
```

Slide 2 — routine:

```text
Show one real reading-passage page or one clean product-preview crop. Use a simple cream layout with one large centered statement. The slide should communicate a repeatable start-of-day routine, not a specific classroom claim.
```

```text
A SIMPLE ROUTINE
FOR THE START OF THE DAY
```

Slide 3 — differentiation:

```text
Place the real Level 1, Level 2, and Level 3 pages in three distinct columns or sequential panels. Keep each page recognizable and label it directly. Do not imply that the levels map to a universal grade band unless the monthly product data confirms that mapping.
```

```text
THREE LEVELS
FOR DIFFERENT LEARNERS
```

Slide 4 — process:

```text
Use a clean page crop, a reading-to-math visual sequence, or the optional family context image. The visual should explain the learner action in three short steps. If a family image is used, it is illustrative context and not a customer testimonial.
```

```text
READ.
THINK.
SOLVE.
```

Slide 5 — CTA:

```text
Use the original product-cover image centered on the cream canvas. Add a centered CTA beneath it and place the supplied brand logo at the bottom. Keep the CTA stronger than the logo. Use [PRODUCT_URL] in the caption or link field rather than rendering a tiny URL in the image.
```

```text
FIND THE FULL [MONTH] RESOURCE
ON TPT

[BRAND LOGO]
```

### Carousel caption-generation prompt

```text
Write one saveable Instagram Carousel caption for [PRODUCT_NAME]. Open with the idea that a daily math routine can be simple and flexible. Explain that the resource includes daily math word problems in three levels and supports different learning needs while keeping practice consistent. Include the exact product URL [PRODUCT_URL]. Invite the reader to save the post for morning-work planning. Add 10–12 relevant lowercase hashtags, including #6PM. Keep the caption conversational and avoid unsupported claims about results, grade level, or testimonials.
```

October example caption:

```text
A daily math routine can be simple and flexible.

The October resource includes daily math word problems in three levels, giving students consistent practice while allowing you to meet different learning needs.

Find the full resource on TPT:
https://www.teacherspayteachers.com/Product/October-Morning-Work-Math-Worksheets-Daily-Math-Word-Problems-3-Levels-17671758

Save this for your next morning-work planning session.

#dailymath #mathwordproblems #morningwork #octobermath #elementarymath #differentiatedinstruction #mathworksheets #teachersoftpt #homeschoolmath #printableresources #6PM
```

---

## Product description prompt

Use this for a monthly TPT listing description. It is separate from social captions so the listing can include fuller product details without making Reel or Carousel copy too dense.

```text
Write an English Teachers Pay Teachers product description for [PRODUCT_NAME]. Use the verified monthly product data only.

Required structure:
1. One-sentence value proposition using [PRIMARY_KEYWORD].
2. A short paragraph explaining the daily story-to-math routine.
3. A “What’s Included” list using the exact available assets and page counts.
4. A “Three Levels” section explaining that the same story/topic is supported by different math task difficulty; do not invent grade mappings.
5. A “Best For” section covering only supported contexts such as elementary classrooms, homeschool practice, morning work, or extra practice.
6. A concise “How to Use It” section.
7. A factual file-format / printing note.
8. A short CTA using [PRODUCT_URL].

Use [MONTH_NAME], [NUMBER_OF_DAYS], [PRODUCT_NAME], [PRIMARY_KEYWORD], [LEVEL_LABELS], [FILE_FORMAT], [PAGE_COUNT], and [PRODUCT_URL] as inputs. Never invent page counts, answer-key contents, grade levels, standards, student outcomes, testimonials, or editable-file claims. Keep all student-facing examples in English.
```

## Month replacement checklist

- Replace `[MONTH]`, product name, keyword set, product URL, and redirect URL.
- Verify the month has the intended number of days and that the actual worksheet assets exist.
- Replace the cover and source pages with assets from the same monthly package.
- Keep the same Reel durations, canvas sizes, palette, typography, and CTA hierarchy unless a new approved design system exists.
- Remove any scene whose evidence is unavailable for the new month.
- Confirm that the product description uses verified page counts and file-format data.
- Confirm that captions use the correct monthly URL and do not retain October-specific hashtags or copy.

## Final QA

- Reel 1 and Reel 2 are 1080×1920, 10 seconds, silent by default, and keep every asset inside safe margins.
- The Carousel has five 1080×1350 slides.
- Worksheet copy comes from real SVG/PNG source pages, not generated text.
- Product-cover imagery is used without distortion.
- The CTA consistently names the current month/product and points to `[PRODUCT_URL]` or the approved monthly redirect.
- No prompt makes unsupported claims about grade level, mastery, classroom results, or family results.
- No generated family visual is presented as a real customer photograph.
