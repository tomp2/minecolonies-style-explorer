"""
Do not run this script unless you know what you are doing.

This is a helper script to rename minecraft screenshots to front.png and back.png in the
public/minecolonies/* directories.

The user may have different process so this script must be modified to fit their needs.
"""

import os
import re
from datetime import datetime
from pathlib import Path
from typing import Any

images_path = Path(__file__).parent.parent.joinpath("public", "minecolonies", "medievalspruce")
blueprints_path = Path(r"C:\Users\user\Desktop\minecolonies").joinpath(images_path.name)


def parse_building_filename(file_name: str) -> dict[str, Any]:
    match = re.match(r"^(.+?)(\d?)\.blueprint$", file_name)
    if not match:
        raise ValueError(f"File name doesn't match the pattern: {file_name}")
    return {"buildingName": match[1], "buildingLevel": int(match[2]) if match[2] else False}


def get_building_max_level(building_screenshot_path: Path) -> int | None:
    # The images_path directory and blueprint_path directory have the same structure, so the
    # blueprints for a building screenshot can be found by replacing the images_path with the
    # blueprints_path. However, in the blueprints directory each building doesn't have their
    # own directory but are files instead, e.g. "building1.blueprint", "building2.blueprint", etc.
    # If the building name doesn't end with an integer, then the building doesn't have levels.
    partial_building_path = building_screenshot_path.relative_to(images_path).parent
    building_name = partial_building_path.name

    blueprint_directory = blueprints_path.joinpath(partial_building_path.parent)

    if (blueprint_directory / f"{partial_building_path.name}.blueprint").exists():
        return None

    # Find by glob
    matching_files = list(blueprint_directory.glob(f"{building_name}?.blueprint"))
    matching_files.sort(reverse=True)

    if not matching_files:
        return None

    return int(matching_files[0].stem[-1])


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

        max_level = get_building_max_level(frontPath)

        frontPath.rename(frontPath.with_name(f"{max_level or ''}front.png"))
        backPath.rename(backPath.with_name(f"{max_level or ''}back.png"))
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
