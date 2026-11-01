# Minko Ma: personal website

A scroll-animated portfolio in a paper-scrapbook style: paper grain, tape, handwriting. Plain HTML, CSS and JavaScript with vendored libraries. No build step.

The full-screen hero develops in, her name settles behind her letter by letter and stays pokeable. "My path so far" alternates notes and photo collages, "Films I made" and the design album show her work, and "Bits of me" uses shaped photos with nine hidden easter eggs.

## Files

- `index.html`: section shells. The script fills them from the data file.
- `styles.css`: the site's look and layout.
- `main.js`: hero intro, section rendering, cursor, easter eggs.
- `data/minko.js`: every piece of content (profile, education, work, skills, videos, design decks, interests). Edit content here. The résumé is the source of truth.
- `shared/motion.js`: reusable effects switched on by data attributes (smooth scroll, split-text reveals, word-by-word highlight, preloader, hero builder).
- `shared/base.css`: resets, hero layer registration, reduced-motion and no-JS fallbacks.
- `resume.html` + `resume.css`: printable résumé page.
- `assets/`: photos, design decks, hero layers, vendored libraries. `assets/aboutme/originals` keeps the full-size photos; the site loads `assets/aboutme/web`.
- `tools/`: scripts that rebuilt the hero artwork into layers.

## The hero

The supplied artwork arrived as three flat 1920×1080 frames. `tools/prep_hero.py` and `tools/prep_scene.py` rebuild them into independent layers in `assets/hero/`:

- `scene.jpg`: the shoreline with the lettering and the subject painted out.
- `name.png`: the white lettering with a real alpha channel, bridged back across the parts her arm covers.
- `name-01…07.png`: the lettering cut into its seven letters (M, I, N, K, O, M, A). Their boxes live in `data/minko.js` under `hero.letters`.
- `subject.png`: the cut-out, keeping the original frame registration.
- `layers.json`: the measured geometry, mirrored into `data/minko.js`.

All layers share one 16:9 stage sized like `background-size: cover`, which keeps them in register and lets the name pass behind her. On a portrait screen the stage letterboxes instead of cropping.

## Review helpers

`?static=1` renders the page finished and motionless; add `&flat=1` to shorten the hero. `?fast=1` runs every animation 40× faster.

## Preview

Double-click `Preview.command`, or run `python3 preview.py` (`--no-open` to skip opening a browser). It starts a localhost-only server. Use it rather than opening the file directly, because YouTube embeds need an HTTP Referer.

## Publish on GitHub Pages

In GitHub Settings → Pages, choose Deploy from a branch, `main`, `/ (root)`. All asset paths are relative.
