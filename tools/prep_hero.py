"""Rebuild the supplied composite hero frame into independent, animatable layers.

Inputs (1920x1080, all RGB, no alpha):
  Minko Ma (2).png  composite  -> scene + arched name behind the subject
  Minko Ma (1).png  cutout     -> subject alone on white
  Minko Ma.png      name plate -> white name on white, only its purple drop shadow is visible

Outputs in assets/hero/:
  plate.jpg        scene with the name painted out (subject still present underneath)
  subject.png      subject with a real alpha channel, full 1920x1080 frame registration
  name.png         white name glyphs with alpha, drop shadow removed
  name-01..n.png   one file per letter, for per-letter animation
  layers.json      geometry every layout needs
"""

import json
import os
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

SRC = "/Users/zichenyu/Desktop/mama photos"
# File naming is not self-describing: "Minko Ma.png" is the subject cutout,
# "Minko Ma (1).png" the name plate, "Minko Ma (2).png" the finished composite.
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "hero")
os.makedirs(OUT, exist_ok=True)

comp = np.array(Image.open(f"{SRC}/Minko Ma (2).png").convert("RGB")).astype(np.int16)
cut = np.array(Image.open(f"{SRC}/Minko Ma.png").convert("RGB")).astype(np.int16)
plate = np.array(Image.open(f"{SRC}/Minko Ma (1).png").convert("RGB")).astype(np.int16)
H, W, _ = comp.shape


def largest_component(mask):
    """Return the largest 4-connected component of a boolean mask."""
    seen = np.zeros(mask.shape, np.int32)
    best, best_size = None, 0
    label = 0
    ys, xs = np.nonzero(mask)
    for sy, sx in zip(ys, xs):
        if seen[sy, sx]:
            continue
        label += 1
        q = deque([(sy, sx)])
        seen[sy, sx] = label
        size = 0
        while q:
            y, x = q.popleft()
            size += 1
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < mask.shape[0] and 0 <= nx < mask.shape[1] and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = label
                    q.append((ny, nx))
        if size > best_size:
            best, best_size = label, size
    return seen == best if best else np.zeros(mask.shape, bool)


