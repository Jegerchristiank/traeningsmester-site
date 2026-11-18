"""Unpack the lossless, perspective-matched phone plates for media-cover-motion.py.

Usage: python scripts/media-unpack-bench.py /path/to/bench (requires Pillow).
The WebP stores the photograph once and carries the shot names and glyph corners
in XMP. Its timeline is a storage index, independent of the film's frame rate.
"""

import argparse
import json
from pathlib import Path
import shutil
from xml.etree import ElementTree

from PIL import Image, ImageSequence


MASTER = Path(__file__).resolve().parents[1] / "marketing/launch/source/magnesium/baenk.webp"
NAMESPACE = "https://www.traeningsmester.dk/metadata/production/1.0/"


def unpack(directory):
    directory.mkdir(parents=True, exist_ok=True)
    with Image.open(MASTER) as master:
        metadata = ElementTree.fromstring(master.info["xmp"])

        def read(key):
            return json.loads(metadata.findtext(f".//{{{NAMESPACE}}}{key}"))

        names = read("frames")
        slot_ms = read("slotMs")
        geometry = read("geometry")
        written = []
        for frame in ImageSequence.Iterator(master):
            pixels = frame.convert("RGB")
            start = frame.info["timestamp"] // slot_ms
            duration = frame.info["duration"] // slot_ms
            slots = names[start:start + duration]
            if not slots:
                raise ValueError("The WebP contains an unexpected frame duration")
            first = directory / (slots[0] + ".webp")
            pixels.save(first, lossless=True, quality=66, method=3)
            # The encoder coalesces identical frames, including the last scroll position.
            for name in slots[1:]:
                shutil.copyfile(first, directory / (name + ".webp"))
            written.extend(slots)
        if written != names:
            raise ValueError("The WebP timeline does not cover every phone pose")
        (directory / "glyph-quad.json").write_text(json.dumps(geometry, indent=2) + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path, help="Directory to pass to the film renderer as --bench")
    unpack(parser.parse_args().directory)
