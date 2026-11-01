#!/usr/bin/env python3
"""Connected components and dilation for masks too large for the obvious code.

The hero artwork is 6000x3375, so 20 megapixels. Two things that are fine at
1920 stop being fine here:

* A per-pixel flood fill in Python takes minutes. These functions work on
  row RUNS instead, so cost tracks the number of runs (thousands) rather than
  the number of pixels (tens of millions).

* PIL's MaxFilter is O(pixels * kernel area), so a radius-15 dilation is about
  20 billion operations. `dilate` below is separable and doubles its reach each
  pass, so a radius-15 dilation is 8 shifts per axis.

`ImageDraw.floodfill` is not an option: on Pillow 12.2.0 it is still exported
but silently does nothing, leaving the image untouched and raising no error.
"""

import numpy as np


def _runs(mask):
    """Row runs of True. Returns (row, start, end_exclusive) arrays, row-sorted."""
    h, w = mask.shape
    padded = np.zeros((h, w + 2), np.int8)
    padded[:, 1:-1] = mask
    d = np.diff(padded, axis=1)
    sr, sc = np.nonzero(d == 1)
    er, ec = np.nonzero(d == -1)
    # one start pairs with one end, in row-major order, so the arrays align
    return sr, sc, ec


def label(mask):
    """Label 4-connected components.

    Returns (count, sizes, ids) where `ids` is an int32 image of 1-based
    component ids, 0 where mask is False.
    """
    rows, starts, ends = _runs(mask)
    n = len(rows)
    ids = np.zeros(mask.shape, np.int32)
    if n == 0:
        return 0, np.zeros(0, np.int64), ids

    # union-find over runs
    parent = np.arange(n)

    def find(i):
        root = i
        while parent[root] != root:
            root = parent[root]
        while parent[i] != root:
            parent[i], i = root, parent[i]
        return root

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[max(ra, rb)] = min(ra, rb)

    # first run index of each row, so adjacent rows can be swept together
    row_start = np.searchsorted(rows, np.arange(mask.shape[0] + 1))
    for y in range(mask.shape[0] - 1):
        i, j = row_start[y], row_start[y + 1]
        i_end, j_end = row_start[y + 1], row_start[y + 2]
        while i < i_end and j < j_end:
            # runs overlap horizontally -> same component
            if starts[i] < ends[j] and starts[j] < ends[i]:
                union(i, j)
            if ends[i] < ends[j]:
                i += 1
            else:
                j += 1

    roots = np.array([find(i) for i in range(n)])
    uniq, compact = np.unique(roots, return_inverse=True)
    comp = compact + 1

    widths = (ends - starts).astype(np.int64)
    sizes = np.zeros(len(uniq) + 1, np.int64)
    np.add.at(sizes, comp, widths)

    for r, s, e, c in zip(rows, starts, ends, comp):
        ids[r, s:e] = c
    return len(uniq), sizes, ids


def border_components(mask):
    """Components of `mask` that touch the frame edge."""
    count, sizes, ids = label(mask)
    if count == 0:
        return np.zeros(mask.shape, bool)
    edge = np.concatenate([ids[0], ids[-1], ids[:, 0], ids[:, -1]])
    touching = np.unique(edge[edge > 0])
    keep = np.zeros(count + 1, bool)
    keep[touching] = True
    return keep[ids]


def keep_larger_than(mask, min_px):
    """Drop components smaller than min_px."""
    count, sizes, ids = label(mask)
    if count == 0:
        return mask
    keep = sizes >= min_px
    keep[0] = False
    return keep[ids]


def fill_enclosed(mask):
    """Add any False region that cannot reach the frame edge."""
    return ~border_components(~mask)


def dilate(mask, r):
    """Separable binary dilation by a (2r+1) square, in O(log r) passes."""
    if r <= 0:
        return mask
    out = mask
    for axis in (0, 1):
        m = out
        reach, step = 0, 1
        while reach < r:
            step = min(step, r - reach)
            a = np.zeros_like(m)
            b = np.zeros_like(m)
            if axis == 0:
                a[step:, :] = m[:-step, :]
                b[:-step, :] = m[step:, :]
            else:
                a[:, step:] = m[:, :-step]
                b[:, :-step] = m[:, step:]
            m = m | a | b
            reach += step
            step *= 2
        out = m
    return out
