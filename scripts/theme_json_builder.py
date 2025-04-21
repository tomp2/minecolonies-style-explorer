from __future__ import annotations

import hashlib
import json
import logging
import re
import time
from concurrent.futures.process import ProcessPoolExecutor
from dataclasses import dataclass, field, asdict
from datetime import datetime
from functools import cached_property, lru_cache
from pathlib import Path
from typing import TypedDict, Literal

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
    STYLECOLONIES / "highmagic",
    STYLECOLONIES / "fairytale",
    STYLECOLONIES / "functionalfantasy",
    UNOFFICIAL / "littleton",
    UNOFFICIAL / "byzantine",
    UNOFFICIAL / "shogun",
]
COMBINED_BUILDINGS_PATH = REPO_DIR / "scripts/combined_buildings.json"
BUILDING_IGNORE = REPO_DIR / "scripts/buildings.ignore"
STYLE_INFO_PATH = REPO_DIR / "src/assets/styles.json"
MISSING_STYLE_INFO_PATH = REPO_DIR / "src/assets/missing_styles.json"
CACHE_DIR = REPO_DIR / "scripts/cache"

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


# --- Types ---

@dataclass
class BuildingObject:
    size: tuple[int, int, int]
    blur: list[str]
    back: bool | None = None
    hutBlocks: list[str] | None = None


@dataclass
class CachedBuildingObject:
    name: str
    level: int | Literal[False]
    size: tuple[int, int, int] | Literal["unknown"] = "unknown"
    hutBlocks: list[str] | set[str] | Literal["unknown"] = "unknown"


@dataclass
class Category:
    blueprints: dict[str, BuildingObject] = field(default_factory=dict)
    categories: dict[str, Category] = field(default_factory=dict)


@dataclass
class StyleJson:
    displayName: str
    authors: list[str]
    blueprints: dict[str, BuildingObject]
    categories: dict[str, Category]


@dataclass
class StyleInfo:
    name: str
    displayName: str
    type: str
    authors: list[str]
    addedAt: str | None = None
    wip: bool = False


@dataclass
class PackCache:
    buildings: dict[str, CachedBuildingObject] = field(default_factory=dict)
    blurHashes: dict[str, str] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: dict) -> PackCache:
        buildings = {k: CachedBuildingObject(**v) for k, v in data.get("buildings", {}).items()}
        blur_hashes = data.get("blurHashes", {})
        return cls(buildings=buildings, blurHashes=blur_hashes)


# --- Prepared file contents ---
COMBINED_BUILDINGS = json.loads(COMBINED_BUILDINGS_PATH.read_text())
STYLE_INFO = {style["name"]: style for style in json.loads(STYLE_INFO_PATH.read_text())["styles"]}
ignored_pattern = re.compile(
    "|".join([f"^{line.strip()}$" for line in BUILDING_IGNORE.read_text().splitlines() if
              line.strip() and not line.startswith("#")]))
CACHE_DIR.mkdir(exist_ok=True)

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


