"""
When taking screenshots of buildings in Minecraft, the screenshot is probably now exactly square.
This script will crop the image to a square from the middle if the image is larger than 700x700 pixels.

"""

import re
from pathlib import Path

from PIL import Image
from tqdm import tqdm

MAX_SIZE = 700

images_dir = Path(__file__).parent.parent.joinpath("public", "minecolonies")


def crop_to_square(im: Image.Image) -> Image:
    width, height = im.size
    if width == height:
        return im

    if width > height:
        left = (width - height) // 2
        top = 0
        right = left + height
        bottom = height
    else:
        left = 0
        top = (height - width) // 2
        right = width
        bottom = top + width

    return im.crop((left, top, right, bottom))


def main():
    if not images_dir.exists():
        raise FileNotFoundError("Directory not found")
    print("Images root:", images_dir)

    files_affected = 0
    images = [
        *list(images_dir.glob('**/*.png')),
        *list(images_dir.glob('**/*.jpg')),
    ]

    for image_path in tqdm(images):
        match = re.match(r"^(\d?)(front|back)\.(png|jpg)$", image_path.name)
        if not match:
            continue

        with Image.open(image_path) as im:
            width, height = im.size  # Get dimensions

            if width > MAX_SIZE and height > MAX_SIZE:
                new_im = crop_to_square(im)
                new_im.save(image_path)
                files_affected += 1

    print(f"Files affected: {files_affected}")


if __name__ == '__main__':
    main()
