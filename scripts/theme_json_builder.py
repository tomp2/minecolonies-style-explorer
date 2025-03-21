import json
import logging
import re
from concurrent.futures.process import ProcessPoolExecutor
from functools import cached_property, lru_cache
from pathlib import Path
from typing import Optional, TypedDict, Literal

import numpy as np
from PIL import Image
from blurhash import encode
from nbt import nbt
from nbt.nbt import TAG_Compound

from scripts.sitemap_gen import generate_sitemap

# --- Configuration ---
REPO_DIR = Path(__file__).parent.parent
BLUEPRINTS = REPO_DIR / "blueprints"
IMAGES_ROOT = REPO_DIR / "public/minecolonies"

MINECOLONIES = BLUEPRINTS / "minecolonies"
STYLECOLONIES = BLUEPRINTS / "stylecolonies"
UNOFFICIAL = BLUEPRINTS / "other"

THEME_DIRS = [
    MINECOLONIES / "medievaloak",
    MINECOLONIES / "caledonia",
    MINECOLONIES / "nordic",
    MINECOLONIES / "darkoak",
    MINECOLONIES / "medievalspruce",
    MINECOLONIES / "pagoda",
    MINECOLONIES / "truedwarven",
    MINECOLONIES / "original",
    MINECOLONIES / "ancientathens",
    MINECOLONIES / "colonial",
    MINECOLONIES / "shire",
    MINECOLONIES / "fortress",
    MINECOLONIES / "medievaldarkoak",
    STYLECOLONIES / "steampunk",
    UNOFFICIAL / "byzantine",
    UNOFFICIAL / "shogun",
]
COMBINED_BUILDINGS_PATH = REPO_DIR / "scripts/combined_buildings.json"
BUILDING_IGNORE = REPO_DIR / "scripts/buildings.ignore"
STYLE_INFO_PATH = REPO_DIR / "src/assets/styles.json"
MISSING_STYLE_INFO_PATH = REPO_DIR / "src/assets/missing_styles.json"

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

# --- Prepared file contents ---
COMBINED_BUILDINGS = json.loads(COMBINED_BUILDINGS_PATH.read_text())
STYLE_INFO = {style["name"]: style for style in json.loads(STYLE_INFO_PATH.read_text())["styles"]}
ignored_pattern = re.compile(
    "|".join([f"^{line.strip()}$" for line in BUILDING_IGNORE.read_text().splitlines() if
              line.strip() and not line.startswith("#")]))

# --- Constants ---
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
HUT_BLOCKS = {"field", "plantationfield", "alchemist", "kitchen", "graveyard", "netherworker", "archery", "baker",
              "barracks", "beekeeper", "blacksmith", "builder", "chickenherder", "citizen",
              "combatacademy", "composter", "concretemixer", "cook", "cowboy", "crusher", "deliveryman", "dyer",
              "enchanter", "farmer", "fisherman", "fletcher", "florist", "glassblower", "guardtower", "hospital",
              "library", "lumberjack", "mechanic", "miner", "plantation", "rabbithutch", "sawmill", "school",
              "shepherd", "sifter", "smeltery", "stonemason", "stonesmeltery", "swineherder", "tavern", "townhall",
              "university", "warehouse", "mysticalsite"}

# --- Types ---
type BuildingObject = TypedDict("BuildingObject", {
    "levels": int | Literal[False],
    "size": tuple[int, int, int],
    "back": bool | None,
    "hutBlocks": list[str] | None,
    "blur": list[str]
})
type Category = TypedDict("Category", {
    "blueprints": dict[str, BuildingObject],
    "categories": dict[str, Category] | None
})
type ThemeJson = TypedDict("ThemeJson", {
    "displayName": str,
    "authors": list[str],
    "blueprints": dict[str, BuildingObject],
    "categories": dict[str, Category],
})
type Theme = TypedDict("Theme", {
    "name": str,
    "type": str,
    "json": ThemeJson
})
type CategoriesRoot = TypedDict(
    "CategoriesRoot",
    {
        "blueprints": dict[str, BuildingObject],
        "categories": dict[str, Category]
    }
)


