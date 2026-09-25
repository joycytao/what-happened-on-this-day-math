# TPT metadata taxonomy for Morning Work Math

This taxonomy keeps monthly TPT listings consistent while leaving pricing,
keyword-volume research, and publication decisions outside this issue. October
is the reference record; later months reuse the same fields and allowed values.

## Required fields and allowed values

Every listing record contains title, subject area, resource type, grade band,
format, description, keywords, and product relationship.

- Subject area: Math, with Reading or History as supporting areas when the
  listing permits multiple selections.
- Resource type: Worksheets, Printables, or Task Cards.
- Grade band: Grades 1-3, Grades 3-5, or Grades 1-5. The open question about
  final grade wording remains visible in the taxonomy rather than silently
  changing the record later.
- Format: PDF or Printable PDF.
- Product relationship: monthly standalone or annual bundle.

## Naming rules

- Monthly title: `{Month} Morning Work Math`.
- Bundle title: `Morning Work Math: Full-Year Bundle`.
- The month name must appear in each monthly display title.
- The stable product identifier is managed by the portfolio contract; metadata
  must not invent a second identifier.

## Keyword groups

Use a small, repeatable set rather than re-deciding the product positioning for
each month:

- Math: `math word problems`, `morning work`, `daily math practice`.
- Routine: `bell ringers`, `homework`, `homeschool`.
- History: `historical mini-stories`, `history integration`, `real-world math`.
- Differentiation: `three levels`, `leveled math`, `mixed-level learners`.

Core taxonomy terms are stable. Optional search phrases may be added only when
they describe the actual month and do not replace the core terms.

## Monthly versus bundle records

A monthly standalone listing owns its PDF, worksheet coversheet PNG,
worksheet-sized PDF cover/page 1, answer keys, thumbnails, listing copy, and
release record. An annual bundle references only monthly products whose
release records say `released`; it does not rename or duplicate them. The
coversheet is part of the product artifact relationship, not a new TPT
metadata field.
An optional seasonal group can organize monthly identifiers without changing
their standalone metadata.

## October reference record

The canonical example is **October Morning Work Math**, a Math Worksheets
Printable PDF for Grades 1-5. Its keywords include math word problems, morning
work, historical mini-stories, and three levels. The open question about using
“Historical Mini-Stories” in the title remains a documented choice: the current
title keeps the product positioning clear, while the phrase is a core history
keyword.

Run `npm run tpt:metadata:validate` to validate the JSON record and write the
evidence report. This issue changes metadata documentation only, so
mathematics and PDF/layout checks are recorded as not applicable.
