/**
 * This script takes in two folders:
 * - The first folder is the minecolonies theme itself, containing the blueprints.
 * - The second folder is in this repo and contains the images for the blueprints.
 *
 * The script will find the blueprints which have respective images and modify the themes.json file to
 * include the building data.
 *
 * This script is meant to be run when files are modified in either of the two folders.
 *
 * Buildings can be ignored by adding regex patterns to the buildings.ignore file.
 */

import fs from "fs";
import path from "node:path";
import nbt from "prismarine-nbt";

const here = path.dirname(import.meta.url.replace("file:///", ""));
const repoDir = path.resolve(here, "../");

const themeDir = path.normalize("C:\\Users\\user\\Desktop\\minecolonies\\caledonia");
const imagesDir = path.join(repoDir, "/public/minecolonies");
const outputJson = path.join(repoDir, "src/assets/themes.json");
const buildingIgnoreFile = path.join(here, "buildings.ignore");

const ignoredPattern = new RegExp(
    fs.readFileSync(buildingIgnoreFile).toString().split("\n").filter(Boolean).join("|"),
);

/**
 * The building object structure:
 * @typedef { {levels: number | false, back?: boolean, hutBlocks?: string[]} } BuildingObject
 * */

/**
 * Blueprints object structure:
 * @typedef { { [buildingName: string]: BuildingObject } } BuildingData
 * */

/**
 * Category object structure:
 * @typedef { { blueprints: BuildingData, categories: { [categoryName: string]: CategoryObject } } } CategoryObject
 * */

/**
 * Themes object structure:
 * @typedef { { [themeName: string]: { displayName: string, authors: string[], buildingData: CategoryObject } } } Themes
 */

/**
 * Reads a .blueprint file and returns the parsed NBT data.
 * @param {string} filePath
 */
async function readBlueprintNbt(filePath) {
    const buffer = fs.readFileSync(filePath);
    return await nbt.parse(buffer);
}

// For future implementation
// function getBuildingSize(nbt) {
//     return {
//         x: nbt.value["size_x"].value,
//         y: nbt.value["size_y"].value,
//         z: nbt.value["size_z"].value,
//     };
// }

const blockToBuildingDisplayName = {
    blockhutfield: "Field",
    blockhutplantationfield: "Plantation Field",
    blockhutalchemist: "Alchemist Tower",
    blockhutkitchen: "Cookery",
    blockhutgraveyard: "Graveyard",
    blockhutnetherworker: "Nether Mine",
    blockhutarchery: "Archery",
    blockhutbaker: "Bakery",
    blockhutbarracks: "Barracks",
    blockhutbarrackstower: "Barracks Tower",
    blockhutbeekeeper: "Apiary",
    blockhutblacksmith: "Blacksmith's Hut",
    blockhutbuilder: "Builder's Hut",
    blockhutchickenherder: "Chicken Farmer's Hut",
    blockhutcitizen: "Residence",
    blockhutcombatacademy: "Combat Academy",
    blockhutcomposter: "Composter's Hut",
    blockhutconcretemixer: "Concrete Mixer's Hut",
    blockhutcook: "Restaurant",
    blockhutcowboy: "Cowhand's Hut",
    blockhutcrusher: "Crusher",
    blockhutdeliveryman: "Courier's Hut",
    blockhutdyer: "Dyer's Hut",
    blockhutenchanter: "Enchanter's Tower",
    blockhutfarmer: "Farm",
    blockhutfisherman: "Fisher's Hut",
    blockhutfletcher: "Fletcher's Hut",
    blockhutflorist: "Flower Shop",
    blockhutglassblower: "Glassblower's Hut",
    blockhutguardtower: "Guard Tower",
    blockhuthospital: "Hospital",
    blockhutlibrary: "Library",
    blockhutlumberjack: "Forester's Hut",
    blockhutmechanic: "Mechanic's Hut",
    blockhutminer: "Mine",
    blockhutplantation: "Plantation",
    blockhutrabbithutch: "Rabbit Hutch",
    blockhutsawmill: "Sawmill",
    blockhutschool: "School",
    blockhutshepherd: "Shepherd's Hut",
    blockhutsifter: "Sifter",
    blockhutsmeltery: "Smeltery",
    blockhutstonemason: "Stonemason's Hut",
    blockhutstonesmeltery: "Stone Smeltery",
    blockhutswineherder: "Swineherd's Hut",
    blockhuttavern: "Tavern",
    blockhuttownhall: "Town Hall",
    blockhutuniversity: "University",
    blockhutwarehouse: "Warehouse",
    blockhutmysticalsite: "Mystical Site",
};

/**
 * Find the minecolonies hut blocks in the blueprint.
 * @param {NBT} nbt
 * @returns {string[]}
 */
function getBuildingHutBlocks(nbt) {
    const hutBlocks = new Set();
    for (const block of nbt.value["palette"].value.value) {
        const blockId = block["Name"].value;
        if (!blockId.startsWith("minecolonies:blockhut")) {
            continue;
        }
        const blockName = blockId.slice(13);
        if (blockToBuildingDisplayName[blockName]) {
            hutBlocks.add(blockName);
        }
    }
    // Return array where "field" is always last
    return Array.from(hutBlocks).sort((a, b) => (a === "field" ? 1 : b === "field" ? -1 : 0));
}

/**
 * Parses the building name and level from the blueprint file name.
 * @param fileName
 * @return {{buildingName: *, buildingLevel: (number|false)}}
 */
function parseBuildingFilename(fileName) {
    const pattern = /^(.+?)(\d?)\.blueprint$/;
    const match = fileName.match(pattern);
    if (!match) {
        throw new Error("File name doesn't match the pattern: " + fileName);
    }
    return {
        buildingName: match[1],
        buildingLevel: match[2] ? parseInt(match[2]) : false,
    };
}

