# Monthly Thumbnail System Design

**Status:** Draft for review
**Project:** `what-happened-on-this-day-math`
**Scope:** Reusable cover and thumbnail production for monthly worksheet products

## Goal

Create one reusable visual system for monthly worksheet products so that each
month can produce the same five cover/thumbnail types while changing only the
month-specific content, real PDF source pages, and representative hand-drawn
doodle.

## Evidence and design constraints

This design is based on the approved reference outputs and corrections in the
task history:

- The five approved creative roles are Cover, Monthly Overview, What's
  Included, One Story Different Math, and Ready for Daily Practice.
- The user rejected generated or fake worksheet screenshots. Every worksheet
  visual must be rendered from the month's final PDF.
- The user approved a consistent visual system across months, with a different
  hand-drawn doodle representing each month.
- The approved visual language uses a warm cream background, deep navy type,
  orange framing and labels, simple line doodles, generous whitespace, and the
  6pm Studio logo.
- October's verified packet has 127 pages: 124 daily worksheet pages followed
  by 3 answer-key pages.

## Fixed visual system

The following properties are shared by all five thumbnail types:

- Canvas: square 1260 × 1260 PNG.
- Background: `#FEFFEF`.
- Primary text: `#2B313F`.
- Accent and frame: `#FF8A00`.
- Frame: rounded orange border with consistent inset and stroke weight.
- Typography: bold, condensed-looking uppercase display treatment for the
  main headline; compact uppercase labels for page types.
- Logo: the approved 6pm Studio logo, centered in the footer treatment.
- Decoration: simple orange line doodles only; no unrelated illustrations,
  stock imagery, or AI-generated worksheet content.
- Product proof: every worksheet card is a real rendered page from the
  month's final PDF.

## Five fixed templates

### 1. Cover

Communicates the month and product identity. It uses the month name, product
title, short supporting copy, one centered month doodle, and the shared footer.
It does not need to show worksheet screenshots.

### 2. Monthly Overview

Communicates the monthly structure and routine. It uses the month name,
calendar or day-count language, the centered month doodle, and concise
benefit copy. It may use simple symbols, but not invented worksheet pages.

### 3. What's Included

Uses the approved five-card composition:

- top row: Reading Passage, Level 1, Level 2;
- bottom row: Level 3, Answer Key;
- orange capsule labels under each card;
- `WHAT'S INCLUDED` headline and simple orange side doodles.

The five cards are sourced from explicit PDF page numbers in the monthly
manifest.

### 4. One Story, Different Math

Shows the same story context connected to Level 1, Level 2, and Level 3. The
three cards must be real pages from the same monthly PDF and must be labeled
clearly. The central month doodle may connect the cards visually, but must not
obscure worksheet text.

### 5. Ready for Daily Practice

Features one real worksheet page at a readable scale, with a short routine or
use-case headline. The page must remain recognizable as a printable worksheet,
while the month doodle and shared frame provide product identity.

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
  "doodle": {
    "name": "autumn-leaf",
    "path": "assets/doodles/months/november-autumn-leaf.svg"
  },
  "templates": {
    "cover": {"output": "output/thumbnails/november-v1.0-cover.png"},
    "overview": {"output": "output/thumbnails/november-v1.0-overview.png"},
    "whats_included": {
      "output": "output/thumbnails/november-v1.0-whats-included.png",
      "source_pages": {
        "reading_passage": 1,
        "level_1": 2,
        "level_2": 3,
        "level_3": 4,
        "answer_key": 122
      }
    },
    "different_math": {
      "output": "output/thumbnails/november-v1.0-different-math.png",
      "source_pages": {"level_1": 2, "level_2": 3, "level_3": 4}
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
load month manifest and doodle
        ↓
compose five fixed thumbnail templates
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
- the month doodle is the correct asset for the month;
- the fixed palette and frame are preserved;
- text stays inside the canvas and remains legible at marketplace size;
- cards, labels, doodles, and logo do not overlap incorrectly;
- output dimensions are exactly 1260 × 1260;
- the output checksum is recorded in the release manifest.

## Acceptance criteria

The system is ready for reuse when:

1. October can produce all five thumbnail types from its 127-page PDF.
2. No template reads worksheet content from a hand-authored mockup.
3. A new month can be generated by supplying a new PDF, manifest, and doodle
   asset without changing the shared layout code.
4. A changed PDF checksum invalidates the previous derived-asset records.
5. QA reports identify the exact source PDF, page numbers, output files, and
   pass/fail state.

## Out of scope

- TPT listing copy or metadata selection.
- Landing page implementation or deployment.
- Automatic generation of historical content.
- AI generation of worksheet pages or screenshot substitutes.
