# AETHOS — a branding studio for the AI era

A portfolio demo: the website of a fictional, futuristic branding and marketing
studio. Own IP, no real client involved. Built to show a bold, non-templated web
design that still loads clean, hand-coded with no framework and no build step.

Live: https://aethos.helban.dev

## What it demonstrates

- **Non-sectional layout.** Instead of the usual stacked hero → services → about
  scroll, the site is one full-screen stage with five views (Index, Work,
  Capabilities, Studio, Contact) switched in place. Navigation is spatial, via a
  persistent orbital menu, and every view is deep-linkable through the URL hash
  with working back/forward.
- **A living signal field.** The background is a cursor-reactive flow-field
  particle system on a canvas. It carries the brand idea (a studio that shapes a
  brand's signal) and is the main motion of the page.
- **Restrained, accessible motion.** The particle budget is capped and scales
  with viewport area, device pixel ratio is clamped, the animation pauses when the
  tab is hidden, and `prefers-reduced-motion` turns the field off entirely and
  falls back to a static gradient.
- **Self-hosted, subset type.** Space Grotesk, Inter, and Space Mono are served
  locally as latin-subset woff2 (about 80 KB total), the hero font is preloaded.
  No Google Fonts request, no third-party CSS.
- **Clean fundamentals.** Semantic HTML, keyboard focus moved to the heading on
  view change, `aria-live` form errors, a no-JS fallback that shows every view.

## Stack

Plain HTML, one CSS file, two vanilla JS modules. No framework, no bundler, no
dependencies at runtime.

```
index.html          semantic shell + all five views
css/aethos.css       design tokens, stage/orbital shell, view styles, responsive
js/field.js          the signal-field canvas animation
js/app.js            hash routing, view switching, contact-form validation
fonts/               latin-subset woff2 files
build/get_fonts.py   fetch the woff2 files from Google Fonts
build/subset_fonts.py trim them to the glyphs the site uses (needs fonttools)
```

## Run locally

```
python3 -m http.server 8123
```

Then open http://localhost:8123.

## Rebuild the fonts

```
python3 build/get_fonts.py       # download latin woff2 into fonts/
python3 build/subset_fonts.py    # subset in place (pip install fonttools brotli)
```

## Note

AETHOS is a fictional brand created for this demo. The name, copy, and the seven
"work" entries are invented. The point is the craft, not a real client.
