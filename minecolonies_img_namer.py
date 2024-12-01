import os
import re
from datetime import datetime
from pathlib import Path

here = Path(__file__).parent.joinpath("public", "minecolonies")

# Recursively iterate over directories here until a directory with .png files is found
for dirpath, dirnames, filenames in os.walk(here):

    # If filename is front5.png or back3.png, it is an accident and we need to
    # move the number to the front of the filename, like 5front.png or 3back.png
    for f in filenames:
        if match := re.match(r"^(front|back)(\d)\.png$", f):
            new_name = f"{match.group(2)}{match.group(1)}.png"
            os.rename(os.path.join(dirpath, f), os.path.join(dirpath, new_name))

    if not any(f.endswith(".png") for f in filenames):
        continue


    # Sort all .png files by their name which is a date like 2024-11-30_03.22.30.png
    # The first image to front5.png, the second to front4.png, etc.
    # The sixth image to back5.png, the seventh to back4.png, etc.
    # If there are more than 10 images, throw an error

    file_dates = []
    escape = False
    for f in Path(dirpath).iterdir():
        if not f.name.endswith(".png"):
            escape = True
            break

        try:
            date = datetime.strptime(f.stem, "%Y-%m-%d_%H.%M.%S")
        except ValueError:
            escape = True
            break
        file_dates.append((f, date))

    if escape:
        continue

    if len(filenames) > 10:
        raise ValueError("More than 10 images found")

    file_dates.sort(key=lambda x: x[1], reverse=False)

    for i, (f, _) in enumerate(file_dates):
        new_name = f"{5 - i % 5}{'front' if i < 5 else 'back'}.png"
        f.rename(f.parent.joinpath(new_name))
