import json
import re
from pathlib import Path
from typing import Dict, Optional, Any, Set

from PIL import Image
from blurhash import encode
from nbt import nbt

# --- Constants ---
THEME_DIR = Path(r"C:\Users\user\Desktop\minecolonies\medievaloak")
REPO_DIR = Path(__file__).parent.parent
IMAGES_DIR = REPO_DIR / "public/minecolonies"
OUTPUT_JSON = REPO_DIR / "src/assets/themes.json"
BUILDING_IGNORE_FILE = Path(__file__).parent / "buildings.ignore"

# Block to building display name mapping
BLOCK_TO_BUILDING_DISPLAY_NAME = {
    "blockhutfield": "Field",
    "blockhutplantationfield": "Plantation Field",
    "blockhutalchemist": "Alchemist Tower",
    "blockhutkitchen": "Cookery",
    "blockhutgraveyard": "Graveyard",
    "blockhutnetherworker": "Nether Mine",
    "blockhutarchery": "Archery",
    "blockhutbaker": "Bakery",
    "blockhutbarracks": "Barracks",
    "blockhutbarrackstower": "Barracks Tower",
    "blockhutbeekeeper": "Apiary",
    "blockhutblacksmith": "Blacksmith's Hut",
    "blockhutbuilder": "Builder's Hut",
    "blockhutchickenherder": "Chicken Farmer's Hut",
    "blockhutcitizen": "Residence",
    "blockhutcombatacademy": "Combat Academy",
    "blockhutcomposter": "Composter's Hut",
    "blockhutconcretemixer": "Concrete Mixer's Hut",
    "blockhutcook": "Restaurant",
    "blockhutcowboy": "Cowhand's Hut",
    "blockhutcrusher": "Crusher",
    "blockhutdeliveryman": "Courier's Hut",
    "blockhutdyer": "Dyer's Hut",
    "blockhutenchanter": "Enchanter's Tower",
    "blockhutfarmer": "Farm",
    "blockhutfisherman": "Fisher's Hut",
    "blockhutfletcher": "Fletcher's Hut",
    "blockhutflorist": "Flower Shop",
    "blockhutglassblower": "Glassblower's Hut",
    "blockhutguardtower": "Guard Tower",
    "blockhuthospital": "Hospital",
    "blockhutlibrary": "Library",
    "blockhutlumberjack": "Forester's Hut",
    "blockhutmechanic": "Mechanic's Hut",
    "blockhutminer": "Mine",
    "blockhutplantation": "Plantation",
    "blockhutrabbithutch": "Rabbit Hutch",
    "blockhutsawmill": "Sawmill",
    "blockhutschool": "School",
    "blockhutshepherd": "Shepherd's Hut",
    "blockhutsifter": "Sifter",
    "blockhutsmeltery": "Smeltery",
    "blockhutstonemason": "Stonemason's Hut",
    "blockhutstonesmeltery": "Stone Smeltery",
    "blockhutswineherder": "Swineherd's Hut",
    "blockhuttavern": "Tavern",
    "blockhuttownhall": "Town Hall",
    "blockhutuniversity": "University",
    "blockhutwarehouse": "Warehouse",
    "blockhutmysticalsite": "Mystical Site",
}


def load_ignored_patterns(ignore_file: Path) -> re.Pattern:
    return re.compile("|".join([line.strip() for line in ignore_file.read_text().splitlines() if line.strip()]))


def parse_building_filename(file_name: str) -> Dict[str, Any]:
    match = re.match(r"^(.+?)(\d?)\.blueprint$", file_name)
    if not match:
        raise ValueError(f"File name doesn't match the pattern: {file_name}")
    return {"buildingName": match[1], "buildingLevel": int(match[2]) if match[2] else False}


def get_building_hut_blocks(nbt_data: nbt.NBTFile) -> Set[str]:
    hut_blocks = set()
    for block in nbt_data.get("palette"):
        block_name = block.get("Name").value
        if block_name.startswith("minecolonies:blockhut"):
            short_name = block_name[len("minecolonies:"):]
            if short_name in BLOCK_TO_BUILDING_DISPLAY_NAME:
                hut_blocks.add(short_name)
    return hut_blocks


