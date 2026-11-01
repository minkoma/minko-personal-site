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
tools/              hero layer scripts and the local preview server
```

`index.html` stays at the root because GitHub Pages serves the root `index.html` as the home page. `assets/aboutme/originals` keeps the full-size photos; the site loads `assets/aboutme/web`.

## The hero

The supplied artwork arrived as three flat 1920×1080 frames. `tools/prep_hero.py` and `tools/prep_scene.py` rebuild them into independent layers in `assets/hero/`:

- `scene.jpg`: the shoreline with the lettering and the subject painted out.
- `name.png`: the white lettering with a real alpha channel, bridged back across the parts her arm covers.
- `name-01…07.png`: the lettering cut into its seven letters (M, I, N, K, O, M, A). Their boxes live in `js/content.js` under `hero.letters`.
- `subject.png`: the cut-out, keeping the original frame registration.
- `layers.json`: the measured geometry, mirrored into `js/content.js`.

All layers share one 16:9 stage sized like `background-size: cover`, which keeps them in register and lets the name pass behind her. On a portrait screen the stage letterboxes instead of cropping.

## Review helpers

`?static=1` renders the page finished and motionless; add `&flat=1` to shorten the hero. `?fast=1` runs every animation 40× faster.

## Preview

Double-click `Preview.command`, or run `python3 tools/preview.py` (`--no-open` to skip opening a browser). It starts a localhost-only server. Use it rather than opening the file directly, because YouTube embeds need an HTTP Referer.

## Publish on GitHub Pages

In GitHub Settings → Pages, choose Deploy from a branch, `main`, `/ (root)`. All asset paths are relative.