/**
 * Finds the building image for the given blueprint.
 * @param {string} blueprintPath
 * @param {string} buildingName
 * @param {number | false} buildingLevel
 * @param {object} theme
 */
function findBuildingImage(blueprintPath, buildingName, buildingLevel, theme) {
    // Get the directory of the blueprint file relative to the blueprints directory
    const blueprintDir = path.dirname(blueprintPath);
    const blueprintDirFromRoot = blueprintDir.replace(theme.blueprintsDir, "");
    const buildingImageDir = path.join(theme.imagesDir, blueprintDirFromRoot, buildingName);

    let fileExtension = "jpg";

    let frontPath, backPath;
    if (buildingLevel === false) {
        frontPath = path.join(buildingImageDir, `front.${fileExtension}`);
        backPath = path.join(buildingImageDir, `back.${fileExtension}`);
    } else {
        frontPath = path.join(buildingImageDir, `${buildingLevel}front.${fileExtension}`);
        backPath = path.join(buildingImageDir, `${buildingLevel}back.${fileExtension}`);
    }

    const frontExists = fs.existsSync(frontPath);
    const backExists = fs.existsSync(backPath);

    if (!frontExists && !backExists) {
        console.warn(`[warn] Building image not found: ${blueprintPath}`);
    }

    return {
        frontExists,
        backExists,
    };
}

/**
 * Processes a building file and adds it to the parent category object.
 * @param filePath
 * @param parentCategoryObject
 * @param theme
 * @return {Promise<void>}
 */
async function processBuilding(filePath, parentCategoryObject, theme) {
    const fileName = path.basename(filePath);
    const { buildingName, buildingLevel } = parseBuildingFilename(fileName);

    const { parsed: nbt } = await readBlueprintNbt(filePath);
    const hutBlocks = getBuildingHutBlocks(nbt);

    const buildingImages = findBuildingImage(filePath, buildingName, buildingLevel, theme);

    if (!buildingImages.frontExists) {
        console.log(`[warn] Required front image not found: ${filePath}`);
    }

    // Currently only one level is supported for simplicity, but
    // this can be changed in the future. Just add one nesting with like `images: {[level: number]: ... }`
    // instead of front being implicit and back optional key.

    /** @type {BuildingObject} */
    const buildingObject = (parentCategoryObject[buildingName] ??= { levels: buildingLevel });
    if (buildingImages.backExists) {
        parentCategoryObject[buildingName].back = true;
    }
    if (hutBlocks.length > 0) {
        parentCategoryObject[buildingName].hutBlocks = hutBlocks;
    }

    if (buildingObject.levels === false && buildingLevel !== false)
        throw new Error(
            "Existing building object has levels=false, but a leveled version of the same building was found",
        );

    if (buildingObject.levels !== false && buildingLevel !== false) {
        buildingObject.levels = Math.max(buildingObject.levels, buildingLevel);
    }
}

async function handleFile(filePath, parentCategoryObject, theme) {
    if (ignoredPattern.test(filePath.replaceAll(path.sep, path.posix.sep))) {
        return;
    }

    const filename = path.basename(filePath);
    if (["icon.png", "icon_disabled.png"].includes(filename)) {
        return;
    }
    if (!filePath.endsWith(".blueprint")) {
        console.warn("[warn] File is not a blueprint: " + filePath);
        return;
    }
    await processBuilding(filePath, parentCategoryObject, theme);
}

async function handleBuildingCategories(buildingGroupPath, parentObject, theme) {
    if (ignoredPattern.test(buildingGroupPath.replaceAll(path.sep, path.posix.sep))) {
        return;
    }

    const buildingGroupName = path.basename(buildingGroupPath);
    const buildingGroup = (parentObject[buildingGroupName] ??= {
        blueprints: {},
        categories: {},
    });

    for (const categoryDirName of fs.readdirSync(buildingGroupPath)) {
        const categoryDirPath = path.join(buildingGroupPath, categoryDirName);
        if (fs.lstatSync(categoryDirPath).isFile()) {
            await handleFile(categoryDirPath, buildingGroup.blueprints, theme);
        } else {
            await handleBuildingCategories(categoryDirPath, buildingGroup.categories, theme);
        }
    }
}

async function main(themeDir) {
    let themes;
    if (fs.existsSync(outputJson)) {
        themes = JSON.parse(fs.readFileSync(outputJson).toString());
    } else {
        themes = {};
    }

    themeDir = path.normalize(themeDir);
    const themeDirName = path.basename(themeDir);

    const packMetaFile = themeDir + "/pack.json";
    const packMeta = JSON.parse(fs.readFileSync(packMetaFile).toString());
    const theme = {
        displayName: packMeta["name"],
        authors: packMeta["authors"],
        blueprintsDir: themeDir,
        imagesDir: path.join(imagesDir, themeDirName),
        buildingData: {
            blueprints: {},
            categories: {},
        },
        imports: {},
    };

    for (const name of fs.readdirSync(themeDir)) {
        const path = themeDir + "/" + name;
        if (path === packMetaFile || path === `${themeDir}/${themeDirName}.png`) {
            continue;
        }

        if (fs.lstatSync(path).isFile()) {
            await handleFile(path, theme.buildingData.blueprints, theme);
        } else {
            await handleBuildingCategories(path, theme.buildingData.categories, theme);
        }
    }

    themes[themeDirName] = {
        displayName: theme.displayName,
        authors: theme.authors,
        buildingData: theme.buildingData,
    };
    fs.writeFileSync(outputJson, JSON.stringify(themes, null, 4));
}

main(themeDir).then(() => console.log("done"));