def read_blueprint_nbt(file_path: Path) -> nbt.NBTFile:
    with file_path.open("rb") as f:
        return nbt.NBTFile(fileobj=f)


def find_building_image(
        blueprint_path: Path, building_name: str, building_level: Optional[int], theme_images_dir: Path
) -> Dict[str, bool]:
    blueprint_rel_path = blueprint_path.relative_to(THEME_DIR)
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
        file_path: Path, parent_category_object: Dict, theme_images_dir: Path
):
    file_name = file_path.name
    parsed = parse_building_filename(file_name)

    nbt_data = read_blueprint_nbt(file_path)
    hut_blocks = get_building_hut_blocks(nbt_data)
    building_images = find_building_image(file_path, parsed["buildingName"], parsed["buildingLevel"], theme_images_dir)

    if not building_images["frontExists"]:
        print(f"[WARN] Required front image not found: {file_path}")
        return

    building_obj = parent_category_object.setdefault(
        parsed["buildingName"], {"levels": parsed["buildingLevel"]}
    )

    blur_hashes = [encode_image_to_blurhash(building_images["front"])]

    if building_images["backExists"]:
        building_obj["back"] = True
        blur_hashes.append(encode_image_to_blurhash(building_images["back"]))
    if hut_blocks:
        building_obj["hutBlocks"] = list(hut_blocks)

    building_obj["blur"] = blur_hashes

    if building_obj["levels"] is False and parsed["buildingLevel"] is not False:
        raise ValueError(
            "Existing building object has levels=False, but a leveled version was found."
        )

    if building_obj["levels"] is not False and parsed["buildingLevel"] is not False:
        building_obj["levels"] = max(building_obj["levels"], parsed["buildingLevel"])


def handle_file(
        file_path: Path, parent_category_object: Dict, ignored_pattern: re.Pattern, theme_images_dir: Path
):
    if ignored_pattern.search(str(file_path)):
        return

    if file_path.suffix != ".blueprint":
        print(f"[WARN] File is not a blueprint: {file_path}")
        return

    process_building(file_path, parent_category_object, theme_images_dir)


def handle_building_categories(
        category_path: Path, parent_object: Dict, ignored_pattern: re.Pattern, theme_images_dir: Path
):
    if ignored_pattern.search(str(category_path)):
        return

    building_group_name = category_path.name
    if building_group_name not in parent_object:
        parent_object[building_group_name] = {"blueprints": {}, "categories": {}}

    building_group = parent_object[building_group_name]

    for item in category_path.iterdir():
        if item.is_file():
            handle_file(item, building_group["blueprints"], ignored_pattern, theme_images_dir)
        else:
            handle_building_categories(item, building_group["categories"], ignored_pattern, theme_images_dir)


def main():
    ignored_pattern = load_ignored_patterns(BUILDING_IGNORE_FILE)
    themes = {}

    if OUTPUT_JSON.exists():
        themes = json.loads(OUTPUT_JSON.read_text())

    pack_meta_file = THEME_DIR / "pack.json"
    pack_meta = json.loads(pack_meta_file.read_text())

    theme_images_dir = IMAGES_DIR / THEME_DIR.name
    building_data = {"blueprints": {}, "categories": {}}

    for item in THEME_DIR.iterdir():
        if item.name in ["pack.json", f"{THEME_DIR.name}.png"]:
            continue

        if item.is_file():
            handle_file(item, building_data["blueprints"], ignored_pattern, theme_images_dir)
        else:
            handle_building_categories(item, building_data["categories"], ignored_pattern, theme_images_dir)

    themes[THEME_DIR.name] = {"displayName": pack_meta["name"], "authors": pack_meta["authors"],
                              "buildingData": building_data}

    OUTPUT_JSON.write_text(json.dumps(themes))


if __name__ == "__main__":
    main()
