#!/usr/bin/env python3
"""Generate a 3D LUT that converts iPhone HLG HDR footage to plain BT.709 SDR.

Why this file exists. The four vertical reels come off the phone as HLG HDR:
BT.2020 primaries, BT.2020 non-constant matrix, arib-std-b67 (HLG) transfer,
10-bit. prep_films.py used to pass `-color_trc bt709 -colorspace bt709` and no
conversion filter, hoping HLG's backwards compatibility would carry it. It did
not. The encoded files came out tagged

    primaries = bt709,  transfer = arib-std-b67,  matrix = bt2020

which is three mutually inconsistent labels: the HLG curve and the BT.2020
matrix survived untouched while only the primaries tag was overwritten. A
browser then decodes HLG values as if they were BT.709, and HLG puts far more
code value into the mid and upper range than BT.709 does, so everything reads
too bright and washed out. That is the "unnatural" look.

The correct fix is a real tone map. ffmpeg's `tonemap` filter needs linear-light
input, which normally comes from `zscale` (libzimg) or `libplacebo`, and the
Homebrew ffmpeg formula ships neither. Rather than compile a custom ffmpeg, this
script does the colour maths in Python once and bakes it into a .cube file,
which the stock `lut3d` filter can apply.

The chain baked into the LUT, in order:

  1. inverse HLG OETF        signal -> scene linear
  2. anchor diffuse white    BT.2100 puts HLG diffuse white at signal 0.75,
                             which the inverse OETF sends to 0.265 of peak.
                             Scaling by 1/0.265 puts diffuse white at exactly
                             1.0 and leaves the peak at 3.77.
  3. BT.2020 -> BT.709       done in LINEAR light, which is the only place a
                             gamut conversion is correct
  4. highlight shoulder      everything below 0.8 is left alone and only what
                             is above it gets compressed, so midtones stay
                             exactly where the phone put them
  5. BT.709 OETF             back to a normal SDR signal

No OOTF step. The HLG OOTF exists to adapt scene light to a bright HDR display;
BT.2408's system gamma for a 100-nit SDR target is 1.0, so applying it here
would only brighten what is already too bright.

A first version did apply the OOTF and then a full Hable curve with an 11.2
white point. That sent HLG diffuse white to 0.42 signal, i.e. it turned white
into mid-grey and the whole clip came out dark. The anchor in step 2 is what
that version was missing.

Run it once; the .cube is committed and prep_films.py applies it per film.

    python3 tools/make_hlg_lut.py [--size 33]
"""

import argparse
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "hlg-to-bt709.cube")

# ARIB STD-B67 / BT.2100 HLG constants
HLG_A = 0.17883277
HLG_B = 0.28466892
HLG_C = 0.55991073

# BT.2100: HLG diffuse white sits at signal 0.75. Everything is scaled so that
# point lands on linear 1.0.
# Calibrated, not taken from the spec. BT.2100 nominally puts HLG diffuse white
# at signal 0.75, and anchoring there lifted this footage badly: measured in the
# browser, a reel went from 112.8 mean luma with 0.85% near-blown pixels to 149
# and 22.5%. The phone exposes so that an ordinary scene already sits high on
# the HLG curve, so the usable anchor is much further up. 0.95 with a knee at
# 0.65 lands on 114 mean and 0.10% blown, against 115.8 and 0.01% for the two
# landscape films that already look right.
#
# Worth knowing what the real defect turned out to be: the reels were not
# mainly too BRIGHT, they were over-SATURATED. Measured mean saturation was
# 0.418 against the reference film's 0.208, because the BT.2020 matrix was
# being decoded as if it were BT.709. The gamut conversion is what fixes that;
# it now measures 0.247.
DIFFUSE_WHITE_SIGNAL = 0.95
KNEE = 0.65          # below this, nothing is touched
SHOULDER = 0.30      # how hard the above-knee range is compressed

