#!/usr/bin/env python3
"""Pull a three-colour "mood" out of every photo in the Bits of me set.

The depth gallery (depth-lab.html) tints its whole background from the photo
you are currently in front of, and blends to the next one as you scroll. That
only looks intentional if the colours actually come from the picture, so this
script reads them rather than asking anyone to pick them.

Method, and why each step is here:

  * k-means (Pillow's ADAPTIVE quantiser) over a downscaled copy. Averaging the
    whole image gives mud every time: a green garden plus a red jacket averages
    to brown, which belongs to neither.
  * The centre of the frame is weighted double, by pasting a centre crop back
    over the thumbnail. The subject is almost always centred in these photos and
    the corners are usually wall, sky or table.
  * Near-black and near-white clusters are dropped before ranking. Phone photos
    carry large flat highlight and shadow regions that win on pixel count while
    saying nothing about the colour of the picture.
  * The background is deliberately NOT the dominant colour: it is the dominant
    hue pushed DARK and desaturated, because a full-strength colour behind the
    planes fights the photo. Dark rather than pale for two reasons: the label
    layer is small white type with no panel behind it, which needs a dark field
    to read against, and a lit photograph on a dark ground reads as a projected
    slide rather than a print on paper. The two blob colours keep more of their
    real saturation, since they only ever appear as soft out-of-focus shapes.

Output is js/photo-moods.js, a plain global so the scratch page needs no
bundler and no fetch (a fetch would also break opening the page off file://).

    python3 tools/photo_moods.py
"""

import colorsys
import json
import os
import re
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("needs Pillow: python3 -m pip install Pillow")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "js", "photo-moods.js")

# The depth gallery runs on a hand-picked subset, not the whole board: ten
# photos chosen by Minko and dropped in this folder. Reading the folder rather
# than content.js means she can swap a picture by replacing a file.
PICKS = os.path.join(ROOT, "assets", "aboutme", "web", "12 picks")

# Explicit running order. Only the names that need to break out of alphabetical
# order have to appear; the twins are listed because the set should close on
# 3, 4, 1 rather than 1, 3, 4.
ORDER = ["twin3.jpg", "twin4.JPG", "twin1.jpg"]

# Filename prefix -> the interest key, which is how a photo finds its story in
# content.js. Longest prefix wins, so "cross-stitch" beats "c".
KEY_BY_PREFIX = [
    ("cross-stitch", "crafts"),
    ("crochet", "crafts"),
    ("calligraphy", "crafts"),
    ("craft", "crafts"),
    ("foster", "cats"),
    ("foodie", "food"),
    ("ballet", "ballet"),
    ("twin", "twins"),
    ("shelliemay", "bear"),
    ("me-forky", "forky"),
    ("make-coffee", "coffee"),
    ("travel", "travel"),
]

# The site's own accents, used for the light "dreamy" palette.
SITE_PLUM = (0x7c, 0x5c, 0xc4)
SITE_PLUM_DEEP = (0x4f, 0x3a, 0x86)
SITE_PAPER = (0xf6, 0xef, 0xe3)

THUMB = 160          # analysis size; detail beyond this changes nothing
CLUSTERS = 8
DARK, LIGHT = 0.16, 0.90   # luma bounds for a cluster worth considering


