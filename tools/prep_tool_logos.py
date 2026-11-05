#!/usr/bin/env python3
"""Fetch each tool's real, full-colour logo and vendor it into assets/tools/.

The scratch page (tools-lab.html) drew these from simple-icons, which ships
single-path monochrome silhouettes that then get tinted with CSS. That is what
read as "vector" rather than as the real logos. This script pulls the actual
multi-colour marks instead.

Sources, tried in order per tool:

  1. gilbarbara/logos via jsDELIVR — full-colour official marks, the collection
     most sites use for this.
  2. vectorlogo.zone — colour "-icon" variants, good coverage of the brands
     gilbarbara is missing.
  3. Apple's public App Store search endpoint, for the nine brands neither
     collection publishes. It returns each app's official 512px artwork, so
     Final Cut Pro, iMovie, CapCut and the rest get their real icons without
     installing or buying anything. These come back as PNG rather than SVG,
     which is fine: they are app icons, drawn at a fixed size anyway.

Downloaded once and committed, because nothing on this site loads a CDN at
runtime. The files are each brand's own trademark; they are used here to say
which tools Minko works in, which is nominative use, and no logo is altered.

Any tool left without a file is reported at the end so it can be handled by
hand rather than silently falling back to a letter tile.

    python3 tools/prep_tool_logos.py
"""

import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "assets", "tools")

GB = "https://cdn.jsdelivr.net/gh/gilbarbara/logos/logos/{}.svg"
VLZ = "https://www.vectorlogo.zone/logos/{0}/{0}-icon.svg"
VLZ_PLAIN = "https://www.vectorlogo.zone/logos/{0}/{0}-ar21.svg"

# slug used on this site -> candidate URLs, best first
TOOLS = {
    "capcut": [GB.format("capcut"), VLZ.format("capcut")],
    "final-cut-pro": [GB.format("final-cut-pro"), VLZ.format("apple_finalcutpro"),
                      GB.format("apple-final-cut-pro")],
    "premiere-pro": [GB.format("adobe-premiere"), VLZ.format("adobe_premiere")],
    "imovie": [GB.format("imovie"), VLZ.format("apple_imovie")],
    "vimeo": [GB.format("vimeo-icon"), GB.format("vimeo"), VLZ.format("vimeo")],

    "canva": [GB.format("canva"), VLZ.format("canva")],
    "photoshop": [GB.format("adobe-photoshop"), VLZ.format("adobe_photoshop")],
    "figma": [GB.format("figma"), VLZ.format("figma")],

    "wordpress": [GB.format("wordpress-icon"), GB.format("wordpress"), VLZ.format("wordpress")],
    "wix": [GB.format("wix"), VLZ.format("wix")],
    "shopify": [GB.format("shopify"), VLZ.format("shopify")],
    "github": [GB.format("github-icon"), VLZ.format("github")],

    "meta-ads": [GB.format("meta-icon"), GB.format("meta"), VLZ.format("meta")],
    "google-ads": [GB.format("google-ads"), VLZ.format("google_ads")],
    "semrush": [GB.format("semrush-icon"), GB.format("semrush"), VLZ.format("semrush")],
    "hubspot": [GB.format("hubspot"), VLZ.format("hubspot")],
    "keap": [GB.format("keap"), VLZ.format("keap"), VLZ.format("infusionsoft")],

    "google-analytics": [GB.format("google-analytics"), VLZ.format("google_analytics")],
    "sprout-social": [GB.format("sprout-social"), VLZ.format("sproutsocial")],
    "tableau": [GB.format("tableau-icon"), GB.format("tableau"), VLZ.format("tableau")],
    "brandwatch": [GB.format("brandwatch"), VLZ.format("brandwatch")],
    "later": [GB.format("later"), VLZ.format("later")],
    "excel": [GB.format("microsoft-excel"), VLZ.format("microsoft_excel")],
}


