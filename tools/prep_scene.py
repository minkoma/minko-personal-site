"""Paint the subject out of the cleaned hero plate.

With the subject gone from the background, the subject PNG becomes a layer that
can move independently of the scene instead of being pinned to the pixels it was
cut from. The lake and the bench are horizontally continuous, so a row-wise
bridge between the nearest unmasked pixels left and right reconstructs them
convincingly at hero scale.
"""

import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERO = os.path.join(ROOT, "assets", "hero")

plate = np.array(Image.open(f"{HERO}/plate.jpg").convert("RGB")).astype(np.float32)
alpha = np.array(Image.open(f"{HERO}/subject.png").split()[-1])
H, W, _ = plate.shape

mask = alpha > 8
for _ in range(10):  # widen past the cutout's soft edge and colour fringe
    p = np.zeros_like(mask)
    p[1:, :] |= mask[:-1, :]
    p[:-1, :] |= mask[1:, :]
    p[:, 1:] |= mask[:, :-1]
    p[:, :-1] |= mask[:, 1:]
    mask |= p

out = plate.copy()
for y in range(H):
    xs = np.nonzero(mask[y])[0]
    if not len(xs):
        continue
    groups, s = [], xs[0]
    for a, b in zip(xs, xs[1:]):
        if b != a + 1:
            groups.append((s, a))
            s = b
    groups.append((s, xs[-1]))
    for x0, x1 in groups:
        cl = out[y, x0 - 1] if x0 - 1 >= 0 else None
        cr = out[y, x1 + 1] if x1 + 1 < W else None
        if cl is None and cr is None:
            continue
        cl = cr if cl is None else cl
        cr = cl if cr is None else cr
        n = x1 - x0 + 1
        t = ((np.arange(n) + 1) / (n + 1))[:, None]
        out[y, x0:x1 + 1] = cl * (1 - t) + cr * t

img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
soft = img.filter(ImageFilter.GaussianBlur(9))
m = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(11))
img = Image.composite(soft, img, m)
img.save(f"{HERO}/scene.jpg", quality=86, optimize=True, progressive=True)
img.resize((480, 270), Image.LANCZOS).save(f"{HERO}/scene-small.jpg", quality=70)
print("wrote scene.jpg")