# A nearest-match Pantone Coated table. Small on purpose: it only has to name
# the accent colour plausibly, and a full Pantone book is licensed data. Values
# are the widely published sRGB approximations, and the match is made in CIELAB
# so "nearest" means nearest to the eye rather than nearest in RGB.
PMS_TABLE = [
    ("PMS 100 C", "#F6EB61"), ("PMS 109 C", "#FFD100"), ("PMS 123 C", "#FFC72C"),
    ("PMS 135 C", "#FDDA63"), ("PMS 137 C", "#FFA300"), ("PMS 144 C", "#ED8B00"),
    ("PMS 151 C", "#FF8200"), ("PMS 158 C", "#E87722"), ("PMS 165 C", "#FF671F"),
    ("PMS 172 C", "#FA4616"), ("PMS 179 C", "#E03C31"), ("PMS 186 C", "#C8102E"),
    ("PMS 193 C", "#BF0D3E"), ("PMS 200 C", "#BA0C2F"), ("PMS 207 C", "#A50034"),
    ("PMS 214 C", "#CE0058"), ("PMS 221 C", "#A50050"), ("PMS 228 C", "#840B55"),
    ("PMS 234 C", "#A10070"), ("PMS 241 C", "#B5007D"), ("PMS 248 C", "#9B3259"),
    ("PMS 255 C", "#772583"), ("PMS 262 C", "#51284F"), ("PMS 269 C", "#512D6D"),
    ("PMS 276 C", "#2F2A5A"), ("PMS 283 C", "#8BB8E8"), ("PMS 290 C", "#B9D9EB"),
    ("PMS 297 C", "#71C5E8"), ("PMS 304 C", "#9ADBE8"), ("PMS 311 C", "#0ABBB5"),
    ("PMS 318 C", "#8EDBD7"), ("PMS 325 C", "#5BC2B7"), ("PMS 332 C", "#8CE2D0"),
    ("PMS 339 C", "#00B388"), ("PMS 346 C", "#71CC98"), ("PMS 353 C", "#8FE9B0"),
    ("PMS 360 C", "#6CC24A"), ("PMS 367 C", "#A4D65E"), ("PMS 374 C", "#C5E86C"),
    ("PMS 381 C", "#D0DF00"), ("PMS 388 C", "#DBE442"), ("PMS 395 C", "#ECE81A"),
    ("PMS 402 C", "#B7B09C"), ("PMS 409 C", "#9A9384"), ("PMS 416 C", "#8E9089"),
    ("PMS 423 C", "#939598"), ("PMS 430 C", "#7C878E"), ("PMS 437 C", "#80667A"),
    ("PMS 444 C", "#7C8B8F"), ("PMS 451 C", "#A69F88"), ("PMS 458 C", "#DDCBA4"),
    ("PMS 465 C", "#C6AA76"), ("PMS 472 C", "#E8B88A"), ("PMS 479 C", "#A1724F"),
    ("PMS 486 C", "#E8927C"), ("PMS 493 C", "#D6A2AD"), ("PMS 500 C", "#CE8E9A"),
    ("PMS 507 C", "#D8A1C4"), ("PMS 514 C", "#D48BC8"), ("PMS 521 C", "#B288B9"),
    ("PMS 528 C", "#9B5BA5"), ("PMS 535 C", "#9FAEE5"), ("PMS 542 C", "#7BAFD4"),
    ("PMS 549 C", "#6BA4B8"), ("PMS 556 C", "#85B09A"), ("PMS 563 C", "#6ECEB2"),
    ("PMS 570 C", "#64CCC9"), ("PMS 577 C", "#C4D6A4"), ("PMS 584 C", "#D2D755"),
    ("PMS 591 C", "#B3BF00"), ("PMS 598 C", "#D7D700"), ("PMS Black 7 C", "#3E3C39"),
    ("PMS Warm Gray 8 C", "#8C8279"), ("PMS Cool Gray 6 C", "#A7A8AA"),
]

# Plain-English colour names, picked by hue with saturation and lightness
# deciding between a vivid and a muted word for the same hue.
HUE_WORDS = [
    (12, "crimson"), (24, "coral"), (38, "amber"), (50, "golden"),
    (66, "citron"), (85, "olive"), (105, "fern"), (140, "jade"),
    (168, "seafoam"), (186, "teal"), (200, "sky"), (216, "azure"),
    (232, "periwinkle"), (252, "indigo"), (272, "violet"), (288, "orchid"),
    (306, "magenta"), (324, "fuchsia"), (340, "rose"), (352, "blush"),
    (360, "crimson"),
]
MUTED_WORDS = {
    "crimson": "brick", "coral": "clay", "amber": "caramel", "golden": "sand",
    "citron": "moss", "olive": "khaki", "fern": "sage", "jade": "eucalypt",
    "seafoam": "mist", "teal": "slate", "sky": "haze", "azure": "denim",
    "periwinkle": "dusk", "indigo": "ink", "violet": "plum", "orchid": "mauve",
    "magenta": "wine", "fuchsia": "berry", "rose": "dusty rose", "blush": "shell",
}