def get_file_hash(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()


def format_json(obj: any) -> any:
    if isinstance(obj, dict):
        return {key: format_json(value) for key, value in sorted(obj.items()) if value is not None}
    elif isinstance(obj, (list, set)):
        return sorted(format_json(item) for item in obj if item is not None)
    else:
        return obj


class BuildingImage(Path):
    def sha256(self):
        return get_file_hash(self)

    def blurhash(self) -> str:
        with Image.open(self) as image:
            image.thumbnail((100, 100))
            hash_result = encode(image, x_components=4, y_components=4)
        return hash_result


class BlueprintFile:
    def __init__(self, file_path: Path, style: Style):
        self.file_path = file_path
        self._style = style
        self.file_hash = get_file_hash(file_path)

        if cached_data := self._style.cache_buildings.get(self.file_hash):
            self.cached_data = cached_data
        else:
            cached_data = CachedBuildingObject(name=self._name, level=self._level)
            self.cached_data = self._style.cache_buildings.setdefault(self.file_hash, cached_data)

        self.name = self.cached_data.name
        self.level = self.cached_data.level

    def get_hut_blocks(self):
        if self.cached_data.hutBlocks != "unknown":
            return self.cached_data.hutBlocks

        hut_blocks = self._get_hut_blocks()
        self.cached_data.hutBlocks = hut_blocks if hut_blocks else None
        return hut_blocks

    def get_size(self):
        if self.cached_data.size != "unknown":
            return self.cached_data.size

        self.cached_data.size = self._calculate_building_size()
        return self.cached_data

    def _get_primary_offset(self):
        data = self._read()
        optional_data = data.get("optional_data")
        structurize = optional_data.get("structurize")
        primary_offset = structurize.get("primary_offset")
        return {
            "x": primary_offset.get("x").value,
            "y": primary_offset.get("y").value,
            "z": primary_offset.get("z").value
        }

    @lru_cache
    def _read(self):
        with self.file_path.open("rb") as f:
            return nbt.NBTFile(fileobj=f)

    @cached_property
    def _size_x(self):
        return self._read().get("size_x").value

    @cached_property
    def _size_y(self):
        return self._read().get("size_y").value

    @cached_property
    def _size_z(self):
        return self._read().get("size_z").value

    def _get_is_minecolonies_building(self):
        tile_entity: TAG_Compound
        for tile_entity in self._read().get("tile_entities"):
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
    def _name_and_level(self) -> TypedDict("BuildingName",
                                           {"buildingName": str, "buildingLevel": int | Literal[False]}):
        # If the building is a leveling building, the last number on the name indicates the level.
        # Otherwise, the building doesn't have levels, and number suffixes are to be included in the name.
        match = re.match(r"^(.+?)(\d*?)\.blueprint$", self.file_path.name)
        if not match:
            raise ValueError(f"File name doesn't match the pattern: {self.file_path.name}")

        if self._get_is_minecolonies_building():
            if len(match.groups()) == 1:
                return {"buildingName": match[0], "buildingLevel": False}
            else:
                return {"buildingName": match[1], "buildingLevel": int(match[2]) if match[2] else False}

        return {"buildingName": self.file_path.stem, "buildingLevel": False}

    @property
    def _name(self):
        return self._name_and_level["buildingName"]

    @property
    def _level(self):
        return self._name_and_level["buildingLevel"]

    def _get_hut_blocks(self):
        primary_offset = self._get_primary_offset()

        hut_blocks = set()
        for block in self._read().get("palette"):
            block_name = block.get("Name").value
            if block_name.startswith("minecolonies:blockhut"):
                short_name = block_name[len("minecolonies:blockhut"):]
                if short_name in HUT_BLOCKS:
                    hut_blocks.add(short_name)

        raw_data = self._get_raw_block_data()
        hut_y = primary_offset["y"]
        hut_x = primary_offset["x"]
        hut_z = primary_offset["z"]
        primary_hut = raw_data[hut_y, hut_z, hut_x]
        material_palette = self._read().get("palette")
        primary_hut_name = material_palette[primary_hut].get("Name").value

        if primary_hut_name.startswith("minecolonies:blockhut"):
            primary_hut_name = primary_hut_name[len("minecolonies:blockhut"):]
            hut_blocks.discard(primary_hut_name)
            return [primary_hut_name, *hut_blocks]

        return list(hut_blocks)

    def _get_raw_block_data(self):
        """
        The Structurize-mod stored the blocks in a 1-dimensional array of 32-bit integers.
        The 32-bit integer is split into two 16-bit values, where the left and right 16 bits represent
        two different blocks (probably to save space?)
        """
        raw_block_data = self._read().get("blocks")
        data = np.array(raw_block_data, dtype=np.uint32)
        # Split each 32-bit integer into two 16-bit values
        left_16_bits = (data >> 16) & 0xFFFF
        right_16_bits = data & 0xFFFF
        # Interleave the left and right 16-bit values
        one_dim_array = np.zeros(data.size * 2, dtype=np.uint16)
        one_dim_array[0::2] = left_16_bits
        one_dim_array[1::2] = right_16_bits
        # If the size of the building is odd, the last 16-bits are assumed to be padding
        if (self._size_x * self._size_y * self._size_z) % 2 != 0:
            one_dim_array = one_dim_array[:-1]
        return one_dim_array.reshape((self._size_y, self._size_z, self._size_x))

    def _calculate_building_size(self):
        palette_indices = self._get_raw_block_data()

        material_palette = self._read().get("palette")
        solidity_palette = np.array([entry.get("Name").value not in IGNORED_BLOCKS for entry in material_palette],
                                    dtype=bool)

        palette_indices_solidity = solidity_palette[palette_indices]

        y_slices_solidity = palette_indices_solidity.any(axis=(1, 2))
        x_slices_solidity = palette_indices_solidity.any(axis=(0, 2))
        z_slices_solidity = palette_indices_solidity.any(axis=(0, 1))

        bottom_y = np.argmax(y_slices_solidity)
        top_y = self._size_y - 1 - np.argmax(y_slices_solidity[::-1])

        left_x = np.argmax(x_slices_solidity)
        right_x = self._size_x - 1 - np.argmax(x_slices_solidity[::-1])

        front_z = np.argmax(z_slices_solidity)
        back_z = self._size_z - 1 - np.argmax(z_slices_solidity[::-1])

        return int(right_x - left_x + 1), int(top_y - bottom_y + 1), int(back_z - front_z + 1)


def encode_image_to_blurhash(image_path: Path) -> str:
    with Image.open(image_path) as image:
        image.thumbnail((100, 100))
        hash_result = encode(image, x_components=4, y_components=4)
    return hash_result


def add_combined_buildings(theme_id: str, categories_root: Category):
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
        building_size = None
        for blueprint in combined_building["blueprints"]:
            blueprint_path = theme_source_dir.joinpath(*category_path).joinpath(blueprint)
            blueprint = BlueprintFile(blueprint_path)
            combined_hut_blocks |= set(blueprint._get_hut_blocks())

            if not building_size:
                building_size = blueprint._calculate_building_size()
            else:
                prev_volume = building_size[0] * building_size[1] * building_size[2]
                current_size = blueprint._calculate_building_size()
                current_volume = current_size[0] * current_size[1] * current_size[2]
                if current_volume > prev_volume:
                    building_size = current_size

        building_object = {
            "displayName": combined_building["displayName"],
            "size": building_size
        }

        if combined_hut_blocks:
            building_object["hutBlocks"] = list(combined_hut_blocks)

        combined_images_dir = IMAGES_ROOT / theme_name / "/".join(category_path) / name
        front = combined_images_dir / "front.jpg"
        back = combined_images_dir / "back.jpg"

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


class Style:
    def __init__(self, path: Path):
        self.path = path
        self.dir_name = path.name
        self.img_dir = IMAGES_ROOT / self.dir_name
        self.pack_meta_path = path / "pack.json"

        if not self.path.exists():
            raise FileNotFoundError(f"Path does not exist: {self.path}")
        if not self.pack_meta_path.exists():
            raise FileNotFoundError(f"Pack meta file does not exist: {self.pack_meta_path}")
        if not self.img_dir.exists():
            raise FileNotFoundError(f"Image directory does not exist: {self.img_dir}")

        self.root: Category = Category()
        self.pack_meta = json.loads(self.pack_meta_path.read_text())
        self.style_type = path.relative_to(BLUEPRINTS).parent.as_posix()
        self.style_info = StyleInfo(
            displayName=self.pack_meta["name"],
            authors=self.pack_meta["authors"],
            name=self.dir_name,
            type=self.style_type
        )
        self.style_json = StyleJson(
            displayName=self.pack_meta["name"],
            authors=self.pack_meta["authors"],
            blueprints=self.root.blueprints,
            categories=self.root.categories
        )

        self._cache_file_path = CACHE_DIR / f"{self.dir_name}.json"
        self._cache = PackCache()
        if self._cache_file_path.exists():
            self._cache = PackCache.from_dict(json.loads(self._cache_file_path.read_text()))

    @property
    def cache_buildings(self):
        return self._cache.buildings

    @property
    def cache_blur_hashes(self):
        return self._cache.blurHashes

    def _blur_images(self, images: list[BuildingImage]) -> list[str]:
        blurhashes = []
        for image in images:
            if not image.exists():
                continue
            sha = image.sha256()
            if sha in self.cache_blur_hashes:
                blurhash = self.cache_blur_hashes[sha]
            else:
                blurhash = image.blurhash()
                logging.info(f"Cache miss for {image.relative_to(self.img_dir.parent)}")

            blurhashes.append(blurhash)
            self.cache_blur_hashes[sha] = blurhash

        return blurhashes

    # def find_building_image(self, blueprint_path: Path, building_name: str) -> tuple[BuildingImage, BuildingImage]:
    #     blueprint_rel_path = blueprint_path.relative_to(self.path)
    #     image_dir = self.img_dir / blueprint_rel_path.parent / building_name.strip()
    #     front = BuildingImage(image_dir / "front.jpg")
    #     back = BuildingImage(image_dir / "back.jpg")
    #     return front, back

    def find_building_images(self, image_dir: Path) -> tuple[BuildingImage, BuildingImage]:
        front = BuildingImage(image_dir / "front.jpg")
        back = BuildingImage(image_dir / "back.jpg")
        return front, back

    def process_building(self, path: Path, parent: Category):
        if path.suffix != ".blueprint":
            return

        blueprint = BlueprintFile(path, self)

        # Skip ignored blueprints
        blueprint_path = f"{path.relative_to(self.path.parent).parent.as_posix()}/{blueprint.name}"
        if ignored_pattern.match(blueprint_path):
            return
        # Skip if a higher level blueprint exists
        higher_level_path = path.parent / f"{blueprint.name}{blueprint.level + 1}.blueprint"
        if higher_level_path.exists():
            return

        relative_path = path.relative_to(self.path).parent
        image_dir = self.img_dir / relative_path / blueprint.name.strip()
        [front, back] = self.find_building_images(image_dir)
        if not front.exists():
            logging.warning(f"[MISSING FRONT]: {front.relative_to(self.img_dir.parent)}")
            return

        parent.blueprints[blueprint.name.strip()] = BuildingObject(
            size=blueprint.get_size(),
            blur=self._blur_images([front, back]),
            back=back.exists(),
            hutBlocks=blueprint.get_hut_blocks()
        )

    def process_directory(self, dir_path: Path, parent: Category):
        category = parent.categories.setdefault(dir_path.name, Category())
        for dir_item in dir_path.iterdir():
            if dir_item.is_file():
                self.process_building(dir_item, category)
            else:
                self.process_directory(dir_item, category)

    def add_custom_building(self, combined_building):
        name = combined_building["name"]
        path = combined_building["path"].split("/")
        (theme_type, theme_name, *category_path) = path
        if not theme_name == self.dir_name or theme_type != self.style_type:
            return

        theme_source_dir = BLUEPRINTS / theme_type / theme_name
        if not theme_source_dir.exists():
            logging.warning(f"Theme directory not found: {theme_name}")
            return

        combined_hut_blocks = set()
        building_size: tuple[int, int, int] | None = None
        for blueprint in combined_building["blueprints"]:
            blueprint_path = theme_source_dir.joinpath(*category_path, blueprint)
            blueprint = BlueprintFile(blueprint_path, self)
            combined_hut_blocks |= set(blueprint.get_hut_blocks() or set())
            if not building_size:
                building_size = blueprint.get_size()
            else:
                size = blueprint.get_size()
                prev_area = building_size[0] * building_size[2]
                current_volume = size[0] * size[2]
                if current_volume > prev_area:
                    building_size = size

        if not building_size:
            raise ValueError(f"Building size not found for combined building {path}/{name}")

        image_dir = self.img_dir.joinpath(*category_path, name)
        [front, back] = self.find_building_images(image_dir)
        if not front.exists():
            logging.warning(f"[MISSING FRONT]: {front.relative_to(self.img_dir.parent)}")
            return

        current_category = self.root
        for category in category_path:
            if category not in current_category.categories:
                logging.warning(
                    f"Category directory {category} for combined building {category_path}/{name} "
                    f"doesn't exist in the style object so far."
                )
                return
            current_category = current_category.categories[category]

        current_category.blueprints[name] = BuildingObject(
            size=building_size,
            blur=self._blur_images([front, back]),
            back=back.exists(),
            hutBlocks=combined_hut_blocks
        )

    def run(self) -> Style:
        for dir_item in self.path.iterdir():
            if dir_item.is_file():
                self.process_building(dir_item, self.root)
            else:
                self.process_directory(dir_item, self.root)

        for combined_building in COMBINED_BUILDINGS:
            self.add_custom_building(combined_building)

        return self

    def get_root_categories(self) -> set[str]:
        return set(self.root.categories.keys())

    def write_cache(self):
        self._cache_file_path.write_text(json.dumps(asdict(self._cache)))

    def write_style_json(self):
        style_dict = format_json(asdict(self.style_json))
        self.img_dir.joinpath("style.json").write_text(json.dumps(style_dict))


def style_runner(style: Style) -> Style:
    logging.info(f"Processing theme: {style.dir_name}")
    style.run()
    style.write_cache()
    style.write_style_json()
    return style


def main():
    styles = [Style(theme_path) for theme_path in THEME_DIRS]

    logging.info("Processing themes...")
    start = time.perf_counter()
    with ProcessPoolExecutor() as executor:
        style_results = list(executor.map(style_runner, styles))
    # style_results = [style_runner(style) for style in styles]
    end = time.perf_counter()
    logging.info(f"Processed {len(style_results)} themes in {end - start:.2f} seconds")

    logging.info("Saving style infos...")
    categories = set()
    style_infos = []
    for style in style_results:
        categories.update(style.get_root_categories())
        prev_record = STYLE_INFO.get(style.dir_name)
        if prev_record and "addedAt" in prev_record and prev_record["addedAt"]:
            style.style_info.addedAt = prev_record["addedAt"]
        elif not prev_record:
            style.style_info.addedAt = datetime.now().strftime("%Y-%m-%d")

        style_infos.append(style.style_info)

    style_infos.sort(key=lambda x: x.displayName)
    output = {
        "styles": [asdict(style_info) for style_info in style_infos],
        "categories": sorted(categories)
    }
    STYLE_INFO_PATH.write_text(json.dumps(output, indent=2))

    logging.info("Listing missing styles for voting...")
    found_style_ids = {style.dir_name for style in styles}
    found_style_ids.update({style.style_info.displayName for style in styles})

    missing_styles_ids = []
    for style_type in BLUEPRINTS.iterdir():
        for style_dir in style_type.iterdir():
            if style_dir.is_dir() and style_dir.name not in found_style_ids:
                missing_styles_ids.append([style_type.name, style_dir.name])

    missing_styles = []
    for missing_style in missing_styles_ids:
        style_meta_path = BLUEPRINTS.joinpath(*missing_style, "pack.json")
        if not style_meta_path.exists():
            logging.warning(f"Style meta file not found for 'missing' style: {style_meta_path}")
            continue

        [_, style_name] = missing_style

        style_meta = json.loads(style_meta_path.read_text())
        missing_styles.append({
            "name": style_name,
            "displayName": style_meta["name"],
            "authors": style_meta["authors"],
        })
    missing_styles.sort(key=lambda x: x["displayName"])
    MISSING_STYLE_INFO_PATH.write_text(json.dumps(missing_styles, indent=2))

    logging.info("Generating sitemap...")
    generate_sitemap({style.dir_name for style in styles})

    logging.info("Done!")


if __name__ == "__main__":
    main()
