# Monthly Thumbnail System Design

**Status:** Draft for review
**Project:** `what-happened-on-this-day-math`
**Scope:** Reusable cover and thumbnail production for monthly worksheet products

## Goal

Create one reusable visual system for monthly worksheet products so that each
month can produce the same four cover/thumbnail types while changing only the
month-specific content and real PDF source pages.

## Evidence and design constraints

This design is based on the exact production prompts recorded in
[`docs/monthly-thumbnail-prompts.md`](../../monthly-thumbnail-prompts.md) and
the corrections in PR #77:

- The four approved creative roles are Cover, What's Included, One Story
  Different Math, and Ready for Daily Practice.
- The user rejected generated or fake worksheet screenshots. Every worksheet
  visual must be rendered from the month's final PDF.
- The user approved a consistent visual system across months, with real PDF
  page previews providing product proof instead of synthetic worksheet art.
- The approved visual language uses a warm cream background, deep navy type,
  orange framing and labels, prompt-specific title rays or side lines,
  generous whitespace, and the 6pm Studio logo.
- October's verified packet has 127 pages: 124 daily worksheet pages followed
  by 3 answer-key pages.

## Fixed visual system

The following properties are shared by all four thumbnail types:

- Canvas: square 1260 × 1260 PNG.
- Background: `#FEFFEF`.
- Primary text: `#2B313F`.
- Accent and frame: `#FF8A00`.
- Frame: rounded orange border with consistent inset and stroke weight.
- Typography: bold, condensed-looking uppercase display treatment for the
  main headline; compact uppercase labels for page types.
- Logo: the approved 6pm Studio logo, centered in the footer treatment.
- Decoration: simple orange title rays only; no unrelated illustrations, stock
  imagery, or AI-generated worksheet content.
- Product proof: every worksheet card is a real rendered page from the
  month's final PDF.

## Four fixed templates

### 1. Cover

Communicates the month and product identity. The month is the largest headline,
followed by `MORNING WORK MATH` and `31 DAILY WORD PROBLEMS`, with one
recognizable month-specific orange
single-line doodle in the center. The layout changes only the month and doodle.

### 2. What's Included

Uses the exact headline `WHAT'S INCLUDED`, three orange emphasis lines on both
sides of the headline, and five real-page previews in a 3-over-2 grid:
STORY, LEVEL 1, LEVEL 2, LEVEL 3, and ANSWER KEY. Each preview has an orange
border, orange label pill, and soft shadow.

The five cards are sourced from explicit PDF page numbers in the monthly
manifest.

### 3. One Story, Different Math

Uses the exact two-line headline `ONE STORY` / `DIFFERENT MATH`, one orange
horizontal line on each side of the headline, and real Level 1, Level 2, and
Level 3 pages in one row with large navy labels beneath them.

### 4. Ready for Daily Practice

Uses the exact two-line headline `READY FOR` / `DAILY PRACTICE`, three orange
emphasis lines on both sides, one real worksheet page, and navy use-case labels
`MORNING WORK | BELL RINGERS | HOMESCHOOL` separated by thin vertical orange
lines.

## Monthly manifest interface

Each month has one manifest with this conceptual shape:

```json
{
  "product": "november-morning-work-math",
  "month": "November",
  "month_number": 11,
  "pdf": {
    "path": "output/pdf/november-worksheet-packet.pdf",
    "sha256": "<sha256-of-final-pdf>",
    "page_count": 124
  },
  "templates": {
    "cover": {"output": "output/thumbnails/november-v1.0-cover.png"},
    "whats_included": {
      "output": "output/thumbnails/november-v1.0-whats-included.png",
      "source_pages": {
        "story": 1,
        "level_1": 2,
        "level_2": 3,
        "level_3": 4,
        "answer_key": 122
      }
    },
    "different_math": {
      "output": "output/thumbnails/november-v1.0-different-math.png",
      "source_pages": {"story": 1, "level_1": 2, "level_2": 3, "level_3": 4}
    },
    "daily_practice": {
      "output": "output/thumbnails/november-v1.0-daily-practice.png",
      "source_pages": {"worksheet": 2}
    }
  }
}
```

The example page numbers are illustrative interface examples only. The actual
page numbers must be calculated from the final PDF and written into the
month's manifest; they must never be copied blindly between months.

## Production flow

```text
final monthly PDF
        ↓
PDF checksum and page-count validation
        ↓
render selected source pages
        ↓
load month manifest and real source pages
        ↓
compose four fixed thumbnail templates
        ↓
visual QA and manifest update
        ↓
landing page / TPT asset handoff
```

The PDF is the source of truth. Thumbnails are derived assets. If the PDF
checksum changes, all affected thumbnails must be regenerated and rechecked.

## Visual QA requirements

Every generated thumbnail must verify:

- all source images exist in the final PDF;
- source page numbers match the monthly manifest;
- no worksheet content was synthetically generated or rewritten;
- page labels match the page type shown;
- the fixed palette and frame are preserved;
- text stays inside the canvas and remains legible at marketplace size;
- cards, labels, and logo do not overlap incorrectly;
- output dimensions are exactly 1260 × 1260;
- the output checksum is recorded in the release manifest.

## Acceptance criteria

The system is ready for reuse when:

1. October can produce all four requested thumbnail types from its 127-page PDF.
2. No template reads worksheet content from a hand-authored mockup.
3. A new month can be generated by supplying a new PDF and manifest without
   changing the shared layout code.
4. A changed PDF checksum invalidates the previous derived-asset records.
5. QA reports identify the exact source PDF, page numbers, output files, and
   pass/fail state.

## Out of scope

- TPT listing copy or metadata selection.
- Landing page implementation or deployment.
- Automatic generation of historical content.
- AI generation of worksheet pages or screenshot substitutes.
