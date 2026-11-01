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

The artwork is three 6000x3375 frames, kept in `assets/hero/` beside their outputs so the pipeline is reproducible. They are named by role, because the originals arrive as `Minko Ma (2) (1).png` and similar, which says nothing about their contents:

| file | contents |
|---|---|
| `Minko Ma original.png` | the photograph, scene and subject, no lettering |
| `Minko Ma body.png` | the subject alone on pure white |
| `Minko Ma name.png` | the wordmark, white letters on white, only the purple drop shadow visible |

`tools/prep_hero.py` turns the first two into the layers in the same directory:

- `scene.webp` / `scene.jpg`: the photograph with the subject painted out.
- `scene-small.jpg`: a placeholder for the first paint.
- `subject.webp` / `subject.png`: the subject with a real alpha channel, in the original frame registration.
- `name.svg` and `name-01..07.svg`: the wordmark and its seven letters, real vector, from `tools/build_name.py`.
- `layers.json`: the measured geometry. It prints the same boxes in 1920x1080 units to paste into `js/content.js`.

Both photographic layers ship as WebP with a legacy fallback. The subject is a photographic cutout with an alpha channel, the case PNG is worst at: at 3200px it is about 1 MB as PNG and 110 KB as WebP.

All layers share one 16:9 stage sized like `background-size: cover`, which keeps them in register and lets the name pass behind her. On a portrait screen the stage letterboxes instead of cropping.

Geometry in `js/content.js` stays in 1920x1080 units whatever resolution the images carry, because the boxes only ever become percentages and `main.js` positions the hotspots in the same space.

### The name is real vector

`assets/hero/Minko Ma (3).svg` is a Canva SVG export and carries the wordmark as **seven glyph outlines**, one per letter of MINKO MA, as cubic paths from the font. `tools/build_name.py` reads those and writes `name.svg` plus `name-01..07.svg`.

Two things about that export matter. The glyphs are **straight**: Canva bakes its curve effect into a raster layer in the same file rather than into the paths, so `build_name.py` reapplies the arch, and `--rise` is the one knob (64 matches the artwork). The file also holds two 5668x1176 embedded rasters, the curved name as a luminance mask and its colour layer; both are ignored, so nothing in the output is resampled.

This replaced an earlier `trace_name.py`, which reconstructed the letterform by tracing 1-bit masks with marching squares because no vector source existed at the time. Those masks and the tracer are gone. Worth knowing why they existed, in case another export goes the same way: `Minko Ma name.png` has the letters as pure white on pure white, identical to the background, so the letterform is simply not in that file and only an open drop-shadow outline remains. **When exporting the name, give it a background it contrasts with, or export SVG / PDF Print.**

The arch is applied along the baseline *before* bending, so tracking changes do not distort it. `NUDGE` in `build_name.py` carries a cumulative per-letter offset: the font's own fit left the M-I and M-A pairs at 12 and 9 units of box clearance against 27-47 elsewhere, and the offsets open both to about 27. `--no-nudge` uses the font's fit untouched. The wordmark is then refit into the box `prep_hero.py` measured, so tracking changes letterfit rather than footprint.

```
python3 tools/prep_hero.py              # scene, subject, geometry
python3 tools/build_name.py --letters   # name.svg + the seven letters
```

Run the builder after the prep, since it reads the name box the prep measures, then paste the geometry it prints into `js/content.js`.

The wordmark is also scaled to fit the visible viewport width by `main.js`. At 2.5% to 98% of the frame it is narrower than the stage's own crop: at 1440x900 the stage is 1600px wide and loses 80px a side, against the name's 40px margin, so the outer M and A were being cut off. The name is typography rather than part of the photograph, so it is scaled to fit rather than cropped with the photo; at exactly 16:9 the scale is 1 and the artwork is reproduced as drawn.

### Splitting the name into letters

`hero.splitLetters` in `js/content.js` is on, so each letter is its own element and animates separately. `main.js` builds the same structure either way, so turning it off makes the entrance, idle bob, poke and scroll-out apply to the whole word instead, using `name.svg`. Note the name's easter egg completes on one poke while the name is a single piece.

## Review helpers

`?static=1` renders the page finished and motionless; add `&flat=1` to shorten the hero. `?fast=1` runs every animation 40× faster.

## Preview

Double-click `Preview.command`, or run `python3 tools/preview.py` (`--no-open` to skip opening a browser). It starts a localhost-only server. Use it rather than opening the file directly, because YouTube embeds need an HTTP Referer.

## Publish on GitHub Pages

In GitHub Settings → Pages, choose Deploy from a branch, `main`, `/ (root)`. All asset paths are relative.
