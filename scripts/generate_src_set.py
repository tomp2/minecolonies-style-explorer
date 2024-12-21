"""
This script generates other src sets for images in the public/minecolonies directory.
Only uses jpg images, so make sure that all screenshots are
1. cropped to square
2. renamed to front.jpg and back.jpg etc.
3. Optimized to jpg and resized
"""

import re
from pathlib import Path

from PIL import Image
from tqdm import tqdm

OTHER_SRC_SETS = [
    250,
    450,
]

images_dir = Path(__file__).parent.parent.joinpath("public", "minecolonies")


def main():
    if not images_dir.exists():
        raise FileNotFoundError("Directory not found")
    print("Images root:", images_dir)

    for image_path in tqdm(list(images_dir.glob('**/*.jpg'))):
        match = re.match(r"^(\d?)(front|back)\.jpg$", image_path.name)
        if not match:
            continue

        with Image.open(image_path) as im:
            for src_set in OTHER_SRC_SETS:
                relative_from_images = image_path.relative_to(images_dir).parent
                new_dir = images_dir.parent.joinpath(f"{src_set}_minecolonies", relative_from_images)
                new_dir.mkdir(parents=True, exist_ok=True)
                new_path = new_dir.joinpath(image_path.name)

                if not new_path.exists():
                    new_im = im.resize((src_set, src_set))
                    new_im.save(new_path)


if __name__ == '__main__':
    main()