# BT.2020 -> BT.709, linear RGB. Product of the BT.2020 RGB->XYZ and the
# inverse BT.709 RGB->XYZ matrices (D65 for both, so no whitepoint adaptation).
M_2020_TO_709 = [
    [1.660491, -0.587641, -0.072850],
    [-0.124550, 1.132900, -0.008349],
    [-0.018151, -0.100579, 1.118730],
]


def hlg_inverse_oetf(e):
    """HLG signal (0..1) -> scene linear, 1.0 being the top of the HLG range."""
    if e <= 0.5:
        return (e * e) / 3.0
    return (math.exp((e - HLG_C) / HLG_A) + HLG_B) / 12.0


def shoulder(v):
    """Identity below the knee, a tanh roll-off above it.

    A full filmic curve would also lift or crush the midtones, which is not
    wanted: the phone's own rendering of the midtones is the thing that looked
    right. Only the above-white range needs compressing."""
    if v <= KNEE:
        return v
    head = (v - KNEE) / (1.0 - KNEE)
    return KNEE + (1.0 - KNEE) * math.tanh(head * SHOULDER)


def bt709_oetf(l):
    if l <= 0.018:
        return 4.5 * l
    return 1.099 * pow(l, 0.45) - 0.099


SCALE = 1.0 / hlg_inverse_oetf(DIFFUSE_WHITE_SIGNAL)


def convert(r, g, b):
    # 1 + 2. HLG signal -> scene linear, with diffuse white at 1.0
    lin = [hlg_inverse_oetf(c) * SCALE for c in (r, g, b)]

    # 3. gamut, in linear light
    out = [sum(M_2020_TO_709[i][j] * lin[j] for j in range(3)) for i in range(3)]
    out = [max(0.0, c) for c in out]

    # 4. compress only what is above diffuse white
    out = [min(1.0, shoulder(c)) for c in out]

    # 5. back to an SDR signal
    return [bt709_oetf(c) for c in out]


def main():
    # Declared before any use: argparse's defaults read these names, and a
    # `global` statement after that point is a syntax error.
    global SCALE, KNEE

    ap = argparse.ArgumentParser()
    ap.add_argument("--size", type=int, default=33)
    ap.add_argument("--white", type=float, default=DIFFUSE_WHITE_SIGNAL,
                    help="HLG signal treated as diffuse white; higher means less lift")
    ap.add_argument("--knee", type=float, default=KNEE,
                    help="below this nothing is touched; lower rolls highlights earlier")
    ap.add_argument("--out", default=OUT)
    args = ap.parse_args()
    n = args.size
    SCALE = 1.0 / hlg_inverse_oetf(args.white)
    KNEE = args.knee

    lines = [
        "# HLG (BT.2100, BT.2020 primaries) -> BT.709 SDR",
        "# Generated by tools/make_hlg_lut.py. Do not edit by hand.",
        f"LUT_3D_SIZE {n}",
        "DOMAIN_MIN 0.0 0.0 0.0",
        "DOMAIN_MAX 1.0 1.0 1.0",
        "",
    ]
    # .cube order: red varies fastest
    for bi in range(n):
        for gi in range(n):
            for ri in range(n):
                r, g, b = ri / (n - 1), gi / (n - 1), bi / (n - 1)
                o = convert(r, g, b)
                lines.append(f"{o[0]:.6f} {o[1]:.6f} {o[2]:.6f}")

    open(args.out, "w").write("\n".join(lines) + "\n")
    print(f"wrote {args.out}  ({n}^3 = {n ** 3} entries)")

    # a couple of sanity points, printed so a change here is visible
    for name, v in [
        ("black", 0.0),
        ("deep shadow", 0.2),
        ("midtone", 0.5),
        ("diffuse white", args.white),
        ("HLG peak", 1.0),
    ]:
        o = convert(v, v, v)
        print(f"  {name:22s} {v:.2f} -> {o[0]:.4f}")


if __name__ == "__main__":
    main()
