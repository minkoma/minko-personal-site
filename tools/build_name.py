#!/usr/bin/env python3
"""Build the hero wordmark from the Canva SVG export.

This replaces the earlier trace_name.py, which reconstructed the letterform by
tracing 1-bit masks because no vector source existed. The Canva export supplies
the real thing: seven glyph outlines, one per letter of MINKO MA, as cubic
paths straight from the font.

Two things about that export matter:

* The glyphs are STRAIGHT. Canva's curve effect is baked into a raster layer in
  the same file, not into the vector paths, so the arch has to be reapplied
  here. That is no loss: bending the text ourselves is what lets each letter be
  a separately animatable element, and the arch becomes a single knob.

* The file also carries two 5668x1176 embedded rasters, the curved name as a
  luminance mask and its colour layer. They are ignored. Only the paths are
  used, so nothing in the output is resampled.

Outputs in assets/hero/:
  name.svg          the whole wordmark, one path set
  name-01..07.svg   one file per letter, for per-letter animation

and prints the geometry for js/content.js.

    python3 tools/build_name.py [--rise 64] [--letters]
"""

import argparse
import json
import math
import os
import re
import xml.etree.ElementTree as ET

SVG_NS = "{http://www.w3.org/2000/svg}"
HERE = os.path.dirname(os.path.abspath(__file__))
HERO = os.path.join(os.path.dirname(HERE), "assets", "hero")
SOURCE = os.path.join(HERO, "Minko Ma (3).svg")

LETTERS = "MINKOMA"
# The Canva canvas is 1440x810 user units shown at 1920x1080. js/content.js
# keeps its geometry in 1920x1080 units, so every length is scaled by this.
UNIT = 1920 / 1440

# Cumulative tracking adjustment per letter, in 1920x1080 units, applied along
# the baseline before the text is bent so the arch stays smooth. The font's own
# fit leaves two pairs tight once the name is drawn at full width: measured box
# clearances were M-I 12 and M-A 9, against 27-47 elsewhere. These open both to
# about 27. Absolute offset does not matter, since the wordmark is refit into
# the artwork's box afterwards.
NUDGE = [0, 15, 15, 15, 15, 15, 33]

# Where the wordmark sits, in 1920x1080 units. This is a DESIGN choice and
# deliberately not the box prep_hero.py measures from the name plate: that box
# is where Canva's own composite put the name, which is larger and lower, running
# from 2.5% to 98% of the frame. Minko asked for it higher and smaller, arcing
# over the skyline above her head rather than across her. Measured from her
# reference screenshot by comparing a render at the same viewport, which avoids
# having to reason about the cover stage's crop. Pass --box to override.
NAME_BOX = [287.2, 174.1, 1640.4, 407.9]


# ------------------------------------------------------------------ path data

def parse_path(d):
    """Into [(cmd, [x, y, ...]), ...]. The export uses absolute M, L, C and Z."""
    tokens = re.findall(r"[MLCZmlcz]|[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?", d)
    out, i = [], 0
    counts = {"M": 2, "L": 2, "C": 6, "Z": 0}
    cmd = None
    while i < len(tokens):
        t = tokens[i]
        if t.upper() in counts:
            cmd = t.upper()
            i += 1
            if cmd == "Z":
                out.append(("Z", []))
            continue
        n = counts[cmd]
        out.append((cmd, [float(v) for v in tokens[i:i + n]]))
        i += n
    return out


def map_path(segments, fn, dec=2):
    """Apply fn to every coordinate pair and re-emit.

    Safe for an affine fn, because a cubic Bezier maps through an affine
    transform by transforming its control points and nothing else.
    """
    f = lambda v: f"{round(v, dec):g}"
    parts = []
    for cmd, vals in segments:
        if cmd == "Z":
            parts.append("Z")
            continue
        pts = []
        for j in range(0, len(vals), 2):
            pts.extend(fn(vals[j], vals[j + 1]))
        parts.append(cmd + " ".join(f(v) for v in pts))
    return "".join(parts)


