# Minko Ma — Personal website

A concise, responsive marketing portfolio using the supplied rainbow background and reference layouts. Built with plain HTML, CSS, and a small JavaScript enhancement. No dependencies or build step.

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
