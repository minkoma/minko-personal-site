# Minko Ma — Personal website

A concise, responsive marketing portfolio using the supplied rainbow background and reference layouts. Built with plain HTML, CSS, and a small JavaScript enhancement. No dependencies or build step.

## Preview

Run `python3 -m http.server 8000` from this folder and visit http://localhost:8000. Use HTTP preview for embedded videos: YouTube requires an HTTP Referer, which opening an HTML file directly may not supply. The photo gallery can also work from a local file.

## Edit

- `index.html`: About Me and education; glossy glass lettering is applied only to the name Minko Ma.
- `experience.html`: three roles with alternating photo galleries; click images to zoom and browse each role’s photos with PhotoSwipe.
- `portfolio.html`: Video and PPT & Design sections, five embedded players, original-source links, and the design PDF preview/download. No PPT source was supplied yet.
- `fun-facts.html`: a short personal introduction outside work.
- `contact.html`: email, LinkedIn, and a copy-email button.
- `styles.css`: layout, colors, typography, and mobile styling.
- `resume.html`: current résumé, with a Print / Save PDF button.
- `assets/`: original portrait and graphic design portfolio reused from the previous website.

The résumé supplied for this site is the source of truth. Northwestern graduation is listed as expected December 2026. The UCSD Day of Caring total is presented as a campaign total rather than an individual fundraising attribution.

Video links and LinkedIn were carried over from the previous repository. The background is copied from the supplied Background folder; the name effect uses CSS gradients, outlines, and highlights. System fonts keep the site independent of font services. All six pages include the shared navigation and a top-right résumé link. On narrow screens, the navigation scrolls horizontally while the résumé stays visible above it.

## Publish on GitHub Pages

Create an empty GitHub repository, connect this local repository as its remote, commit the files, and push `main`. In GitHub Settings → Pages, choose Deploy from a branch, `main`, and `/ (root)`. All local asset paths are relative so the site supports a project repository URL or a custom domain. No remote or deployment is configured yet.
