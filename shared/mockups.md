# Product mockups — how the demo draws them

The phones, cards and tables in the prototypes are pictures of the product, so
they follow the knomee-demo (the product's reference) rather than inventing
their own look. The shared pieces live in `shared/site.css`.

## Pills (`.new-tag`)
- **New:** grape fill, white text, 16px tall, 11px medium, full pill.
- **Updated** (`.new-tag.is-updated`): light purple with plum ink.
- **Sensitive** (`.new-tag.is-sensitive`): amber wash with amber ink.
- A pill sits **inline, right after a person's name or a goal's title**. Never
  float one on its own, and never put one on a block that isn't a person or goal.

## Scores (`.kq`)
- An outlined box, 2px border, 17px bold, coloured by tier: Ready Now plum,
  Considering grape, Nurture lilac (`.tier-2`, `.tier-3`). Client scores are one
  ocean (`.kq.is-client`).

## Prospect lists
- Rows: a 38px avatar circle (light purple, grape initial), the name in regular
  weight with the New pill after it, a muted second line. Score box on the right.
  No convert buttons.
- Tier bands: full-width plum / grape / soft lilac, uppercase label
  ("TIER 1 — READY NOW").

## Financial Joy options (`.joy-photo`)
- A square photo, label under it. Chosen: a 7px lime ring inside the frame, the
  photo leans in, a plum check circle pops in at the top right and its lime tick
  draws, the label goes bold. At the limit the rest fade to 45%.
- `.joy-photos--sm` scales it down inside a phone.

## Confidence
- The slider is the sun (`.sun-slider`, `data-sun` for a live one,
  `.sun-slider--still` for an animated picture).
- Every gauge: three purple segments at full strength, a plum needle turning from
  the dial's centre, the word under it.

## Financial ID (`.fid`)
- The client's side: the title ("Jordan Ellis’s Financial ID") in ocean, sections
  divided by hairlines, each headed by its adventure icon and name.
- Financial Joy: "I want money to help me with" in ocean, then outlined pills.
- Confidence: the word with a small gauge. Life Events: the event's icon and name
  in ocean.

## Words inside mockups
- Life events are events: Graduation, not Education.
- A conversation starter is a question the advisor can put to the client, in the
  client's own terms ("What does enough look like for you?"). Never an instruction
  to the advisor. It follows from what the person just answered and never repeats
  what the card already shows.
- Life events read in ink, not teal.
- Readiness (Prospect or Goal) always shows its stage-of-change art,
  `assets/ttm/TTM-1…5.svg` for Pre-Contemplation … Maintenance, never a generic icon.
- Every adventure or section icon sits on its white disc with a soft drop shadow,
  and each card section carries its icon from the app.
