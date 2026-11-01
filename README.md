# Minko Ma: personal website

A scroll-animated portfolio in a paper-scrapbook style: paper grain, tape, handwriting. Plain HTML, CSS and JavaScript with vendored libraries. No build step.

The full-screen hero develops in, her name settles behind her letter by letter and stays pokeable. "My path so far" alternates notes and photo collages, "Films I made" and the design album show her work, and "Bits of me" uses shaped photos with nine hidden easter eggs.

## Files

```
index.html          the site (section shells; js fills them in)
resume.html         printable résumé page
Preview.command     double-click to preview locally
css/
  base.css          resets, hero layer registration, no-JS / reduced-motion fallbacks
  styles.css        the site's look and layout
  resume.css        résumé page styles
js/
  content.js        every piece of text and every photo path. Edit content here.
  motion.js         reusable effects (smooth scroll, split-text, highlight, hero builder)
  main.js           hero intro, section rendering, cursor, easter eggs
assets/             photos, design decks, hero layers, vendored libraries
tools/              hero layer scripts, the lettering tracer, the preview server
```

`index.html` stays at the root because GitHub Pages serves the root `index.html` as the home page. `assets/aboutme/originals` keeps the full-size photos; the site loads `assets/aboutme/web`.

## The hero

The artwork arrives as three 6000x3375 frames, identified by role rather than by filename:

| role | contents |
|---|---|
| photo | the photograph, scene and subject, no lettering |
| cutout | the subject alone on pure white |
| plate | the wordmark, white letters on white, only the purple drop shadow visible |

`tools/prep_hero.py` turns the first two into the layers in `assets/hero/`:

- `scene.webp` / `scene.jpg`: the photograph with the subject painted out.
- `scene-small.jpg`: a placeholder for the first paint.
- `subject.webp` / `subject.png`: the subject with a real alpha channel, in the original frame registration.
- `name.svg`: the whole wordmark as one traced vector, from `tools/trace_name.py`.
- `layers.json`: the measured geometry. It prints the same boxes in 1920x1080 units to paste into `js/content.js`.

Both photographic layers ship as WebP with a legacy fallback. The subject is a photographic cutout with an alpha channel, the case PNG is worst at: at 3200px it is about 1 MB as PNG and 110 KB as WebP.

All layers share one 16:9 stage sized like `background-size: cover`, which keeps them in register and lets the name pass behind her. On a portrait screen the stage letterboxes instead of cropping.

Geometry in `js/content.js` stays in 1920x1080 units whatever resolution the images carry, because the boxes only ever become percentages and `main.js` positions the hotspots in the same space.

### Why the name is a traced vector

The lettering only ever existed as pixels. The plate carries the name's *position* but not its *shape*: its glyph fill is pure white on a pure white background, so the letterform is simply not in the file, and all that remains is an open drop-shadow outline that a fill leaks straight through. Luminance cannot recover it from the photograph either, because the lake and sky are as bright as the white letters.

So the letterform comes from the 1-bit masks the first version of the pipeline cut out of the old 1920px composite, `name-01…07.png`, with their geometry in `letters.json`. Those are the only record of it, which is why they are kept even though nothing else uses them.

`tools/trace_name.py` traces them to one combined SVG: it upsamples each alpha so the half-pixel blur becomes sub-pixel edge information, takes contours by marching squares at the 0.5 iso-level, smooths each loop with Taubin smoothing, and fits one cubic Bezier per point. Taubin rather than a moving average because a moving average is curve-shortening flow, which visibly thins the hairline serifs. Being vector, the result is lossless to place at any size, so the name gains nothing from a higher-resolution source.

It prints a fidelity report and exits non-zero if the trace drifts: intersection-over-union against the upsampled field it traced, and area bias, which is what would show up as letters looking fatter or thinner. Keep IoU above 0.975 and bias within 2%. The gate is not higher because the smoothing is deliberately removing a one-pixel staircase, which costs a couple of percent of IoU by itself. Two loops are dropped as too small to be letterform: a white sail on the lake under the wordmark, and a speck above it.

```
python3 tools/prep_hero.py      # scene, subject, geometry
python3 tools/trace_name.py     # name.svg, placed per that geometry
```

Run the tracer after the prep, since it reads the name box the prep measures.

### Placement and letterfit

The plate puts the name larger and lower than the old composite did: its box is a uniform 4.23x of the letters' own ink box, where a plain frame rescale would have been 3.125x. `trace_name.py` maps the traced letters onto that box.

`letters.json` carries a `nudge` per letter, an x offset in the mask's own units. The hand lettering sets its own letterfit, and two pairs sat too tight: the M and A of "MA" touched outright at their bottom serifs, and the M and I of "MINKO" came within 13px, against 20-39px elsewhere. The nudges open every gap inside a word to 21px and leave the 83px word space alone. Because separating them widens the word, and the artwork already runs from 2.5% to 98% of the frame, the result is refit into the artwork's own box so the nudges change letterfit rather than footprint. `--no-nudge` places the letters exactly as drawn.

The wordmark is also scaled to fit the visible viewport width by `main.js`. At 2.5% to 98% of the frame it is narrower than the stage's own crop: at 1440x900 the stage is 1600px wide and loses 80px a side, against the name's 40px margin, so the outer M and A were being cut off. The name is typography rather than part of the photograph, so it is scaled to fit rather than cropped with the photo; at exactly 16:9 the scale is 1 and the artwork is reproduced as drawn.

### Splitting the name into letters

`hero.splitLetters` in `js/content.js` is off, so the name is one piece. `main.js` builds the same structure either way, so the entrance, the idle bob, the poke and the scroll-out all still apply, to the word rather than to each letter. To animate the letters separately, write the per-letter files and turn the flag on:

```
python3 tools/trace_name.py --letters
```

and restore a `letters` array in `hero` from `letters.json`. Note the name's easter egg completes on one poke while the name is a single piece.

## Review helpers

`?static=1` renders the page finished and motionless; add `&flat=1` to shorten the hero. `?fast=1` runs every animation 40× faster.

## Preview

Double-click `Preview.command`, or run `python3 tools/preview.py` (`--no-open` to skip opening a browser). It starts a localhost-only server. Use it rather than opening the file directly, because YouTube embeds need an HTTP Referer.

## Publish on GitHub Pages

In GitHub Settings → Pages, choose Deploy from a branch, `main`, `/ (root)`. All asset paths are relative.