class BlueprintFile:
    def __init__(self, file_path: Path):
        self.file_path = file_path

    @lru_cache
    def get_primary_offset(self):
        data = self.read()
        optional_data = data.get("optional_data")
        structurize = optional_data.get("structurize")
        primary_offset = structurize.get("primary_offset")
        return {
            "x": primary_offset.get("x").value,
            "y": primary_offset.get("y").value,
            "z": primary_offset.get("z").value
        }

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
        primary_offset = self.get_primary_offset()

        hut_blocks = set()
        for block in self.read().get("palette"):
            block_name = block.get("Name").value
            if block_name.startswith("minecolonies:blockhut"):
                short_name = block_name[len("minecolonies:blockhut"):]
                if short_name in HUT_BLOCKS:
                    hut_blocks.add(short_name)

        raw_data = self.get_raw_block_data()
        hut_y = primary_offset["y"]
        hut_x = primary_offset["x"]
        hut_z = primary_offset["z"]
        primary_hut = raw_data[hut_y, hut_z, hut_x]
        material_palette = self.read().get("palette")
        primary_hut_name = material_palette[primary_hut].get("Name").value

        if primary_hut_name.startswith("minecolonies:blockhut"):
            primary_hut_name = primary_hut_name[len("minecolonies:blockhut"):]
            hut_blocks.discard(primary_hut_name)
            return [primary_hut_name, *hut_blocks]

        return list(hut_blocks)

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
        # Interleave the left and right 16-bit values
        one_dim_array = np.zeros(data.size * 2, dtype=np.uint16)
        one_dim_array[0::2] = left_16_bits
        one_dim_array[1::2] = right_16_bits
        # If the size of the building is odd, the last 16-bits are assumed to be padding
        if (self.size_x * self.size_y * self.size_z) % 2 != 0:
            one_dim_array = one_dim_array[:-1]
        return one_dim_array.reshape((self.size_y, self.size_z, self.size_x))

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
        parent_category_object: dict[str, BuildingObject],
        theme_images_dir: Path,
        theme_path: Path
):
    blueprint = BlueprintFile(file_path)

    try:
        blueprint.read()
    except Exception as e:
        logging.warning(f"Failed to read blueprint file: {file_path}: {e}")
        return

    blueprint_dir = blueprint.file_path.relative_to(theme_path.parent).parent.as_posix()
    blueprint_path = f"{blueprint_dir}/{blueprint.name}"

    if ignored_pattern.match(blueprint_path):
        return

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
        logging.warning(
            f"Required front image not found: {building_images['front'].relative_to(theme_images_dir.parent)}")
        return
    building_obj: BuildingObject = parent_category_object.setdefault(
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
        parent_category_object: Category,
        theme_images_dir: Path,
        theme_path: Path
):
    if file_path.suffix != ".blueprint":
        return
    process_building(file_path, parent_category_object, theme_images_dir, theme_path)


def handle_building_categories(
        category_path: Path,
        parent_object: dict[str, Category],
        theme_images_dir: Path,
        theme_path: Path
):
    building_group_name = category_path.name
    if building_group_name not in parent_object:
        parent_object[building_group_name] = {"blueprints": {}, "categories": {}}

    building_group = parent_object[building_group_name]

    for item in category_path.iterdir():
        if item.is_file():
            handle_file(item, building_group["blueprints"], theme_images_dir, theme_path)
        else:
            handle_building_categories(item, building_group["categories"], theme_images_dir, theme_path)


def add_combined_buildings(theme_id: str, categories_root: CategoriesRoot):
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
    for combined_building in COMBINED_BUILDINGS:
        name = combined_building["name"]
        path = combined_building["path"].split("/")
        (theme_type, theme_name, *category_path) = path
        if not theme_name == theme_id:
            continue

        theme_source_dir = BLUEPRINTS / theme_type / theme_name
        if not theme_source_dir.exists():
            logging.warning(f"Theme directory not found: {theme_name}")
            continue

        combined_hut_blocks = set()
        combined_level = False
        building_size = None
        for blueprint in combined_building["blueprints"]:
            blueprint_path = theme_source_dir.joinpath(*category_path).joinpath(blueprint)
            blueprint = BlueprintFile(blueprint_path)
            combined_hut_blocks |= set(blueprint.get_hut_blocks())
            if not combined_level:
                combined_level = blueprint.level
            elif blueprint.level:
                combined_level = max(combined_level, blueprint.level)

            if not building_size:
                building_size = blueprint.calculate_building_size()
            else:
                prev_volume = building_size[0] * building_size[1] * building_size[2]
                current_size = blueprint.calculate_building_size()
                current_volume = current_size[0] * current_size[1] * current_size[2]
                if current_volume > prev_volume:
                    building_size = current_size

        building_object = {
            "levels": combined_level,
            "displayName": combined_building["displayName"],
            "size": building_size
        }

        if combined_hut_blocks:
            building_object["hutBlocks"] = list(combined_hut_blocks)

        combined_images_dir = IMAGES_ROOT / theme_name / "/".join(category_path) / name
        front = combined_images_dir / (f"{combined_level}front.jpg" if combined_level else "front.jpg")
        back = combined_images_dir / (f"{combined_level}back.jpg" if combined_level else "back.jpg")

        frontExists = front.exists()
        backExists = back.exists()

        if not frontExists:
            logging.warning(f"Required front image not found: {front.relative_to(IMAGES_ROOT)}")
            continue

        blur_hashes = [encode_image_to_blurhash(front)]

        if backExists:
            building_object["back"] = True
            blur_hashes.append(encode_image_to_blurhash(back))

        building_object["blur"] = blur_hashes

        # Drill down in the themes object to find the correct category for adding the new building
        current_category = categories_root
        for category in category_path:
            current_category = current_category["categories"][category]

        current_category["blueprints"][name] = building_object


