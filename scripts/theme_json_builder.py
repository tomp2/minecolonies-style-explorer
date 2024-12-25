import json
import re
from pathlib import Path
from typing import Dict, Optional, Any, Set, TypedDict, Literal

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

    if not building_images["frontExists"]:
        print(f"[WARN] Required front image not found: {building_images['front'].relative_to(theme_images_dir.parent)}")
        return

    building_obj = parent_category_object.setdefault(
        building_name, {"levels": building_level}
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
    pack_meta_file = theme_path / "pack.json"
    pack_meta = json.loads(pack_meta_file.read_text())

    theme_images_dir = IMAGES_DIR / theme_path.name
    theme_blueprints = {}
    theme_categories = {}

    for item in theme_path.iterdir():
        if item.name in ["pack.json", f"{theme_path.name}.png"]:
            continue
        print(f"    Processing: {item.relative_to(theme_path)}")

        if item.is_file():
            handle_file(item, theme_blueprints, theme_images_dir, theme_path)
        else:
            handle_building_categories(item, theme_categories, theme_images_dir, theme_path)

    return {
        "displayName": pack_meta["name"],
        "authors": pack_meta["authors"],
        "blueprints": theme_blueprints,
        "categories": theme_categories
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
        for blueprint in combined_building["blueprints"]:
            blueprint_path = theme_source_dir.joinpath(*category_path).joinpath(blueprint)
            nbt_data = read_blueprint_nbt(blueprint_path)
            combined_hut_blocks |= get_building_hut_blocks(nbt_data)
            building_level = parse_building_filename(blueprint)["buildingLevel"]
            if not combined_level:
                combined_level = building_level
            elif building_level:
                combined_level = max(combined_level, building_level)

        building_object = {
            "levels": combined_level,
            "displayName": combined_building["displayName"]
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

    for theme_dir in THEME_DIRS:
        print(f"Processing theme: {theme_dir.name}")
        themes[theme_dir.name] = process_theme(theme_dir)

    add_combined_buildings(themes)

    OUTPUT_JSON.write_text(json.dumps(themes))
    print("Done!")


if __name__ == "__main__":
    main()
