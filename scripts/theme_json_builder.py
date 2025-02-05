import json
import re
from concurrent.futures.process import ProcessPoolExecutor
from functools import cached_property, lru_cache
from pathlib import Path
from typing import Dict, Optional, Any, TypedDict, Literal

import numpy as np
from PIL import Image
from blurhash import encode
from nbt import nbt
from nbt.nbt import TAG_Compound

# --- Configuration ---
ONE_LEVEL_ONLY = True
THEME_DIRS = [
    Path(r"C:\Users\user\Desktop\minecolonies2\medievaloak"),
    Path(r"C:\Users\user\Desktop\minecolonies2\caledonia"),
    Path(r"C:\Users\user\Desktop\minecolonies2\nordic"),
    Path(r"C:\Users\user\Desktop\minecolonies2\darkoak"),
    Path(r"C:\Users\user\Desktop\minecolonies2\medievalspruce"),
    Path(r"C:\Users\user\Desktop\minecolonies2\pagoda"),
    Path(r"C:\Users\user\Desktop\minecolonies2\truedwarven"),
    Path(r"C:\Users\user\Desktop\minecolonies2\original"),
    Path(r"C:\Users\user\Desktop\minecolonies2\byzantine"),
    Path(r"C:\Users\user\Desktop\minecolonies2\shogun"),
    Path(r"C:\Users\user\Desktop\minecolonies2\ancientathens"),
]

# --- Constants ---
REPO_DIR = Path(__file__).parent.parent
COMBINED_BUILDINGS_JSON = REPO_DIR / "scripts/combined_buildings.json"
IMAGES_DIR = REPO_DIR / "public/minecolonies"
OUTPUT_JSON = REPO_DIR / "src/assets/themes.json"
BUILDING_IGNORE_FILE = Path(__file__).parent / "buildings.ignore"
HUT_BLOCKS = {"field", "plantationfield", "alchemist", "kitchen", "graveyard", "netherworker", "archery", "baker",
              "barracks", "barrackstower", "beekeeper", "blacksmith", "builder", "chickenherder", "citizen",
              "combatacademy", "composter", "concretemixer", "cook", "cowboy", "crusher", "deliveryman", "dyer",
              "enchanter", "farmer", "fisherman", "fletcher", "florist", "glassblower", "guardtower", "hospital",
              "library", "lumberjack", "mechanic", "miner", "plantation", "rabbithutch", "sawmill", "school",
              "shepherd", "sifter", "smeltery", "stonemason", "stonesmeltery", "swineherder", "tavern", "townhall",
              "university", "warehouse", "mysticalsite"}

# --- Globals ---
ignored_pattern = re.compile(
    "|".join([line.strip() for line in BUILDING_IGNORE_FILE.read_text().splitlines() if
              line.strip() and not line.startswith("#")]))


class BlueprintFile:
    def __init__(self, file_path: Path):
        self.file_path = file_path

    @lru_cache
    def read(self):
        with self.file_path.open("rb") as f:
            return nbt.NBTFile(fileobj=f)

    @cached_property
    def size_x(self):
        return self.read().get("size_x").value

    @cached_property
    def size_y(self):
        return self.read().get("size_y").value

    @cached_property
    def size_z(self):
        return self.read().get("size_z").value

    def get_is_minecolonies_building(self):
        tile_entity: TAG_Compound
        for tile_entity in self.read().get("tile_entities"):
            if block_id := tile_entity.get("id"):
                block_id_str: str = block_id.value
                if block_id_str == "minecolonies:colony_flag":
                    continue

                if block_id_str.startswith("minecolonies"):
                    return True

            if block_type := tile_entity.get("type"):
                if block_type.value.startswith("minecolonies"):
                    return True

        return False

    @cached_property
    def name_and_level(self) -> TypedDict("BuildingName",
                                          {"buildingName": str, "buildingLevel": int | Literal[False]}):
        # If the building is a leveling building, the last number on the name indicates the level.
        # Otherwise, the building doesn't have levels, and number suffixes are to be included in the name.
        match = re.match(r"^(.+?)(\d*?)\.blueprint$", self.file_path.name)
        if not match:
            raise ValueError(f"File name doesn't match the pattern: {self.file_path.name}")

        if self.get_is_minecolonies_building():
            if len(match.groups()) == 1:
                return {"buildingName": match[0], "buildingLevel": False}
            else:
                return {"buildingName": match[1], "buildingLevel": int(match[2]) if match[2] else False}

        return {"buildingName": self.file_path.stem, "buildingLevel": False}

    @cached_property
    def name(self):
        return self.name_and_level["buildingName"]

    @cached_property
    def level(self):
        return self.name_and_level["buildingLevel"]

    def get_hut_blocks(self):
        hut_blocks = set()
        for block in self.read().get("palette"):
            block_name = block.get("Name").value
            if block_name.startswith("minecolonies:blockhut"):
                short_name = block_name[len("minecolonies:blockhut"):]
                if short_name in HUT_BLOCKS:
                    hut_blocks.add(short_name)
        return hut_blocks

    def get_raw_block_data(self):
        """
        The Structurize-mod stored the blocks in a 1-dimensional array of 32-bit integers.
        The 32-bit integer is split into two 16-bit values, where the left and right 16 bits represent
        two different blocks (probably to save space?)
        """
        raw_block_data = self.read().get("blocks")
        data = np.array(raw_block_data, dtype=np.uint32)
        # Split each 32-bit integer into two 16-bit values
        left_16_bits = (data >> 16) & 0xFFFF
        right_16_bits = data & 0xFFFF
        # Combine the left and right
        one_dim_array = np.concatenate((left_16_bits, right_16_bits))
        # If the size of the building is odd, the last 16-bits are assumed to be padding
        if (self.size_x * self.size_y * self.size_z) % 2 != 0:
            one_dim_array = one_dim_array[:-1]
        return one_dim_array.reshape((self.size_y, self.size_x, self.size_z))

    def calculate_building_size(self):
        palette_indices = self.get_raw_block_data()

        material_palette = self.read().get("palette")
        solidity_palette = np.array([entry.get("Name").value not in IGNORED_BLOCKS for entry in material_palette],
                                    dtype=bool)

        palette_indices_solidity = solidity_palette[palette_indices]

        y_slices_solidity = palette_indices_solidity.any(axis=(1, 2))
        x_slices_solidity = palette_indices_solidity.any(axis=(0, 2))
        z_slices_solidity = palette_indices_solidity.any(axis=(0, 1))

        bottom_y = np.argmax(y_slices_solidity)
        top_y = self.size_y - 1 - np.argmax(y_slices_solidity[::-1])

        left_x = np.argmax(x_slices_solidity)
        right_x = self.size_x - 1 - np.argmax(x_slices_solidity[::-1])

        front_z = np.argmax(z_slices_solidity)
        back_z = self.size_z - 1 - np.argmax(z_slices_solidity[::-1])

        return int(right_x - left_x + 1), int(top_y - bottom_y + 1), int(back_z - front_z + 1)


