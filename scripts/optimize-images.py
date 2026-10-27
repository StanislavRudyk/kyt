#!/usr/bin/env python3
"""Generate responsive WebP derivatives for the source car photos."""

from pathlib import Path

from PIL import Image


IMAGE_DIR = Path(__file__).resolve().parents[1] / "assets" / "images"
TARGET_WIDTHS = (480, 800)
QUALITY = 80


def main():
    for source in sorted(IMAGE_DIR.glob("*.jpg")):
        with Image.open(source) as image:
            image = image.convert("RGB")
            widths = sorted({min(width, image.width) for width in TARGET_WIDTHS} | {image.width})
            for width in widths:
                destination = source.with_name(f"{source.stem}-{width}.webp")
                if destination.exists() and destination.stat().st_mtime >= source.stat().st_mtime:
                    continue
                resized = image if width == image.width else image.resize(
                    (width, round(image.height * width / image.width)), Image.Resampling.LANCZOS
                )
                resized.save(destination, "WEBP", quality=QUALITY, method=6)
                print(f"{destination.name}: {destination.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
