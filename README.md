# Minko Ma — Personal website

A concise, responsive marketing portfolio using the supplied rainbow background and reference layouts. Built with plain HTML, CSS, and a small JavaScript enhancement. No dependencies or build step.

## Three scroll-driven versions

`versions.html` is the chooser. Open it first.

| Path | Name | Character |
| --- | --- | --- |
| `v1/` | Lakeside Editorial | Daylight, serif display, sticky card stack, side-scrolling design shelf |
| `v2/` | Kinetic Noir | Near-black, oversized grotesque, pinned hero handoff, coverflow films, drag strip |
| `v3/` | Paper Scrapbook | Paper grain, tape and handwriting, no top bar. The hero photo drops in and develops, then the name lands letter by letter and stays pokeable. Path steps alternate a note and a big photo collage. "Bits of me" uses shaped photos and hides nine easter eggs |

All three read the same content and the same hero artwork, so the only difference is design and motion.

- `data/minko.js` — every piece of content (profile, education, work, skills, videos, design decks, interests). Edit here and all three versions change. Résumé content is authoritative.
- `shared/motion.js` — all the effects, each switched on by a data attribute: smooth scroll (Lenis), split-text reveals, section reveals, parallax, counters, velocity marquee, pinned horizontal rails, sticky stacks, scrubbed pinned scenes, word-by-word highlight, custom cursor and trail, magnetic buttons, 3D tilt, scroll progress, section nav, lightbox, draggable rows, preloader.
- `shared/base.css` — resets, hero layer registration, cursor, lightbox, reduced-motion and no-JS fallbacks.
- `v1/`, `v2/`, `v3/` — one `index.html`, one stylesheet, one script each. The HTML holds the section shells; the script renders the items from `data/minko.js`.

### The hero

The supplied artwork arrived as three flat 1920×1080 frames. `tools/prep_hero.py` and `tools/prep_scene.py` rebuild them into independent layers in `assets/hero/`:

- `scene.jpg` — the shoreline with both the lettering and the subject painted out, so the background can move on its own.
- `name.png` — the white lettering with a real alpha channel, reconstructed from the composite and bridged back across the parts her arm covers. The purple drop shadow is reapplied in CSS so it can be animated.
- `name-01…07.png` — the same lettering cut into its seven letters (M, I, N, K, O, M, A). v3 animates each one separately; the boxes live in `data/minko.js` under `hero.letters`.
- `subject.png` — the cut-out, keyed from the white-background frame and keeping the original frame registration.
- `layers.json` — the measured geometry, mirrored into `data/minko.js`.

All three layers share one 16:9 stage sized like `background-size: cover`, which is what keeps them in register at any viewport and lets the name pass behind her. On a portrait screen the stage letterboxes instead of cropping, so the full name stays readable.

### Review helpers

Append `?static=1` to any version URL to render it finished and motionless; add `&flat=1` to also shorten the hero so one screenshot captures the whole page. `?fast=1` runs every animation 40× faster, which lets a headless screenshot catch the end of the intro.

## Preview

Double-click `Preview.command`, or run `python3 preview.py`. This starts a persistent localhost-only server and opens the portfolio. It verifies the server belongs to this website and chooses another port if 8000 is occupied. Closing the launcher does not stop the preview. Use `python3 preview.py --no-open` to start it without opening a browser. Logs are stored as `minko-preview-PORT.log` in the system temporary folder.

Use HTTP preview for embedded videos: YouTube requires an HTTP Referer, which opening an HTML file directly may not supply. Opening a local HTML file no longer forcibly redirects to a potentially unavailable server.

## Edit

- `index.html`: the full single-page site — About Me, Experience, Video Portfolio, Design Portfolio, Beyond the Résumé, and Contact, all in one file. Glossy glass lettering is applied only to the name Minko Ma. Experience uses alternating photo galleries with PhotoSwipe zoom; the portfolio has five embedded players with original-source links and the design PDF preview/download; Beyond the Résumé holds the personal flip cards; Contact has email, LinkedIn, and a copy-email button.
- `styles.css`: layout, colors, typography, and mobile styling.
- `resume.html`: current résumé, with a Print / Save PDF button.
- `assets/`: original portrait and graphic design portfolio reused from the previous website.

The résumé supplied for this site is the source of truth. Northwestern graduation is listed as expected December 2026. The UCSD Day of Caring total is presented as a campaign total rather than an individual fundraising attribution.

Video links and LinkedIn were carried over from the previous repository. The background is copied from the supplied Background folder; the name effect uses CSS gradients, outlines, and highlights. System fonts keep the site independent of font services. The single-page site and the résumé page share the same navigation and a top-right résumé link. On narrow screens, the navigation scrolls horizontally while the résumé stays visible above it.

## Publish on GitHub Pages

Create an empty GitHub repository, connect this local repository as its remote, commit the files, and push `main`. In GitHub Settings → Pages, choose Deploy from a branch, `main`, and `/ (root)`. All local asset paths are relative so the site supports a project repository URL or a custom domain. No remote or deployment is configured yet.
