import re
import shutil
from pathlib import Path
from typing import Dict

from optimize_images.api import PublicBatchOptions, optimize_as_batch

REPO_DIR = Path(__file__).parent.parent
SRC_DIR = REPO_DIR / "original_images"
PUBLIC_DIR = REPO_DIR / "public"

SIZE_MAP: Dict[int, str] = {
    700: "minecolonies",
    500: "minecolonies500",
    300: "minecolonies300",
}

JPEG_QUALITY = 99


def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)


def batch_resize_in_place(root: Path, size: int):
    return PublicBatchOptions(
        src_path=str(root),
        quality=JPEG_QUALITY,
        max_w=size,
        max_h=size,
        convert_all=True,
        force_del=True,
    )


def main():
    if not SRC_DIR.exists():
        print(f"Source dir `{SRC_DIR}` not found")
        return

    for original_style in SRC_DIR.iterdir():
        if not original_style.is_dir():
            continue

        for size, size_name in SIZE_MAP.items():
            safe_name = re.sub(r'[^a-z0-9]', '', original_style.name.lower())
            dest_dir = PUBLIC_DIR / size_name / safe_name
            if dest_dir.exists():
                print(f"Style `{size_name}` for size {size} already exists, skipping...")
                continue

            shutil.copytree(
                original_style,
                dest_dir,
                dirs_exist_ok=True,
            )

            print(f"Optimizing style `{safe_name}` for size {size}...")
            options = batch_resize_in_place(dest_dir, size)
            for _ in range(5):
                results = optimize_as_batch(options)
                if results.total_bytes_saved == 0:
                    break


if __name__ == "__main__":
    main()
