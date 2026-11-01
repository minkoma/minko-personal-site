#!/usr/bin/env python3
"""Rebuild the hero's layers from the supplied 6000x3375 artwork.

Inputs (all 6000x3375 RGB, no alpha), by role rather than by filename, because
the names are not self-describing:

  Minko Ma original.png   the photograph, scene and subject, no lettering
  Minko Ma body.png       the subject alone on pure white
  Minko Ma name.png       the wordmark: white letters on white, only the purple
                          drop shadow is visible, so it carries the name's
                          POSITION but not its shape

Outputs in assets/hero/:
  scene.jpg        the photograph with the subject painted out
  scene-small.jpg  a placeholder for the first paint
  subject.png      the subject with a real alpha channel, frame-registered
  layers.json      the geometry every layout needs

This supersedes the earlier two-step prep_hero.py + prep_scene.py, which
existed because the old artwork supplied a composite with the lettering burned
into the sky: the name had to be painted out to recover a clean scene, and the
subject painted out of that in a second pass. The new photo has no lettering,
so the inpainting that used to touch the sky is gone entirely and only the
subject needs removing.

The name is NOT rebuilt here. The plate's glyph fill is pure white on pure
white, identical to the background, so the letterform is simply not in the
file; only the open drop-shadow outline is. The letterform instead lives in the
vectors under tools/trace_name.py, traced from the old masks, which is lossless
to scale up. What the plate is used for is the name's true bounding box: the
old box was measured from a threshold mask that had caught a sailboat and some
specks, so it carried about 40% empty padding.

    python3 tools/prep_hero.py [--width 3200]
"""

import argparse
import json
import os

import numpy as np
from PIL import Image, ImageFilter

import maskutil as mu

Image.MAX_IMAGE_PIXELS = None

import sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
OUT = os.path.join(os.path.dirname(HERE), "assets", "hero")

# The supplied 6000x3375 artwork, kept in the repo beside its outputs so the
# pipeline is reproducible. Named by role, because the originals arrive with
# names like "Minko Ma (2) (1).png" that say nothing about their contents.
PHOTO = f"{OUT}/Minko Ma original.png"
CUTOUT = f"{OUT}/Minko Ma body.png"
PLATE = f"{OUT}/Minko Ma name.png"

WHITE = 248        # a cutout pixel at or above this on every channel is background
FEATHER = 2        # px of blur on the full-res subject matte
SHADOW_MIN = 600   # drop outline specks below this many px


def load(path):
    a = np.asarray(Image.open(path).convert("RGB"))
    return a


def subject_matte(cutout):
    """The subject as a boolean mask, from a cutout on pure white.

    Her dress is white too, but it is enclosed by the purple robe, so a region
    of near-white that cannot reach the frame edge is part of her, not
    background. That is the whole trick, and it is why this cannot be a simple
    threshold.
    """
    near_white = cutout.min(axis=2) >= WHITE
    subject = ~mu.border_components(near_white)
    subject = mu.fill_enclosed(subject)
    return mu.keep_larger_than(subject, 4000)


def paint_out(photo, mask):
    """Replace the masked region by bridging each row between its edges.

    The lake, the bench and the path are horizontally continuous, so a
    left-to-right ramp reconstructs them well enough for a layer that spends
    its life behind the subject. Only the few pixels the pointer parallax
    uncovers are ever seen.
    """
    out = photo.astype(np.float32).copy()
    h, w, _ = out.shape
    for y in range(h):
        xs = np.nonzero(mask[y])[0]
        if not len(xs):
            continue
        cuts = np.nonzero(np.diff(xs) != 1)[0]
        starts = np.concatenate([[xs[0]], xs[cuts + 1]])
        ends = np.concatenate([xs[cuts], [xs[-1]]])
        for x0, x1 in zip(starts, ends):
            left = out[y, x0 - 1] if x0 > 0 else None
            right = out[y, x1 + 1] if x1 + 1 < w else None
            if left is None and right is None:
                continue
            left = right if left is None else left
            right = left if right is None else right
            n = x1 - x0 + 1
            t = ((np.arange(n) + 1) / (n + 1))[:, None]
            out[y, x0:x1 + 1] = left * (1 - t) + right * t
    return out