def srgb_to_lab(rgb):
    def inv(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else pow((c + 0.055) / 1.055, 2.4)

    r, g, b = [inv(c) for c in rgb]
    x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
    y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883

    def f(t):
        return pow(t, 1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116

    fx, fy, fz = f(x), f(y), f(z)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


def nearest_pms(hexcode):
    lab = srgb_to_lab(hex_rgb(hexcode))
    best, bestd = None, 1e9
    for name, hx in PMS_TABLE:
        l2 = srgb_to_lab(hex_rgb(hx))
        d = sum((lab[i] - l2[i]) ** 2 for i in range(3))
        if d < bestd:
            best, bestd = name, d
    return best


def colour_word(hexcode):
    h, s, l = hsl(hex_rgb(hexcode))
    deg = h * 360
    word = next(w for limit, w in HUE_WORDS if deg <= limit)
    # a washed-out or very dark colour gets the muted synonym instead
    if s < 0.45 or l < 0.35:
        word = MUTED_WORDS.get(word, word)
    return word


def to_cmyk(hexcode):
    """The naive device conversion, which is what a colour chip like this one
    shows. Not an ICC/profile-aware separation, so it is indicative only."""
    r, g, b = [c / 255 for c in hex_rgb(hexcode)]
    k = 1 - max(r, g, b)
    if k >= 1:
        return (0, 0, 0, 100)
    c = (1 - r - k) / (1 - k)
    m = (1 - g - k) / (1 - k)
    y = (1 - b - k) / (1 - k)
    return tuple(int(round(v * 100)) for v in (c, m, y, k))


def chip(hexcode):
    r, g, b = hex_rgb(hexcode)
    return {
        "word": colour_word(hexcode),
        "hex": hexcode.lstrip("#").upper(),
        "rgb": f"{r}, {g}, {b}",
        "cmyk": ", ".join(str(v) for v in to_cmyk(hexcode)),
        "pms": nearest_pms(hexcode),
    }


def key_for(name):
    low = name.lower()
    for prefix, key in KEY_BY_PREFIX:
        if low.startswith(prefix):
            return key
    return "other"


def picks():
    """The chosen photos, in ORDER where it names them and filename order for
    anything it does not."""
    if not os.path.isdir(PICKS):
        sys.exit("missing folder: " + PICKS)
    files = [f for f in os.listdir(PICKS) if f.lower().endswith((".jpg", ".jpeg", ".png"))]
    # Alphabetical order put the twins in 1, 3, 4; Minko wants the set to end
    # 3, 4, 1. Named files sort AFTER everything else, in the order named here.
    files.sort(key=lambda f: (1, ORDER.index(f)) if f in ORDER else (0, f.lower()))
    rel = os.path.relpath(PICKS, ROOT).replace(os.sep, "/")
    out = []
    for f in files:
        # The folder name contains a space, so the path has to be URL-encoded
        # for the browser; an unencoded space in a texture URL silently 404s.
        out.append((key_for(f), rel.replace(" ", "%20") + "/" + f, os.path.join(PICKS, f)))
    return out


def clusters(path):
    im = Image.open(path).convert("RGB")
    im.thumbnail((THUMB, THUMB))
    w, h = im.size
    # weight the middle: paste a centre crop back over the thumbnail
    cx, cy = int(w * 0.25), int(h * 0.25)
    centre = im.crop((cx, cy, w - cx, h - cy)).resize((w // 2, h // 2))
    im.paste(centre, (w // 4, h // 4))

    q = im.quantize(colors=CLUSTERS, method=Image.Quantize.FASTOCTREE)
    pal = q.getpalette()[: CLUSTERS * 3]
    # getcolors() yields (count, palette_index) pairs, in that order. Building
    # the dict the other way round silently keys it by count, every lookup
    # misses, and every photo falls back to the same default palette.
    counts = {idx: n for n, idx in (q.getcolors() or [])}
    out = []
    for i in range(CLUSTERS):
        rgb = tuple(pal[i * 3 : i * 3 + 3])
        n = counts.get(i, 0)
        if n:
            out.append((n, rgb))
    out.sort(reverse=True)
    return out


def hsl(rgb):
    r, g, b = [c / 255 for c in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return h, s, l


def hexof(rgb):
    return "#%02x%02x%02x" % tuple(max(0, min(255, int(round(c)))) for c in rgb)


def from_hsl(h, s, l):
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return hexof((r * 255, g * 255, b * 255))


def mix(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


# A dreamy sweep through the site's own register: lilac, periwinkle, blush,
# lavender, sky. The ten picks are almost all warm indoor photographs, so their
# dominant hues sit between 338 and 347 degrees — deriving the light background
# from the photo alone gave ten near-identical creams. The ramp spreads them
# instead, and each photo's own hue then pulls its stop off the ramp, so the
# background still answers to the picture without all ten looking the same.
DREAM_HUES = [268, 246, 330, 286, 206, 258, 316, 232, 294, 344]


def light_palette(h1, s1, l1, h2, s2, l2, idx=0):
    """The dreamy variant, in the site's own colours.

    The dark palette is a shade of the photograph. This one is the opposite
    construction: start from the site's paper white, and let the photo only
    TINT it, with the site's plum mixed into every blob. That keeps ten very
    different photographs inside one family so the page still looks like the
    rest of the site, instead of swinging from blue to brown to magenta.
    """
    # A first attempt mixed 45% paper into the field and 50% plum into the
    # blobs. That produced the same #f5f2ec / #aa96c2 for all ten photographs:
    # the whole point, a background that drifts with the picture, was averaged
    # away. These weights are much lighter, so the photo's hue survives and the
    # plum only unifies.
    # the stop on the ramp, pulled a quarter of the way toward the photo's hue
    base = DREAM_HUES[idx % len(DREAM_HUES)] / 360.0
    d = h1 - base
    if d > 0.5:
        d -= 1.0
    elif d < -0.5:
        d += 1.0
    hue = (base + d * 0.25) % 1.0
    hue2 = (hue + 0.085) % 1.0

    return {
        # white with the faintest wash of the stop's colour
        "background": hexof(mix(hex_rgb(from_hsl(hue, 0.42, 0.955)), SITE_PAPER, 0.22)),
        # the blobs carry the colour: pale, soft, and clearly different per photo
        "blob1": hexof(mix(hex_rgb(from_hsl(hue, 0.52, 0.80)), SITE_PLUM, 0.22)),
        "blob2": hexof(mix(hex_rgb(from_hsl(hue2, 0.44, 0.86)), SITE_PLUM_DEEP, 0.12)),
        # dark enough to read as text on the near-white field
        "accent": from_hsl(hue, 0.5, 0.40),
    }


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def mood(path, idx=0):
    cs = clusters(path)
    if not cs:
        return {"background": "#efe6d8", "blob1": "#d9c3a5", "blob2": "#b9a68c"}

    # usable = not nearly black, not nearly white, and actually coloured
    usable = [(n, c) for n, c in cs if DARK < hsl(c)[2] < LIGHT and hsl(c)[1] > 0.12]
    ranked = usable or cs

    lead = ranked[0][1]
    h1, s1, l1 = hsl(lead)

    # second colour: the most different hue available, so the two blobs are not
    # the same colour twice. Hue distance is circular.
    def hue_gap(c):
        d = abs(hsl(c)[0] - h1)
        return min(d, 1 - d)

    rest = sorted(ranked[1:], key=lambda nc: -hue_gap(nc[1]))
    second = rest[0][1] if rest else lead
    h2, s2, l2 = hsl(second)

    return {
        # deep shade of the lead hue: keeps the photo's colour, loses the fight
        "background": from_hsl(h1, min(0.34, max(0.12, s1 * 0.6)), max(0.07, min(0.15, l1 * 0.16 + 0.05))),
        # the blobs are the only places the real colour appears at strength,
        # and they sit well above the background so the gradient is visible
        "blob1": from_hsl(h1, min(0.62, max(0.28, s1 * 0.9)), min(0.42, max(0.24, l1 * 0.5))),
        "blob2": from_hsl(h2, min(0.58, max(0.24, s2 * 0.9)), min(0.34, max(0.18, l2 * 0.45))),
        # one bright accent, used for the colour chip in the label layer
        "accent": from_hsl(h1, min(0.80, max(0.40, s1)), min(0.72, max(0.55, l1))),
        # the light alternative, which is the page's default
        "light": light_palette(h1, s1, l1, h2, s2, l2, idx),
    }


def main():
    rows = []
    for key, rel, path in picks():
        with Image.open(path) as probe:
            w, h = probe.size
        m = mood(path, len(rows))
        m["chip"] = chip(m["accent"])
        m["light"]["chip"] = chip(m["light"]["accent"])
        rows.append({"key": key, "src": rel, "ar": round(w / h, 4), **m})
        c = m["light"]["chip"]
        print(f"{os.path.basename(path):26s} {key:7s}  {c['word']:11s} "
              f"#{c['hex']}  {c['pms']:20s} CMYK {c['cmyk']}")

    body = json.dumps(rows, indent=2, ensure_ascii=False)
    open(OUT, "w").write(
        "/* Generated by tools/photo_moods.py — do not edit by hand.\n"
        "   One palette per photo, read out of the photo itself, plus its\n"
        "   aspect ratio so the 3D plane is never stretched. Rerun the script\n"
        "   after changing the photo set in content.js. */\n"
        "window.PHOTO_MOODS = " + body + ";\n"
    )
    print(f"\n{len(rows)} photos -> js/photo-moods.js")


if __name__ == "__main__":
    main()