IGNORED_BLOCKS = {
    "minecraft:air",
    "minecraft:grass_block",
    "minecraft:dirt",
    "minecraft:sand",
    "minecraft:stone",
    "minecraft:water",
    "structurize:blocksubstitution",
    "minecraft:grass",
    "minecraft:fern",
}


def find_building_image(
        blueprint_path: Path,
        building_name: str,
        building_level: Optional[int],
        theme_images_dir: Path,
        theme_path: Path
) -> TypedDict("BuildingImages", {"front": Path, "frontExists": bool, "back": Path, "backExists": bool}):
    blueprint_rel_path = blueprint_path.relative_to(theme_path)
    image_dir = theme_images_dir / blueprint_rel_path.parent / building_name

    front = image_dir / (f"{building_level}front.jpg" if building_level else "front.jpg")
    back = image_dir / (f"{building_level}back.jpg" if building_level else "back.jpg")

    return {
        "front": front,
        "frontExists": front.exists(),
        "back": back,
        "backExists": back.exists()
    }


def encode_image_to_blurhash(image_path: Path) -> str:
    with Image.open(image_path) as image:
        image.thumbnail((100, 100))
        hash_result = encode(image, x_components=4, y_components=4)
    return hash_result


def process_building(
        file_path: Path,
        parent_category_object: Dict,
        theme_images_dir: Path,
        theme_path: Path
):
    blueprint = BlueprintFile(file_path)

    # When ONE_LEVEL_ONLY is True, only process the max level of each building
    # Find out if there exists a higher level of the building
    if ONE_LEVEL_ONLY:
        higher_level_name = f"{blueprint.name}{blueprint.level + 1}.blueprint"
        higher_level_path = file_path.parent / higher_level_name
        if higher_level_path.exists():
            return

    building_images = find_building_image(
        file_path,
        blueprint.name,
        blueprint.level,
        theme_images_dir,
        theme_path
    )

    if not building_images["frontExists"]:
        print(f"[WARN] Required front image not found: {building_images['front'].relative_to(theme_images_dir.parent)}")
        return

    building_obj = parent_category_object.setdefault(
        blueprint.name, {"levels": blueprint.level, "size": blueprint.calculate_building_size()}
    )

    blur_hashes = [encode_image_to_blurhash(building_images["front"])]

    if building_images["backExists"]:
        building_obj["back"] = True
        blur_hashes.append(encode_image_to_blurhash(building_images["back"]))

    if hut_blocks := blueprint.get_hut_blocks():
        building_obj["hutBlocks"] = list(hut_blocks)

    building_obj["blur"] = blur_hashes

    if building_obj["levels"] is False and blueprint.level is not False:
        raise ValueError(
            "Existing building object has levels=False, but a leveled version was found."
        )

    if building_obj["levels"] is not False and blueprint.level is not False:
        building_obj["levels"] = max(building_obj["levels"], blueprint.level)


def handle_file(
        file_path: Path,
        parent_category_object: Dict,
        theme_images_dir: Path,
        theme_path: Path
):
    if ignored_pattern.search(str(file_path.as_posix())):
        return

    if file_path.suffix != ".blueprint":
        return

    process_building(file_path, parent_category_object, theme_images_dir, theme_path)