def appstore(term, want, entity="software,macSoftware"):
    """Official App Store artwork URL for an app, matched by exact name.

    The top search hit is often the wrong product — searching "Final Cut Pro"
    returns "Final Cut Camera" first — so the exact track name is required and
    only falls back to the first hit if nothing matches.
    """
    import json
    import urllib.parse

    url = ("https://itunes.apple.com/search?term="
           + urllib.parse.quote(term)
           + f"&entity={entity}&limit=20")
    r = subprocess.run(["curl", "-sfL", "--max-time", "20", url], capture_output=True)
    if r.returncode != 0:
        return None
    try:
        results = json.loads(r.stdout).get("results", [])
    except ValueError:
        return None
    exact = [x for x in results if x.get("trackName", "").lower() == want.lower()]
    starts = [x for x in results if x.get("trackName", "").lower().startswith(want.lower())]
    pick = (exact or starts or results)
    if not pick:
        return None
    art = pick[0].get("artworkUrl512") or pick[0].get("artworkUrl100")
    if not art:
        return None
    # The URL ends "/512x512bb.jpg" and really does serve JPEG; mzstatic
    # honours the extension, so ask for PNG instead and keep the alpha.
    if art.endswith(".jpg"):
        art = art[:-4] + ".png"
    return art


# slug -> (search term, exact app name) for the brands no logo collection has
APPSTORE = {
    "final-cut-pro": ("Final Cut Pro", "Final Cut Pro"),
    "imovie": ("iMovie", "iMovie"),
    "capcut": ("CapCut", "CapCut: Photo & Video Editor"),
    "excel": ("Microsoft Excel", "Microsoft Excel"),
    "later": ("Later social media", "Later: Social Media Scheduler"),
    "sprout-social": ("Sprout Social", "Sprout Social"),
    "brandwatch": ("Brandwatch", "Brandwatch"),
    "keap": ("Keap", "Keap"),
    "semrush": ("Semrush", "Semrush"),
}


def fetch(url, dest):
    """Return True if the URL gave us something that is actually an SVG."""
    r = subprocess.run(
        ["curl", "-sfL", "--max-time", "20", "-o", dest, url],
        capture_output=True,
    )
    if r.returncode != 0 or not os.path.exists(dest):
        return False
    if os.path.getsize(dest) < 120:
        os.remove(dest)
        return False
    head = open(dest, "rb").read(400)
    if dest.endswith(".svg") and b"<svg" not in head.lower():
        os.remove(dest)
        return False
    if dest.endswith(".png") and not (head.startswith(b"\x89PNG") or head.startswith(b"\xff\xd8")):
        os.remove(dest)
        return False
    return True


def main():
    os.makedirs(OUT, exist_ok=True)
    got, missing = [], []
    for slug, urls in TOOLS.items():
        dest = os.path.join(OUT, slug + ".svg")
        have = [dest, os.path.join(OUT, slug + ".png")]
        existing = next((f for f in have if os.path.exists(f) and os.path.getsize(f) > 120), None)
        if existing:
            got.append((slug, "already present", os.path.getsize(existing)))
            continue
        found = False
        for url in urls:
            if fetch(url, dest):
                got.append((slug, url.split("/")[-3] + "/" + url.split("/")[-1],
                            os.path.getsize(dest)))
                found = True
                break
        if found:
            continue

        # neither collection had it: ask the App Store for the real app icon
        if slug in APPSTORE:
            term, want = APPSTORE[slug]
            art = appstore(term, want)
            png = os.path.join(OUT, slug + ".png")
            if art and fetch(art, png):
                got.append((slug, "App Store artwork", os.path.getsize(png)))
                continue
        missing.append(slug)

    for slug, src, size in got:
        print(f"  {slug:18s} {size/1024:6.1f} KB   {src}")
    print(f"\n{len(got)} logos in assets/tools/")
    if missing:
        print("没拿到(需要手动补一个 SVG 放进 assets/tools/):")
        for m in missing:
            print("  - " + m + ".svg")


if __name__ == "__main__":
    main()
