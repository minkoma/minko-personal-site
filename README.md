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

The supplied artwork arrived as three flat 1920×1080 frames. `tools/prep_hero.py` and `tools/prep_scene.py` rebuild them into independent layers in `assets/hero/`:

- `scene.jpg`: the shoreline with the lettering and the subject painted out.
- `name.png`: the white lettering with a real alpha channel, bridged back across the parts her arm covers.
- `name-01…07.png`: the lettering cut into its seven letters (M, I, N, K, O, M, A).
- `name.svg`, `name-01…07.svg`: the same lettering as vectors, traced from those masks by `tools/trace_name.py`. These are what the page loads. Their boxes live in `js/content.js` under `hero.letters`.
- `subject.png`: the cut-out, keeping the original frame registration.
- `layers.json`: the measured geometry, mirrored into `js/content.js`.

All layers share one 16:9 stage sized like `background-size: cover`, which keeps them in register and lets the name pass behind her. On a portrait screen the stage letterboxes instead of cropping.

### Why the lettering is traced

The lettering only ever existed as pixels in the photograph, so there is no original vector artwork. `prep_hero.py` extracts it as a 1-bit mask, which leaves the edges as 90-degree staircase steps, and the hero then draws the name at full viewport width, well past the mask's native size. Re-deriving a softer mask from the photograph is not an option either: the lake and sky are as bright as the white lettering, so luminance cannot separate them.

`tools/trace_name.py` therefore traces the mask to SVG: it upsamples the alpha so the half-pixel blur becomes sub-pixel edge information, takes contours by marching squares at the 0.5 iso-level, smooths each loop with Taubin smoothing, and fits one cubic Bezier per point. Taubin rather than a moving average because a moving average is curve-shortening flow, which visibly thins the hairline serifs.

It prints a fidelity report and exits non-zero if the trace drifts: intersection-over-union against the upsampled field it traced, and area bias, which is what would show up as letters looking fatter or thinner. Keep IoU above 0.975 and bias within 2%. The gate is not set higher because the smoothing is deliberately removing a one-pixel staircase, and that costs a couple of percent of IoU by itself. Two loops are dropped as too small to be letterform: a white sail on the lake under the wordmark, and a speck above it.

Re-run it after any change to `prep_hero.py`:

```
python3 tools/trace_name.py
```

### Letterfit

`hero.letters` in `js/content.js` carries a `nudge`, an x offset in frame pixels applied on top of each measured box. The hand lettering sets its own letterfit, and two pairs sat too tight at full width: the M and A of "MA" touched at their bottom serifs, and the M and I of "MINKO" came within 13px. The offsets open every gap inside a word to 21px and leave the 83px word space alone.

## Review helpers

`?static=1` renders the page finished and motionless; add `&flat=1` to shorten the hero. `?fast=1` runs every animation 40× faster.

## Preview

Double-click `Preview.command`, or run `python3 tools/preview.py` (`--no-open` to skip opening a browser). It starts a localhost-only server. Use it rather than opening the file directly, because YouTube embeds need an HTTP Referer.

## Publish on GitHub Pages

In GitHub Settings → Pages, choose Deploy from a branch, `main`, `/ (root)`. All asset paths are relative.