def process_theme(theme_path: Path) -> Theme:
    theme_type = theme_path.relative_to(BLUEPRINTS).parent.as_posix()
    theme_name = theme_path.name
    pack_meta_file = theme_path / "pack.json"
    pack_meta = json.loads(pack_meta_file.read_text())
    logging.info(f"Processing theme: {theme_name}")

    theme_images_dir = IMAGES_ROOT / theme_path.name
    categories_root: CategoriesRoot = {
        "blueprints": {},
        "categories": {}
    }

    for item in theme_path.iterdir():
        if item.name in ["pack.json", f"{theme_path.name}.png"]:
            continue

        if item.is_file():
            handle_file(item, categories_root["blueprints"], theme_images_dir, theme_path)
        else:
            handle_building_categories(item, categories_root["categories"], theme_images_dir, theme_path)

    theme_json: Theme = {
        "name": theme_path.name,
        "type": theme_type,
        "json": {
            "displayName": pack_meta["name"],
            "authors": pack_meta["authors"],
            "blueprints": categories_root["blueprints"],
            "categories": categories_root["categories"],
        }
    }
    add_combined_buildings(theme_name, categories_root)

    return theme_json


def main():
    logging.info("Processing themes...")
    with ProcessPoolExecutor() as executor:
        theme_results = list(executor.map(process_theme, THEME_DIRS))

    logging.info("Saving themes...")
    for theme in theme_results:
        logging.info(f"Saving theme: {theme['name']}")
        IMAGES_ROOT.joinpath(theme["name"], "style.json").write_text(json.dumps(theme["json"]))

    logging.info("Saving style info...")
    styles = []
    categories = set()
    for style in theme_results:
        style_dir = IMAGES_ROOT / style["name"]
        if not style_dir.exists():
            logging.info(f"[WARN] Style directory not found: {style_dir}")
            continue

        new_record = {
            "name": style["name"],
            "displayName": style["json"]["displayName"],
            "authors": style["json"]["authors"],
            "type": style["type"],
        }
        categories.update(style["json"]["categories"].keys())
        prev_record = STYLE_INFO.get(style["name"])
        if prev_record and "addedAt" in prev_record:
            new_record["addedAt"] = prev_record["addedAt"]
        styles.append(new_record)

    styles.sort(key=lambda x: x["displayName"])
    output = {
        "styles": styles,
        "categories": list(categories)
    }
    STYLE_INFO_PATH.write_text(json.dumps(output, indent=2))

    logging.info("Listing missing styles for voting...")
    found_style_ids = {style["name"] for style in styles}
    missing_styles_ids = []
    for style_type in BLUEPRINTS.iterdir():
        for style_dir in style_type.iterdir():
            if style_dir.is_dir() and style_dir.name not in found_style_ids:
                missing_styles_ids.append([style_type.name, style_dir.name])

    missing_styles = []
    for missing_style in missing_styles_ids:
        style_meta_path = BLUEPRINTS.joinpath(*missing_style, "pack.json")
        if not style_meta_path.exists():
            logging.warning(f"Style meta file not found: {style_meta_path}")
            continue

        [_, style_name] = missing_style

        style_meta = json.loads(style_meta_path.read_text())
        missing_styles.append({
            "name": style_name,
            "displayName": style_meta["name"],
            "authors": style_meta["authors"],
        })
    MISSING_STYLE_INFO_PATH.write_text(json.dumps(missing_styles, indent=2))

    logging.info("Generating sitemap...")
    generate_sitemap(found_style_ids)

    logging.info("Done!")


if __name__ == "__main__":
    main()
