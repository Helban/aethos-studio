"""Subset AETHOS's self-hosted woff2 fonts to the glyphs the site actually uses.

Keeps basic Latin plus the punctuation and symbols in the copy (·, ™, arrows,
smart quotes, ellipsis). Rewrites each file in place. Needs fonttools + brotli.
"""
from pathlib import Path
from fontTools.subset import Subsetter, Options
from fontTools.ttLib import TTFont

FONTS_DIR = Path(__file__).resolve().parent.parent / "fonts"
TARGETS = ["spacegrotesk-500", "spacegrotesk-700", "inter-400", "spacemono-400"]
EXTRA_SYMBOLS = (0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022,
                 0x2026, 0x2122, 0x00B7, 0x2190, 0x2191, 0x2192, 0x2193)


def used_unicodes() -> set[int]:
    codepoints = set(range(0x0020, 0x0100))  # basic Latin + Latin-1 supplement
    codepoints.update(EXTRA_SYMBOLS)
    return codepoints


def subset_in_place(path: Path, unicodes: set[int]) -> tuple[float, float]:
    before_kib = path.stat().st_size / 1024
    font = TTFont(str(path))
    options = Options()
    options.flavor = "woff2"
    options.layout_features = ["kern", "liga", "calt"]
    options.name_IDs = []
    options.notdef_outline = True
    subsetter = Subsetter(options=options)
    subsetter.populate(unicodes=unicodes)
    subsetter.subset(font)
    font.save(str(path))
    return before_kib, path.stat().st_size / 1024


def main() -> None:
    unicodes = used_unicodes()
    for slug in TARGETS:
        before_kib, after_kib = subset_in_place(FONTS_DIR / f"{slug}.woff2", unicodes)
        print(f"{slug}: {before_kib:.1f} -> {after_kib:.1f} KiB")


if __name__ == "__main__":
    main()
