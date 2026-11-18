"""Write the offline 40-second Foley stem from the sibling package."""

from pathlib import Path
import argparse
from __init__ import build

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    build(parser.parse_args().output.resolve())