def downscale_rgba(rgb, alpha, width):
    """Resize an RGBA image through premultiplied alpha.

    Resizing straight RGBA pulls the background's pure white into every edge
    pixel, which leaves a bright fringe around her once she sits over the lake.
    Premultiplying first keeps the edge colour honest.
    """
    h, w = alpha.shape
    height = round(h * width / w)
    a = alpha.astype(np.float32) / 255.0
    pre = rgb.astype(np.float32) * a[..., None]
    pre_s = np.asarray(Image.fromarray(np.clip(pre, 0, 255).astype(np.uint8))
                       .resize((width, height), Image.LANCZOS)).astype(np.float32)
    a_s = np.asarray(Image.fromarray(alpha).resize((width, height), Image.LANCZOS)
                     ).astype(np.float32) / 255.0
    safe = np.maximum(a_s, 1e-4)[..., None]
    rgb_s = np.clip(pre_s / safe, 0, 255).astype(np.uint8)
    return np.dstack([rgb_s, np.clip(a_s * 255, 0, 255).astype(np.uint8)])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--width", type=int, default=3200,
                    help="WebP output width in px; the 16:9 stage can reach "
                         "roughly 2x the CSS viewport width on a retina screen")
    ap.add_argument("--fallback-width", type=int, default=1920,
                    help="width of the JPEG/PNG fallbacks. Smaller than --width "
                         "on purpose: a browser with no WebP support is old "
                         "enough that resolution is not what it needs, and a "
                         "full-size alpha PNG costs about 1 MB in the repo")
    args = ap.parse_args()

    photo = load(PHOTO)
    cutout = load(CUTOUT)
    plate = load(PLATE)
    H, W, _ = photo.shape
    for name, a in (("cutout", cutout), ("plate", plate)):
        if a.shape != photo.shape:
            raise SystemExit(f"{name} is {a.shape[1]}x{a.shape[0]}, photo is {W}x{H}")
    print(f"sources {W}x{H}")

    # ------------------------------------------------------------- subject
    subject = subject_matte(cutout)
    ys, xs = np.nonzero(subject)
    sbox = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
    print(f"subject bbox {sbox}  ({subject.sum() / 1e6:.2f} Mpx)")

    matte = np.asarray(
        Image.fromarray((subject * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(FEATHER))
    )
    rgba = downscale_rgba(cutout, matte, args.width)
    sub_img = Image.fromarray(rgba, "RGBA")
    # WebP first: this is a photographic cutout with an alpha channel, the case
    # PNG is worst at. At 3200px the PNG is about 1 MB and the WebP under 100 KB
    # for no visible difference. The PNG stays as a fallback.
    sub_img.save(f"{OUT}/subject.webp", quality=90, method=6)
    fb = round(args.fallback_width * sub_img.size[1] / sub_img.size[0])
    sub_img.resize((args.fallback_width, fb), Image.LANCZOS).save(
        f"{OUT}/subject.png", optimize=True)

    # --------------------------------------------------------------- scene
    grown = mu.dilate(subject, 15 * W // 1920)
    scene = paint_out(photo, grown)
    img = Image.fromarray(np.clip(scene, 0, 255).astype(np.uint8))
    soft = img.filter(ImageFilter.GaussianBlur(9 * W // 1920))
    m = Image.fromarray((grown * 255).astype(np.uint8)).filter(
        ImageFilter.GaussianBlur(11 * W // 1920))
    img = Image.composite(soft, img, m)
    height = round(H * args.width / W)
    img = img.resize((args.width, height), Image.LANCZOS)
    img.save(f"{OUT}/scene.webp", quality=86, method=6)
    img.resize((args.fallback_width, round(H * args.fallback_width / W)), Image.LANCZOS).save(
        f"{OUT}/scene.jpg", quality=86, optimize=True, progressive=True)
    img.resize((480, round(480 * H / W)), Image.LANCZOS).save(
        f"{OUT}/scene-small.jpg", quality=70)

    # ---------------------------------------------------------- name bbox
    r, g, b = plate[..., 0].astype(int), plate[..., 1].astype(int), plate[..., 2].astype(int)
    shadow = mu.keep_larger_than((b - g > 6) & (r - g > 2), SHADOW_MIN)
    ys, xs = np.nonzero(shadow)
    nbox = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
    print(f"name bbox    {nbox}  (from the drop-shadow outline)")

    json.dump({
        "frame": [W, H],
        "output_width": args.width,
        "subject": {"file": "subject.png", "box": sbox},
        "name": {
            "box": nbox,
            "note": "measured from the plate's drop-shadow outline; the glyph "
                    "shapes come from tools/trace_name.py, not from the plate",
        },
    }, open(f"{OUT}/layers.json", "w"), indent=2)

    # js/content.js keeps its geometry in 1920x1080 units, independent of how
    # many pixels the images actually carry, because main.js also positions the
    # hotspots in that space. Print the converted values to paste across.
    k = 1920 / W
    fmt = lambda box: "[" + ", ".join(f"{v * k:.1f}" for v in box) + "]"
    print(f"\nfor js/content.js (1920x1080 units):")
    print(f"  subjectBox: {fmt(sbox)}")
    print(f"  nameBox:    {fmt(nbox)}   <- before trace_name.py refits it")

    for f in ("scene.webp", "scene.jpg", "scene-small.jpg", "subject.webp", "subject.png"):
        print(f"  {f:<16}{os.path.getsize(f'{OUT}/{f}') / 1024:8.0f} KB")


if __name__ == "__main__":
    main()
