#!/usr/bin/env python3
"""Rasterise every deck PDF into web-sized WebP slides plus a manifest.

Each PDF in assets/design-album (and assets/design-portfolio.pdf) becomes a
folder of numbered WebP pages, so the site can show slides as plain images
instead of loading a multi-megabyte PDF.

Requires poppler (pdftoppm) and cwebp, both from homebrew:
    brew install poppler webp

Usage:
    python3 tools/prep_decks.py            # render anything missing
    python3 tools/prep_decks.py --force    # re-render everything
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ALBUM = ROOT / "assets" / "design-album"
SLIDES = ALBUM / "slides"
MANIFEST = SLIDES / "manifest.json"

# Rendering settings. 150 DPI on a 1440x810pt page gives a 3000px wide image,
# which we hand to cwebp with a resize down to WIDTH.
DPI = 150
WIDTH = 1600
QUALITY = 82

SOURCES = [
    ("design-portfolio", ROOT / "assets" / "design-portfolio.pdf"),
    ("assignment-3", ALBUM / "assignment-3-minko-ma.pdf"),
    ("imc424-shopper-marketing", ALBUM / "imc424-shopper-marketing.pdf"),
    ("chobani-case", ALBUM / "chobani-case-minko-ma.pdf"),
]


def need(tool: str) -> str:
    path = shutil.which(tool)
    if not path:
        sys.exit(f"missing {tool!r}. install it with: brew install poppler webp")
    return path


def page_count(pdf: Path) -> int:
    out = subprocess.run(
        [need("pdfinfo"), str(pdf)], capture_output=True, text=True, check=True
    ).stdout
    for line in out.splitlines():
        if line.startswith("Pages:"):
            return int(line.split(":", 1)[1].strip())
    raise RuntimeError(f"could not read page count from {pdf}")


def render(slug: str, pdf: Path, force: bool) -> dict:
    out_dir = SLIDES / slug
    pages = page_count(pdf)

    existing = sorted(out_dir.glob("p*.webp"))
    if not force and len(existing) == pages:
        print(f"  {slug}: {pages} pages already rendered, skipping")
        return summarise(slug, pdf, out_dir, pages)

    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)

    print(f"  {slug}: rendering {pages} pages at {DPI} DPI")
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        subprocess.run(
            [need("pdftoppm"), "-r", str(DPI), "-png", str(pdf), str(tmp_path / "page")],
            check=True,
        )
        for i, png in enumerate(sorted(tmp_path.glob("page-*.png")), start=1):
            target = out_dir / f"p{i:02d}.webp"
            subprocess.run(
                [
                    need("cwebp"),
                    "-quiet",
                    "-q", str(QUALITY),
                    "-resize", str(WIDTH), "0",
                    str(png),
                    "-o", str(target),
                ],
                check=True,
            )

    return summarise(slug, pdf, out_dir, pages)


def summarise(slug: str, pdf: Path, out_dir: Path, pages: int) -> dict:
    files = sorted(out_dir.glob("p*.webp"))
    total = sum(f.stat().st_size for f in files)
    return {
        "slug": slug,
        "pdf": str(pdf.relative_to(ROOT)),
        "pages": pages,
        "dir": str(out_dir.relative_to(ROOT)),
        "width": WIDTH,
        "slideBytes": total,
        "pdfBytes": pdf.stat().st_size,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="re-render existing slides")
    args = ap.parse_args()

    SLIDES.mkdir(parents=True, exist_ok=True)
    decks = []
    print("rendering decks:")
    for slug, pdf in SOURCES:
        if not pdf.exists():
            print(f"  {slug}: {pdf} not found, skipping")
            continue
        decks.append(render(slug, pdf, args.force))

    MANIFEST.write_text(json.dumps({"decks": decks}, indent=2) + "\n")

    slides = sum(d["slideBytes"] for d in decks)
    pdfs = sum(d["pdfBytes"] for d in decks)
    print(f"\nwrote {MANIFEST.relative_to(ROOT)}")
    print(f"  {sum(d['pages'] for d in decks)} slides, {slides / 1e6:.1f} MB")
    print(f"  source PDFs: {pdfs / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
