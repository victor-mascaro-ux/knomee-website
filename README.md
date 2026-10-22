# knomee.com — homepage prototypes

Three design directions for the knomee.com homepage, as static HTML, to show
ideas. They use the live homepage's content word for word: only the design
changes. Open `v1/`, `v2/` or `v3/`; the root redirects to `v1/`, and a switcher
in the corner of each page jumps between versions.

| | Direction | What leads |
|---|---|---|
| `v1/` | **Both sides** · product-led | A hero where a prospect answers on their phone and the advisor’s view fills in, and a live interactive-discovery mirror |
| `v2/` | **Try it first** · experience-led | The hero is a short, playable Knomee adventure that ends in what the advisor sees |
| `v3/` | **Proof first** · proof-led | Numbers and proof lead, with a capability bento and a quote wall |

Links and forms aren’t wired up; these exist to show layout, hierarchy and motion.

## Run it

```bash
python -m http.server 8780
```

Then open <http://localhost:8780>. Any static server works; there is no build step.

## Structure

```
shared/
  content.md     the homepage's exact text — the only source of words
  tokens.css     the Knomee design system tokens, copied from knomee-ds
  site.css       the marketing layer every version shares
  site.js        header, dropdowns, scroll reveals, count-ups, tabs, FAQ,
                 video, mobile CTA — wired by data attributes
  snippets.html  the canonical header, video, closing, FAQ and footer markup
assets/          logos, adventure icons, life-event illustrations, value photos
v1/ v2/ v3/      each version: index.html plus its own css and js
```

## Content

- Every visible word is from the knomee.com homepage, verbatim (see `shared/content.md`).
- Customers’ staff names and headshots are left out of their quotes. Endorsers and
  the research partner keep theirs.
- Text inside product mockups (questions, scores, the people in a prospect list)
  is product UI. The people are invented.
- The site’s two videos, the Archer, Redtail and HubSpot logos and the research
  partner’s photo load from knomee.com’s own image and video CDN.

## Design system

Everything reads from `shared/tokens.css`, which is the Knomee design system’s
`colors.css`, `typography.css` and `layout.css` unchanged, apart from loading only
the Poppins weights the site uses. Motion follows the system: content fades up
22px with the pop easing, staggered by `--stagger`; hovers lift 1–2px; presses
shrink. Every animation has a reduced-motion state.
