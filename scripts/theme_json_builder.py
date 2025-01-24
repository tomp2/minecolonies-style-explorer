import json
import re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Dict, Optional, Any, Set, TypedDict, Literal

import numpy as np
import numpy.typing as npt
from PIL import Image
from blurhash import encode
from nbt import nbt

# --- Configuration ---
ONE_LEVEL_ONLY = True
THEME_DIRS = [
    Path(r"C:\Users\user\Desktop\minecolonies\medievaloak"),
    Path(r"C:\Users\user\Desktop\minecolonies\caledonia"),
    Path(r"C:\Users\user\Desktop\minecolonies\nordic"),
    Path(r"C:\Users\user\Desktop\minecolonies\darkoak"),
    Path(r"C:\Users\user\Desktop\minecolonies\medievalspruce"),
    Path(r"C:\Users\user\Desktop\minecolonies\pagoda"),
    Path(r"C:\Users\user\Desktop\minecolonies\truedwarven"),
    Path(r"C:\Users\user\Desktop\minecolonies\original"),
]

# --- Constants ---
REPO_DIR = Path(__file__).parent.parent
COMBINED_BUILDINGS_JSON = REPO_DIR / "src/assets/combined_buildings.json"
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
    "|".join([line.strip() for line in BUILDING_IGNORE_FILE.read_text().splitlines() if line.strip()]))


def parse_building_filename(file_name: str) -> TypedDict("BuildingName",
                                                         {"buildingName": str, "buildingLevel": int | Literal[False]}):
    match = re.match(r"^(.+?)(\d?)\.blueprint$", file_name)
    if not match:
        raise ValueError(f"File name doesn't match the pattern: {file_name}")
    return {"buildingName": match[1], "buildingLevel": int(match[2]) if match[2] else False}


def get_building_hut_blocks(nbt_data: nbt.NBTFile) -> Set[str]:
    hut_blocks = set()
    for block in nbt_data.get("palette"):
        block_name = block.get("Name").value
        if block_name.startswith("minecolonies:blockhut"):
            short_name = block_name[len("minecolonies:blockhut"):]
            if short_name in HUT_BLOCKS:
                hut_blocks.add(short_name)
    return hut_blocks


def blocks_array_to_palette(
        ints: list[int],
        size_x: int,
        size_y: int,
        size_z: int
) -> npt.NDArray[int]:
    """
    The Structurize-mod stored the blocks in a 1-dimensional array of 32-bit integers.
    The 32-bit integer is split into two 16-bit values, where the left and right 16 bits represent
    two different blocks (probably to save space?)
    """
    data = np.array(ints, dtype=np.uint32)
    # Split each 32-bit integer into two 16-bit values
    left_16_bits = (data >> 16) & 0xFFFF
    right_16_bits = data & 0xFFFF
    # Combine the left and right
    one_dim_array = np.concatenate((left_16_bits, right_16_bits))

    # If the size of the building is odd, the last 16-bits are assumed to be padding
    if (size_x * size_y * size_z) % 2 != 0:
        one_dim_array = one_dim_array[:-1]

    if size_x * size_y * size_z != len(one_dim_array):
        raise ValueError("Size of the 1-dimensional array doesn't match the dimensions of the building.")

    mult_dim_array = one_dim_array.reshape((size_y, size_z, size_x))
    return mult_dim_array


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


def calculate_building_size(
        nbt_data: nbt.NBTFile,
) -> tuple[int, int, int]:
    size_x = nbt_data.get("size_x").value
    size_y = nbt_data.get("size_y").value
    size_z = nbt_data.get("size_z").value

    raw_block_data = nbt_data.get("blocks")
    palette_indices = blocks_array_to_palette(raw_block_data, size_x, size_y, size_z)

    material_palette = nbt_data.get("palette")
    solidity_palette = np.array([entry.get("Name").value not in IGNORED_BLOCKS for entry in material_palette],
                                dtype=bool)

    palette_indices_solidity = solidity_palette[palette_indices]

    y_slices_solidity = palette_indices_solidity.any(axis=(1, 2))
    x_slices_solidity = palette_indices_solidity.any(axis=(0, 2))
    z_slices_solidity = palette_indices_solidity.any(axis=(0, 1))

    bottom_y = np.argmax(y_slices_solidity)
    top_y = size_y - 1 - np.argmax(y_slices_solidity[::-1])

    left_x = np.argmax(x_slices_solidity)
    right_x = size_x - 1 - np.argmax(x_slices_solidity[::-1])

    front_z = np.argmax(z_slices_solidity)
    back_z = size_z - 1 - np.argmax(z_slices_solidity[::-1])

    return int(right_x - left_x + 1), int(top_y - bottom_y + 1), int(back_z - front_z + 1)


def read_blueprint_nbt(file_path: Path) -> nbt.NBTFile:
    with file_path.open("rb") as f:
        return nbt.NBTFile(fileobj=f)


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
    file_name = file_path.name
    parsed = parse_building_filename(file_name)

    building_level = parsed["buildingLevel"]
    building_name = parsed["buildingName"]

    # When ONE_LEVEL_ONLY is True, only process the max level of each building
    # Find out if there exists a higher level of the building
    if ONE_LEVEL_ONLY:
        higher_level_name = f"{building_name}{building_level + 1}.blueprint"
        higher_level_path = file_path.parent / higher_level_name
        if higher_level_path.exists():
            return

    nbt_data = read_blueprint_nbt(file_path)
    hut_blocks = get_building_hut_blocks(nbt_data)
    building_images = find_building_image(file_path, building_name, building_level, theme_images_dir, theme_path)

    building_size = calculate_building_size(nbt_data)

    if not building_images["frontExists"]:
        print(f"[WARN] Required front image not found: {building_images['front'].relative_to(theme_images_dir.parent)}")
        return

    building_obj = parent_category_object.setdefault(
        building_name, {"levels": building_level, "size": building_size}
    )

    blur_hashes = [encode_image_to_blurhash(building_images["front"])]

    if building_images["backExists"]:
        building_obj["back"] = True
        blur_hashes.append(encode_image_to_blurhash(building_images["back"]))

    if hut_blocks:
        building_obj["hutBlocks"] = list(hut_blocks)

    building_obj["blur"] = blur_hashes

    if building_obj["levels"] is False and building_level is not False:
        raise ValueError(
            "Existing building object has levels=False, but a leveled version was found."
        )

    if building_obj["levels"] is not False and parsed["buildingLevel"] is not False:
        building_obj["levels"] = max(building_obj["levels"], parsed["buildingLevel"])


def handle_file(
        file_path: Path,
        parent_category_object: Dict,
        theme_images_dir: Path,
        theme_path: Path
):
    if ignored_pattern.search(str(file_path.as_posix())):
        return

    if file_path.name in ["icon.png", "icon_disabled.png"]:
        return

    if file_path.suffix != ".blueprint":
        print(f"[WARN] File is not a blueprint: {file_path}")
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
            nbt_data = read_blueprint_nbt(blueprint_path)
            combined_hut_blocks |= get_building_hut_blocks(nbt_data)
            building_level = parse_building_filename(blueprint)["buildingLevel"]
            if not combined_level:
                combined_level = building_level
            elif building_level:
                combined_level = max(combined_level, building_level)

            if not building_size:
                building_size = calculate_building_size(nbt_data)

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

    with ThreadPoolExecutor() as executor:
        results = executor.map(process_theme, THEME_DIRS)

    for result in results:
        themes[result["name"]] = result["json"]

    add_combined_buildings(themes)

    OUTPUT_JSON.write_text(json.dumps(themes))
    print("Done!")


if __name__ == "__main__":
    main()
