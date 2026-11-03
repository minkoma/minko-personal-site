#!/usr/bin/env python3
"""Turn the camera masters into web MP4s plus a poster frame each.

The films are self-hosted rather than embedded, so every file has to fit
GitHub's limits: a single file over 100 MB is refused outright, over 50 MB
warns, and the whole repository wants to stay near 1 GB. The masters are
2.0 GB (one 4K film alone is 1.27 GB), so they stay out of the repo and this
script writes the delivery copies.

Posters are grabbed from the ENCODED file, not the master, so the still and
the video agree on colour. Minko asked for the first frame; a first frame that
is nearly black (a fade-in) or blown-out white (a title card, which the vlog
opens on) is useless as a cover, so the frame's mean luma is checked and the
next candidate time is tried instead.

The reels are iPhone HLG HDR (arib-std-b67 / BT.2020). This ffmpeg build has
neither zscale nor libplacebo, so there is no true tone-mapping available;
the output is tagged BT.709 and relies on HLG's backwards compatibility,
which these clips survive because they are graded flat already. If a future
clip comes out washed out, install an ffmpeg with libzimg and add
  zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable,
  zscale=t=bt709:m=bt709:r=tv,format=yuv420p

    python3 tools/prep_films.py [--only NAME] [--dry-run]
"""

import argparse
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "assets", "film")
MASTERS = os.path.expanduser("~/Movies/minko-portfolio-masters")

# name, master file, orientation. CRF and fps are per-item: the reels come off
# the phone at 50 and 60 fps, which doubles the bitrate for footage nobody will
# watch frame by frame, and the 5-minute film needs a tighter CRF than a
# 40-second reel to stay inside the budget. First pass at 50 fps and CRF 23 came
# out at 6.3 Mbps and 279 MB total, with the film alone at 99.6 MB — one bad
# estimate away from the 100 MB refusal.
FILMS = [
    # the feature: a real 5-minute film, 4K master
    dict(name="taste-of-home", src="Taste of Home_ Story of Fan-Fan_Final.mp4",
         w=1920, h=1080, fps=30, crf=28, maxrate="2.0M", preset="medium", poster_w=1920),
    # the second landscape film, 1080p50 master off YouTube's download
    dict(name="spend-a-day", src="Spend a Day With Me.mp4",
         w=1920, h=1080, fps=30, crf=28, maxrate="2.0M", preset="medium", poster_w=1920),
    # the reels, all shot vertical on a phone
    dict(name="farmers-market", src="Farmers Market.MOV", w=1080, h=1920, fps=30, crf=28, maxrate="2.6M", poster_w=720),
    dict(name="alumni-awards", src="Alumni Awards.MOV", w=1080, h=1920, fps=30, crf=28, maxrate="2.6M", poster_w=720),
    dict(name="graduation", src="Graduation.MOV", w=1080, h=1920, fps=30, crf=28, maxrate="2.6M", poster_w=720),
    dict(name="skydiving", src="Skydiving.MOV", w=1080, h=1920, fps=30, crf=28, maxrate="2.6M", poster_w=720),
]

POSTER_TIMES = [0, 0.6, 1.5, 3.0, 6.0]  # tried in order until one is real footage
DARK = 26                            # mean luma below this counts as near-black
BRIGHT = 235                         # and above this, a blown-out white title card


def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode:
        sys.exit(f"failed: {' '.join(cmd[:6])}...\n{p.stderr[-1200:]}")
    return p.stdout


def probe(path):
    out = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
               "stream=width,height:format=duration,size", "-of", "json", path])
    d = json.loads(out)
    s, f = d["streams"][0], d["format"]
    return s["width"], s["height"], float(f["duration"]), int(f["size"])


def mean_luma(path):
    """Average Y of a single image, via ffmpeg's signalstats."""
    p = subprocess.run(["ffmpeg", "-v", "info", "-i", path, "-vf", "signalstats,metadata=mode=print:key=lavfi.signalstats.YAVG",
                        "-f", "null", "-"], capture_output=True, text=True)
    for line in p.stderr.splitlines():
        if "YAVG" in line:
            return float(line.rsplit("=", 1)[1])
    return 255.0


def encode(item, dry):
    src = os.path.join(MASTERS, item["src"])
    if not os.path.exists(src):
        sys.exit(f"master not found: {src}")
    dst = os.path.join(OUT, item["name"] + ".mp4")
    poster = os.path.join(OUT, item["name"] + "-poster.jpg")
    sw, sh, dur, size = probe(src)
    print(f"\n{item['name']}: {sw}x{sh} {dur:.0f}s {size/1e6:.0f} MB master")
    if dry:
        return

    # Scale to fit the target box without distorting, and force even dimensions
    # because H.264 4:2:0 cannot encode an odd one.
    vf = (f"scale={item['w']}:{item['h']}:force_original_aspect_ratio=decrease,"
          "scale=trunc(iw/2)*2:trunc(ih/2)*2,"
          f"fps={item['fps']}")
    # A CRF alone let a grainy phone clip reach 6 Mbps; the cap keeps each file
    # predictable, which is what matters against a hard 100 MB limit. bufsize is
    # two seconds of the cap, the usual choice.
    cap = float(item["maxrate"].rstrip("M"))
    run(["ffmpeg", "-y", "-v", "error", "-i", src,
         "-vf", vf,
         "-c:v", "libx264", "-preset", item.get("preset", "slow"), "-crf", str(item["crf"]),
         "-maxrate", item["maxrate"], "-bufsize", f"{cap * 2:g}M",
         "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.1",
         "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
         "-c:a", "aac", "-b:a", "128k", "-ac", "2",
         "-movflags", "+faststart", dst])
    ow, oh, odur, osize = probe(dst)
    print(f"  -> {os.path.basename(dst)}  {ow}x{oh}  {osize/1e6:.1f} MB  "
          f"({osize*8/odur/1e6:.1f} Mbps)")

    for t in POSTER_TIMES:
        run(["ffmpeg", "-y", "-v", "error", "-ss", str(t), "-i", dst, "-frames:v", "1",
             "-vf", f"scale={item['poster_w']}:-2", "-q:v", "3", poster])
        y = mean_luma(poster)
        if DARK <= y <= BRIGHT:
            print(f"  -> poster from t={t}s  (mean luma {y:.0f})  {os.path.getsize(poster)/1024:.0f} KB")
            break
        why = "near-black" if y < DARK else "a white title card"
        print(f"  poster at t={t}s is {why} (mean luma {y:.0f}), trying later")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg not installed: brew install ffmpeg")
    os.makedirs(OUT, exist_ok=True)
    for item in FILMS:
        if args.only and item["name"] != args.only:
            continue
        encode(item, args.dry_run)
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f"\nassets/film total {total/1e6:.0f} MB")


if __name__ == "__main__":
    main()