def path_points(segments, fn, steps=10):
    """Flattened outline, for bounding boxes."""
    out, cur = [], (0.0, 0.0)
    for cmd, vals in segments:
        if cmd == "Z":
            continue
        p = [fn(vals[j], vals[j + 1]) for j in range(0, len(vals), 2)]
        if cmd in ("M", "L"):
            cur = p[0]
            out.append(cur)
        else:
            c1, c2, e = p
            for s in range(1, steps + 1):
                u = s / steps
                v = 1 - u
                out.append((
                    v**3 * cur[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u**3 * e[0],
                    v**3 * cur[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u**3 * e[1],
                ))
            cur = e
    return out


def bbox(points):
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return [min(xs), min(ys), max(xs), max(ys)]


# -------------------------------------------------------------------- reading

def read_glyphs(path):
    """The seven glyph outlines with their baseline origins, left to right.

    Each sits in <g fill="#ffffff"><g transform="translate(x, y)"><g><path>.
    One such group holds no path at all: that is the space between the words,
    and its position is what sets the word gap.
    """
    root = ET.parse(path).getroot()
    glyphs, gap = [], None
    for g in root.iter(SVG_NS + "g"):
        if g.get("fill") != "#ffffff":
            continue
        inner = g.find(SVG_NS + "g")
        if inner is None:
            continue
        m = re.match(r"translate\(([-\d.]+),\s*([-\d.]+)\)", inner.get("transform", ""))
        if not m:
            continue
        x = float(m.group(1))
        node = inner.find(f"./{SVG_NS}g/{SVG_NS}path")
        if node is None:
            gap = x
        else:
            glyphs.append((x, parse_path(node.get("d"))))
    glyphs.sort(key=lambda t: t[0])
    if len(glyphs) != 7:
        raise SystemExit(f"expected 7 glyph outlines, found {len(glyphs)}")
    return glyphs, gap


# --------------------------------------------------------------------- layout

def solve_radius(half_span, rise):
    """Arc radius that drops the ends by `rise` over `half_span` either side."""
    if rise <= 0:
        return math.inf
    r = half_span * half_span / (2 * rise)      # shallow-arc first guess
    for _ in range(60):                          # then solve it properly
        f = r * (1 - math.cos(half_span / r)) - rise
        d = (1 - math.cos(half_span / r)) - (half_span / r) * math.sin(half_span / r)
        if abs(d) < 1e-12:
            break
        r -= f / d
    return r


def bend(x0, radius, centre_x):
    """Transform placing a glyph whose baseline origin is x0 onto the arc.

    The arc centre sits below the text, so the middle stays put and the ends
    swing down and rotate away from it, which is the arch in the artwork.
    Returns a function mapping the glyph's own coordinates onto the layout.
    """
    if radius == math.inf:
        return lambda x, y: (x, y)
    theta = (x0 - centre_x) / radius
    sin, cos = math.sin(theta), math.cos(theta)
    bx = centre_x + radius * sin
    by = radius * (1 - cos)

    def fn(x, y):
        # x, y are the glyph's own coordinates, which already start at its
        # baseline origin; the translate in the export is what positions it.
        return (bx + x * cos - y * sin, by + x * sin + y * cos)
    return fn


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rise", type=float, default=70.0,
                    help="how far the ends drop below the middle, in 1920x1080 "
                         "units. 70 matches the arch in the reference")
    ap.add_argument("--no-nudge", action="store_true",
                    help="use the font's own letterfit, leaving the M and A of "
                         "MA nearly touching as the artwork has them")
    ap.add_argument("--box", type=float, nargs=4, metavar=("X0", "Y0", "X1", "Y1"),
                    default=NAME_BOX,
                    help="where to place the wordmark, in 1920x1080 units; "
                         "defaults to the design position, not the plate's")
    ap.add_argument("--letters", action="store_true",
                    help="also write name-01..07.svg for per-letter animation")
    args = ap.parse_args()

    glyphs, gap = read_glyphs(SOURCE)
    nudge = [0.0] * 7 if args.no_nudge else [n / UNIT for n in NUDGE]
    glyphs = [(x + nudge[i], segs) for i, (x, segs) in enumerate(glyphs)]
    layers = json.load(open(os.path.join(HERO, "layers.json")))
    plate = [v * 1920 / layers["frame"][0] for v in layers["name"]["box"]]
    target = list(args.box)
    print(f"placing into {[round(v, 1) for v in target]}"
          f"   (the plate's own box is {[round(v, 1) for v in plate]})")

    straight = bbox([p for x, segs in glyphs
                     for p in path_points(segs, lambda a, b: (a, b))])
    span = max(x for x, _ in glyphs) - min(x for x, _ in glyphs)
    centre_x = (min(x for x, _ in glyphs) + max(x for x, _ in glyphs)) / 2
    radius = solve_radius(span / 2, args.rise / UNIT)
    print(f"{len(glyphs)} glyphs, word gap at {gap:.1f}, straight span {span:.1f} units")
    print(f"arch: rise {args.rise:.0f} (1920 units) -> radius {radius:.0f} units")

    # bend every glyph, then measure the wordmark as a whole
    bent = [(x, segs, bend(x, radius, centre_x)) for x, segs in glyphs]
    all_pts = [p for x, segs, fn in bent for p in path_points(segs, fn)]
    box = bbox(all_pts)

    # fit that into the box the artwork gives the name, uniformly
    k = (target[2] - target[0]) / (box[2] - box[0])
    tx = target[0] - box[0] * k
    ty = (target[1] + target[3]) / 2 - ((box[1] + box[3]) / 2) * k
    place = lambda fn: (lambda x, y: (lambda p: (p[0] * k + tx, p[1] * k + ty))(fn(x, y)))
    print(f"fit into {[round(v, 1) for v in target]}: scale {k:.4f}")

    final = [(place(fn), segs) for x, segs, fn in bent]
    boxes = [bbox(path_points(segs, fn)) for fn, segs in final]
    whole = bbox([p for fn, segs in final for p in path_points(segs, fn)])

    def write(path, segs_list, fns, viewbox, extra=""):
        x0, y0, x1, y1 = viewbox
        w, h = x1 - x0, y1 - y0
        d = " ".join(map_path(s, lambda a, b: (lambda p: (p[0] - x0, p[1] - y0))(f(a, b)))
                     for f, s in zip(fns, segs_list))
        open(path, "w").write(
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}"'
            f' width="{w:.1f}" height="{h:.1f}"{extra}>'
            f'<path fill="#fff" fill-rule="nonzero" d="{d}"/></svg>\n')

    write(os.path.join(HERO, "name.svg"),
          [s for f, s in final], [f for f, s in final], whole)
    size = os.path.getsize(os.path.join(HERO, 'name.svg')) / 1024
    print(f"\nname.svg  {whole[2]-whole[0]:.0f}x{whole[3]-whole[1]:.0f}  {size:.0f} KB")

    if args.letters:
        for i, ((fn, segs), b) in enumerate(zip(final, boxes), start=1):
            write(os.path.join(HERO, f"name-{i:02d}.svg"), [segs], [fn], b,
                  ' role="img" aria-hidden="true"')
        print(f"wrote {len(final)} per-letter SVGs")

    print("\nfor js/content.js:")
    print(f"    nameBox: [{whole[0]:.1f}, {whole[1]:.1f}, {whole[2]:.1f}, {whole[3]:.1f}],")
    print("    letters: [")
    for i, b in enumerate(boxes, start=1):
        print(f'      {{ src: "assets/hero/name-{i:02d}.svg", '
              f'box: [{b[0]:.1f}, {b[1]:.1f}, {b[2]:.1f}, {b[3]:.1f}] }},'
              f'   // {LETTERS[i-1]}')
    print("    ]")

    # the gaps the old artwork had wrong are worth reporting
    print("\nclearance between adjacent letter boxes (1920 units):")
    print("  " + "  ".join(
        f"{LETTERS[i]}-{LETTERS[i+1]}:{boxes[i+1][0]-boxes[i][2]:+.0f}"
        for i in range(6)))


if __name__ == "__main__":
    main()
