"""
Do not run this script unless you know what you are doing.

This is a helper script to rename minecraft screenshots to front.png and back.png in the
public/minecolonies/* directories.

The user may have different process so this script must be modified to fit their needs.
"""

import os
from datetime import datetime
from pathlib import Path

images_path = Path(__file__).parent.parent.joinpath("public", "minecolonies", "shire")

# Recursively iterate over directories here until a directory with .png files is found
for dirpath, dirnames, filenames in os.walk(images_path):
    if not any(f.endswith(".png") for f in filenames):
        continue

    # If there is only one image, rename it to front.png
    if len(filenames) == 1:
        path = Path(dirpath).joinpath(filenames[0])
        path.rename(path.with_name("front.png"))
        continue

    # If there are two images, rename the first to front.png and the second to back.png
    if len(filenames) == 2:
        (file1, file2) = filenames

        # The file that was created first becomes the front.png
        date1 = datetime.strptime(file1, "%Y-%m-%d_%H.%M.%S.png")
        date2 = datetime.strptime(file2, "%Y-%m-%d_%H.%M.%S.png")

        if date1 < date2:
            front, back = file1, file2
        else:
            front, back = file2, file1

        frontPath = Path(dirpath).joinpath(front)
        backPath = Path(dirpath).joinpath(back)
        frontPath.rename(frontPath.with_name("front.png"))
        backPath.rename(backPath.with_name("back.png"))
        continue

    # Sort all .png files by their name which is a date like 2024-11-30_03.22.30.png
    # The first image to front5.png, the second to front4.png, etc.
    # The sixth image to back5.png, the seventh to back4.png, etc.
    # If there are more than 10 images, throw an error
    file_dates = []
    skip_this_dir = False
    for f in Path(dirpath).iterdir():
        if not f.name.endswith(".png"):
            skip_this_dir = True
            break

        try:
            date = datetime.strptime(f.stem, "%Y-%m-%d_%H.%M.%S")
        except ValueError:
            skip_this_dir = True
            break
        file_dates.append((f, date))

    if skip_this_dir:
        continue

    if len(filenames) > 10:
        raise ValueError("More than 10 images found")

    file_dates.sort(key=lambda x: x[1], reverse=False)

    for i, (f, _) in enumerate(file_dates):
        new_name = f"{5 - i % 5}{'front' if i < 5 else 'back'}.png"
        f.rename(f.parent.joinpath(new_name))