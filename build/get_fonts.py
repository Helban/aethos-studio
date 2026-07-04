"""Download the latin-subset woff2 files for AETHOS's self-hosted fonts.

Fetches each family's Google Fonts css2 stylesheet with a modern-browser
User-Agent (so Google serves woff2), keeps only the `/* latin */` @font-face
block per weight, downloads that woff2 into fonts/, and prints @font-face CSS
to paste into aethos.css. Run subset_fonts.py afterwards to trim the glyphs.
"""
import re
import urllib.request
from pathlib import Path

FONTS_DIR = Path(__file__).resolve().parent.parent / "fonts"

BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)

# family label -> (google family query, output slug, weights)
FAMILIES = [
    ("Space Grotesk", "Space+Grotesk", "spacegrotesk", [500, 700]),
    ("Inter", "Inter", "inter", [400]),
    ("Space Mono", "Space+Mono", "spacemono", [400]),
]


def fetch(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": BROWSER_UA})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8")


def latin_blocks(css_text: str) -> dict[int, str]:
    """Map font-weight -> woff2 url for the `/* latin */` subset only."""
    weight_to_url: dict[int, str] = {}
    chunks = re.split(r"/\*\s*([\w-]+)\s*\*/", css_text)
    for label, face in zip(chunks[1::2], chunks[2::2]):
        if label != "latin":
            continue
        weight_match = re.search(r"font-weight:\s*(\d+)", face)
        url_match = re.search(r"src:\s*url\((https://[^)]+\.woff2)\)", face)
        if weight_match and url_match:
            weight_to_url[int(weight_match.group(1))] = url_match.group(1)
    return weight_to_url


def download(url: str, out_path: Path) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": BROWSER_UA})
    with urllib.request.urlopen(request, timeout=30) as response:
        out_path.write_bytes(response.read())


def main() -> None:
    FONTS_DIR.mkdir(parents=True, exist_ok=True)
    face_css_lines: list[str] = []
    for family_label, family_query, slug, weights in FAMILIES:
        weight_list = ";".join(str(weight) for weight in weights)
        css_url = f"https://fonts.googleapis.com/css2?family={family_query}:wght@{weight_list}&display=swap"
        resolved = latin_blocks(fetch(css_url))
        for weight in weights:
            woff2_url = resolved.get(weight)
            if not woff2_url:
                print(f"MISSING latin woff2 for {family_label} {weight}")
                continue
            out_path = FONTS_DIR / f"{slug}-{weight}.woff2"
            download(woff2_url, out_path)
            print(f"saved {out_path.name}  {out_path.stat().st_size / 1024:.1f} KiB")
            face_css_lines.append(
                "@font-face {\n"
                f"  font-family: '{family_label}';\n"
                "  font-style: normal;\n"
                f"  font-weight: {weight};\n"
                "  font-display: swap;\n"
                f"  src: url('../fonts/{out_path.name}') format('woff2');\n"
                "}"
            )
    print("\n----- @font-face CSS -----")
    print("\n".join(face_css_lines))


if __name__ == "__main__":
    main()