def handle_building_categories(
        category_path: Path,
        parent_object: Dict,
        theme_images_dir: Path,
        theme_path: Path
):
    if ignored_pattern.search(str(category_path)):
        return

    building_group_name = category_path.name
    if building_group_name not in parent_object:
        parent_object[building_group_name] = {"blueprints": {}, "categories": {}}

    building_group = parent_object[building_group_name]

    for item in category_path.iterdir():
        if item.is_file():
            handle_file(item, building_group["blueprints"], theme_images_dir, theme_path)
        else:
            handle_building_categories(item, building_group["categories"], theme_images_dir, theme_path)


def process_theme(theme_path: Path):
    theme_name = theme_path.name
    pack_meta_file = theme_path / "pack.json"
    pack_meta = json.loads(pack_meta_file.read_text())

    theme_images_dir = IMAGES_DIR / theme_path.name
    theme_blueprints = {}
    theme_categories = {}

    for item in theme_path.iterdir():
        if item.name in ["pack.json", f"{theme_path.name}.png"]:
            continue
        print(f"Processing: {theme_name}/{item.relative_to(theme_path)}")

        if item.is_file():
            handle_file(item, theme_blueprints, theme_images_dir, theme_path)
        else:
            handle_building_categories(item, theme_categories, theme_images_dir, theme_path)

    return {
        "name": theme_path.name,
        "json": {
            "displayName": pack_meta["name"],
            "authors": pack_meta["authors"],
            "blueprints": theme_blueprints,
            "categories": theme_categories
        }
    }


def add_combined_buildings(themes: Dict[str, Any]):
    """
    Reads the combined buildings which look like this:
    [
      {
        "name": "barracksfull",
        "displayName": "Barracks + Towers",
        "path": "nordic/military",
        "blueprints": [
          "barracks5.blueprint",
          "barrackstower5.blueprint"
        ]
      }
    ]
    These entries must be added to the themes.json file.
    The "path" must be used to find the actual blueprint files +
    add the new building object to the correct category in the resulting JSON.
    """
    combined_buildings = json.loads(COMBINED_BUILDINGS_JSON.read_text())
    for combined_building in combined_buildings:
        path = combined_building["path"].split("/")
        name = combined_building["name"]

        print(f"Processing combined building: {name} ({'/'.join(path)})")

        (theme_name, *category_path) = path
        if theme_name not in themes:
            print(f"[WARN] Theme not found: {theme_name}")
            continue

        theme_source_dir: Path | None = None
        for theme_dir in THEME_DIRS:
            if theme_dir.name == theme_name:
                theme_source_dir = theme_dir
                break

        if theme_source_dir is None:
            print(f"[WARN] Theme directory not found: {theme_name}")
            continue

        combined_hut_blocks = set()
        combined_level = False
        building_size = None
        for blueprint in combined_building["blueprints"]:
            blueprint_path = theme_source_dir.joinpath(*category_path).joinpath(blueprint)
            blueprint = BlueprintFile(blueprint_path)

            combined_hut_blocks |= blueprint.get_hut_blocks()
            if not combined_level:
                combined_level = blueprint.level
            elif blueprint.level:
                combined_level = max(combined_level, blueprint.level)

            if not building_size:
                building_size = blueprint.calculate_building_size()

        building_object = {
            "levels": combined_level,
            "displayName": combined_building["displayName"],
            "size": building_size
        }

        if combined_hut_blocks:
            building_object["hutBlocks"] = list(combined_hut_blocks)

        combined_images_dir = IMAGES_DIR / theme_name / "/".join(category_path) / name
        front = combined_images_dir / (f"{combined_level}front.jpg" if combined_level else "front.jpg")
        back = combined_images_dir / (f"{combined_level}back.jpg" if combined_level else "back.jpg")

        frontExists = front.exists()
        backExists = back.exists()

        if not frontExists:
            print(f"[WARN] Required front image not found: {front.relative_to(IMAGES_DIR)}")
            continue

        blur_hashes = [encode_image_to_blurhash(front)]

        if backExists:
            building_object["back"] = True
            blur_hashes.append(encode_image_to_blurhash(back))

        building_object["blur"] = blur_hashes

        # Drill down in the themes object to find the correct category for adding the new building
        current_category = themes[theme_name]
        for category in category_path:
            current_category = current_category["categories"][category]

        current_category["blueprints"][name] = building_object


def main():
    themes = {}

    if OUTPUT_JSON.exists():
        themes = json.loads(OUTPUT_JSON.read_text())

    with ProcessPoolExecutor() as executor:
        results = executor.map(process_theme, THEME_DIRS)

    for result in results:
        previous = themes.get(result["name"])
        if previous:
            for key, value in result["json"].items():
                previous[key] = value
        else:
            themes[result["name"]] = result["json"]

    add_combined_buildings(themes)

    OUTPUT_JSON.write_text(json.dumps(themes))
    print("Done!")


if __name__ == "__main__":
    main()
