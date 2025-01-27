"""
This script finds all blueprints from the given theme folder and creates a matching directory structure in the
themes-directory. For example a blueprint at Desktop/minecolonies/shire/buildings/house/house.blueprint will
create a directory at public/minecolonies/shire/buildings/house/house.

Run this when adding a new theme to the project.
"""

from pathlib import Path

from tqdm import tqdm

from scripts.theme_json_builder import BlueprintFile

# The directory where the theme blueprints are stored
theme_source_directory = Path(r"C:\Users\user\Desktop\minecolonies2\caledonia")

# The directory where the theme directories will be created
themes_directory = Path(__file__).parent.parent.joinpath("public", "minecolonies")

# Find every .blueprint file and create a directory (and parents) for it in the themes directory
count = 0
for image_path in tqdm(list(theme_source_directory.glob('**/*.blueprint'))):
    blueprint = BlueprintFile(image_path)
    new_dir_relative_path = image_path.relative_to(theme_source_directory).parent
    new_dir = themes_directory.joinpath(theme_source_directory.stem, new_dir_relative_path, blueprint.name)
    try:
        new_dir.mkdir(parents=True)
        count += 1
        print("Created", new_dir)
    except FileExistsError:
        pass

print(f"Created {count} directories in {themes_directory}")
