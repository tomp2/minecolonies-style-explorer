import json
from pathlib import Path

theme_source_directory = Path(r"C:\Users\user\Desktop\minecolonies")
REPO_DIR = Path(__file__).parent.parent
OUTPUT_JSON = REPO_DIR / "src/assets/style_info.json"


def process_style(style_directory: Path):
    pack_meta_file = style_directory / "pack.json"
    if not pack_meta_file.exists():
        return None

    pack_meta = json.loads(pack_meta_file.read_text())
    return {
        "name": style_directory.name,
        "displayName": pack_meta["name"],
        "authors": pack_meta["authors"],
    }


def main():
    styles = []
    for style_directory in theme_source_directory.iterdir():
        if not style_directory.is_dir():
            continue

        style_info = process_style(style_directory)
        if style_info is not None:
            styles.append(style_info)

    styles.sort(key=lambda x: x["displayName"])
    OUTPUT_JSON.write_text(json.dumps(styles, indent=2))


if __name__ == "__main__":
    main()
