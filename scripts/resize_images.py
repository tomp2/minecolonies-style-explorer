"""
This script resizes images in the public/minecolonies directory to a max size of `MAX_SIZE` and creates additional
directories with smaller sizes. The script is useful for creating different image sizes for different devices.
The script uses the `PIL` library to resize images.

Configure the `MAX_SIZE` and `OTHER_SRC_SETS` variables to fit your needs.
"""

import re
from pathlib import Path

from PIL import Image
from tqdm import tqdm

MAX_SIZE = 700

OTHER_SRC_SETS = [
    # 350
]

images_dir = Path(__file__).parent.parent.joinpath("public", "minecolonies")


def resize(im: Image.Image, max_size: int) -> Image:
    width, height = im.size
    # crop the image from the center.
    # Note that we can't grow the image, only shrink it.

    # If the image is too tall, resize it to fit the height
    if height > max_size:
        new_height = max_size
        new_width = int(width * (max_size / height))
        im = im.resize((new_width, new_height))

    width, height = im.size

    new_width = min(max_size, width)
    new_height = min(max_size, height)

    left = (width - new_width) // 2
    top = (height - new_height) // 2

    right = left + new_width
    bottom = top + new_height

    return im.crop((left, top, right, bottom))


def main():
    if not images_dir.exists():
        raise FileNotFoundError("Directory not found")
    print("Images root:", images_dir)

    for image_path in tqdm(list(images_dir.glob('**/*.jpg'))):
        match = re.match(r"^(\d)(front|back)\.jpg$", image_path.name)
        if not match:
            continue

        with Image.open(image_path) as im:
            width, height = im.size  # Get dimensions

            if width <= MAX_SIZE and height <= MAX_SIZE:
                continue

            new_im = resize(im, MAX_SIZE)
            new_im.save(image_path)

            for src_set in OTHER_SRC_SETS:
                relative_from_images = image_path.relative_to(images_dir).parent
                new_dir = images_dir.parent.joinpath(f"{src_set}_minecolonies", relative_from_images)
                new_dir.mkdir(parents=True, exist_ok=True)
                new_path = new_dir.joinpath(image_path.name)

                if not new_path.exists():
                    new_im = resize(im, src_set)
                    new_im.save(new_path)


if __name__ == '__main__':
    main()