def flood_from_border(passable):
    """Flood fill inward from the frame edge through `passable` pixels."""
    out = np.zeros(passable.shape, bool)
    q = deque()
    h, w = passable.shape
    for x in range(w):
        for y in (0, h - 1):
            if passable[y, x] and not out[y, x]:
                out[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if passable[y, x] and not out[y, x]:
                out[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and passable[ny, nx] and not out[ny, nx]:
                out[ny, nx] = True
                q.append((ny, nx))
    return out


def dilate(mask, r):
    m = mask
    for _ in range(r):
        p = np.zeros_like(m)
        p[1:, :] |= m[:-1, :]
        p[:-1, :] |= m[1:, :]
        p[:, 1:] |= m[:, :-1]
        p[:, :-1] |= m[:, 1:]
        m = m | p
    return m


# ---------------------------------------------------------------- subject alpha
# The cutout sits on pure white, so everything reachable from the frame edge
# through near-white pixels is background. Her white dress is enclosed by the
# purple robe, so the fill cannot reach it.
near_white = cut.min(axis=2) >= 248
background = flood_from_border(near_white)
subject = ~background
subject = largest_component(subject)

# Keep interior holes (gaps between robe and arm) only if they are background.
holes = flood_from_border(~subject)
subject = ~holes

alpha = Image.fromarray((subject * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
subject_rgba = np.dstack([cut.astype(np.uint8), np.array(alpha)])
Image.fromarray(subject_rgba, "RGBA").save(f"{OUT}/subject.png")

ys, xs = np.nonzero(subject)
sbox = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]

# ------------------------------------------------------------------ name glyphs
# In the composite the glyph fill is pure white; the pale sky never is.
band = np.zeros((H, W), bool)
band[:470, :] = True
subject_wide = dilate(subject, 3)
glyph = (comp.min(axis=2) >= 247) & band & ~subject_wide

# The purple drop shadow, used both for inpainting and to recover the parts of
# the name the subject覆盖s.
r, g, b = comp[..., 0], comp[..., 1], comp[..., 2]
shadow = band & (b - g > 4) & (r - g > 1) & (b > 110) & (r < 245) & ~subject_wide

# The subject covers part of the lettering in the composite, and the standalone
# name plate cannot give the missing bodies back: its drop-shadow outline is not
# closed, so a fill leaks into the glyph interiors. The strokes are near
# vertical, so bridge each occluded column between the glyph pixels above and
# below it instead.
def bridge(mask, occluded, max_gap=140):
    out = mask.copy()
    for x in range(W):
        col = mask[:, x]
        if not col.any():
            continue
        ys_col = np.nonzero(col)[0]
        for a, b in zip(ys_col, ys_col[1:]):
            gap = b - a
            if 1 < gap <= max_gap and occluded[a + 1:b, x].all():
                out[a + 1:b, x] = True
    return out


name_mask = bridge(glyph, subject_wide | ~band) & band
name_alpha = Image.fromarray((name_mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.5))
name_rgba = np.dstack([np.full((H, W, 3), 255, np.uint8), np.array(name_alpha)])
ys, xs = np.nonzero(name_mask)
nbox = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
Image.fromarray(name_rgba, "RGBA").crop(nbox).save(f"{OUT}/name.png")

# -------------------------------------------------------------- letter slicing
# Each letter is one 8-connected piece of the name mask, except where two
# serifs touch. Those merged pieces are split at their thinnest column, and
# specks left over from the occlusion bridge are dropped.
def components(mask):
    lab = np.zeros(mask.shape, np.int32)
    comps = []
    for sy, sx in zip(*np.nonzero(mask)):
        if lab[sy, sx]:
            continue
        idx = len(comps) + 1
        q = deque([(sy, sx)])
        lab[sy, sx] = idx
        pts = []
        while q:
            y, x = q.popleft()
            pts.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = idx
                        q.append((ny, nx))
        comps.append(np.array(pts))
    return comps


pieces = []
for pts in components(name_mask):
    if len(pts) < 1500:
        continue
    m = np.zeros((H, W), bool)
    m[pts[:, 0], pts[:, 1]] = True
    pieces.append(m)

widths = sorted(int(np.ptp(np.nonzero(p.any(axis=0))[0])) for p in pieces)
median_w = widths[len(widths) // 2]
split = []
for p in pieces:
    cols = np.nonzero(p.any(axis=0))[0]
    x0, x1 = int(cols.min()), int(cols.max()) + 1
    if x1 - x0 > 1.7 * median_w:
        counts = p[:, x0:x1].sum(axis=0)
        lo, hi = int((x1 - x0) * 0.3), int((x1 - x0) * 0.7)
        cut_x = x0 + lo + int(np.argmin(counts[lo:hi]))
        left, right = p.copy(), p.copy()
        left[:, cut_x:] = False
        right[:, :cut_x] = False
        split += [left, right]
    else:
        split.append(p)
split.sort(key=lambda p: int(np.nonzero(p.any(axis=0))[0].min()))

for old in os.listdir(OUT):
    if old.startswith("name-") and old.endswith(".png"):
        os.remove(os.path.join(OUT, old))

letters = []
for i, p in enumerate(split, 1):
    ys, xs = np.nonzero(p)
    x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
    # Pad so the soft edge is not clipped, and keep only this letter's pixels.
    x0, y0 = max(0, x0 - 2), max(0, y0 - 2)
    x1, y1 = min(W, x1 + 2), min(H, y1 + 2)
    own = dilate(p, 2)
    rgba = name_rgba.copy()
    rgba[..., 3] = np.where(own, rgba[..., 3], 0)
    path = f"name-{i:02d}.png"
    Image.fromarray(rgba, "RGBA").crop((x0, y0, x1, y1)).save(f"{OUT}/{path}")
    letters.append({"file": path, "box": [x0, y0, x1, y1]})
print("letters", [l["box"] for l in letters])

# ------------------------------------------------------------------- scene plate
paint = (dilate(glyph, 18) | dilate(shadow, 8)) & ~subject
out = comp.astype(np.float32).copy()
for y in range(H):
    row = paint[y]
    if not row.any():
        continue
    xs = np.nonzero(row)[0]
    # Horizontal inpaint: the strokes are mostly vertical and the scene's
    # structure (horizon, skyline) is horizontal, so bridging left-to-right
    # keeps the skyline intact.
    groups, s = [], xs[0]
    for a, bb in zip(xs, xs[1:]):
        if bb != a + 1:
            groups.append((s, a))
            s = bb
    groups.append((s, xs[-1]))
    for x0, x1 in groups:
        left = x0 - 1
        right = x1 + 1
        cl = out[y, left] if left >= 0 and not row[left] else None
        cr = out[y, right] if right < W and not row[right] else None
        if cl is None and cr is None:
            continue
        if cl is None:
            cl = cr
        if cr is None:
            cr = cl
        n = x1 - x0 + 1
        t = ((np.arange(n) + 1) / (n + 1))[:, None]
        out[y, x0:x1 + 1] = cl * (1 - t) + cr * t

plate_img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
# A blur restricted to the repainted band hides interpolation streaks; at this
# scale it reads as atmospheric haze over the far skyline.
blurred = plate_img.filter(ImageFilter.GaussianBlur(5))
m = Image.fromarray((dilate(paint, 3) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))
plate_img = Image.composite(blurred, plate_img, m)
plate_img.save(f"{OUT}/plate.jpg", quality=88, optimize=True, progressive=True)
plate_img.resize((480, 270), Image.LANCZOS).save(f"{OUT}/plate-small.jpg", quality=70)

json.dump(
    {
        "frame": [W, H],
        "subject": {"file": "subject.png", "box": sbox},
        "name": {"file": "name.png", "box": nbox, "letters": letters},
        "plate": "plate.jpg",
    },
    open(f"{OUT}/layers.json", "w"),
    indent=2,
)
print("subject box", sbox, "name box", nbox)
print("wrote", sorted(os.listdir(OUT)))
