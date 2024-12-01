import fs from "fs";
import path from "node:path";
import nbt from "prismarine-nbt";

const here = path.dirname(import.meta.url.replace("file:///", ""))
const themeDir = path.normalize("C:\\Users\\user\\Desktop\\minecolonies\\medievaloak")
const imagesDir = path.join(here, "public/minecolonies")
const outputJson = path.join(here, "src/assets/theme.json")
const buildingIgnoreFile = path.join(here, "buildings.ignore")

const ignoredPattern = new RegExp(
    fs
        .readFileSync(buildingIgnoreFile)
        .toString()
        .split("\n")
        .filter(Boolean)
        .join("|")
)

async function readParsedNbtData(filePath) {
    const buffer = fs.readFileSync(filePath)
    return await nbt.parse(buffer)
}

function getBuildingSize(nbt) {
    return {
        x: nbt.value["size_x"].value,
        y: nbt.value["size_y"].value,
        z: nbt.value["size_z"].value
    }
}

function getBuildingHutBlocks(nbt) {
    const hutBlocks = []
    for (const block of nbt.value["palette"].value.value) {
        const blockId = block["Name"].value
        if (!blockId.startsWith("minecolonies:")) {
            continue
        }
        const blockName = blockId.slice(13)
        if (blockToBuildingDisplayName[blockName]) {
            hutBlocks.push(blockName)
        }
    }
    return hutBlocks
}

function parseBuildingFilename(fileName) {
    const pattern = /^(.+?)(\d?)\.blueprint$/
    const match = fileName.match(pattern)
    if (!match) {
        throw new Error("File name doesn't match the pattern: " + fileName)
    }
    return {
        buildingName: match[1],
        buildingLevel: match[2] ? parseInt(match[2]) : false
    }
}

/**
 * @param {string} blueprintPath
 * @param {string} buildingName
 * @param {number | false} buildingLevel
 * @param {object} theme
 */
function findBuildingImage(
    blueprintPath,
    buildingName,
    buildingLevel,
    theme,
) {
    const blueprintDir = path.dirname(blueprintPath)
    const blueprintDirFromRoot = blueprintDir.replace(theme.blueprintsDir, "")
    const buildingImageDir = path.join(theme.imagesDir, blueprintDirFromRoot, buildingName)

    let frontPath, backPath
    if (buildingLevel === false) {
        frontPath = path.join(buildingImageDir, "front.jpg")
        backPath = path.join(buildingImageDir, "back.jpg")
    } else {
        frontPath = path.join(buildingImageDir, `${buildingLevel}front.jpg`)
        backPath = path.join(buildingImageDir, `${buildingLevel}back.jpg`)
    }

    const frontExists = fs.existsSync(frontPath)
    const backExists = fs.existsSync(backPath)

    if (!frontExists && !backExists) {
        console.warn(`[warn] Building image not found: ${blueprintPath}`)
    }

    return {
        frontExists,
        backExists,
    }

}


async function processBuilding(
    filePath,
    parentCategoryObject,
    theme
) {
    const fileName = path.basename(filePath)
    const {buildingName, buildingLevel} = parseBuildingFilename(fileName)

    const {parsed: nbt} = await readParsedNbtData(filePath)
    const size = getBuildingSize(nbt)
    const hutBlocks = getBuildingHutBlocks(nbt)

    const buildingImages = findBuildingImage(filePath, buildingName, buildingLevel, theme)

    if (!parentCategoryObject[buildingName]) {
        parentCategoryObject[buildingName] = {
            size,
            hutBlocks,
            levels: buildingLevel,
            images: buildingLevel === false ? buildingImages : {[buildingLevel]: buildingImages}
        }
    } else {
        if (buildingLevel === false) throw new Error("Existing building object has levels=false, but a leveled version of the same building was found")

        const existingBuildingObject = parentCategoryObject[buildingName]
        existingBuildingObject.levels = Math.max(existingBuildingObject.levels, buildingLevel)
        if (existingBuildingObject.images[buildingLevel]) {
            throw new Error("Building object already has an image for level " + buildingLevel)
        }
        existingBuildingObject.images[buildingLevel] = buildingImages
    }
}

const blockToBuildingDisplayName = {
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


async function handleFile(
    filePath,
    parentCategoryObject,
    theme
) {
    if (ignoredPattern.test(filePath.replaceAll(path.sep, path.posix.sep))) {
        return
    }

    const filename = path.basename(filePath)
    if (["icon.png", "icon_disabled.png"].includes(filename)) {
        return
    }
    if (!filePath.endsWith(".blueprint")) {
        console.warn("[warn] File is not a blueprint: " + filePath)
        return
    }
    await processBuilding(filePath, parentCategoryObject, theme)
}


async function handleBuildingCategories(
    buildingGroupPath,
    parentObject,
    theme
) {
    if (ignoredPattern.test(buildingGroupPath.replaceAll(path.sep, path.posix.sep))) {
        return
    }

    const buildingGroupName = path.basename(buildingGroupPath)
    const buildingGroup = parentObject[buildingGroupName] ??= {
        blueprints: {},
        categories: {}
    }

    for (const categoryDirName of fs.readdirSync(buildingGroupPath)) {
        const categoryDirPath = path.join(buildingGroupPath, categoryDirName)
        if (fs.lstatSync(categoryDirPath).isFile()) {
            await handleFile(categoryDirPath, buildingGroup.blueprints, theme)
        } else {
            await handleBuildingCategories(categoryDirPath, buildingGroup.categories, theme)
        }
    }
}


async function main(themeDir) {
    themeDir = path.normalize(themeDir)
    const themeDirName = path.basename(themeDir)

    const packMetaFile = themeDir + "/pack.json"
    const packMeta = JSON.parse(fs.readFileSync(packMetaFile).toString())
    const theme = {
        displayName: packMeta["name"],
        authors: packMeta["authors"],
        blueprintsDir: themeDir,
        imagesDir: path.join(imagesDir, themeDirName),
        buildingData: {
            blueprints: {},
            categories: {}
        },
        imports: {}
    }


    for (const name of fs.readdirSync(themeDir)) {
        const path = themeDir + "/" + name
        if (path === packMetaFile || path === `${themeDir}/${themeDirName}.png`) {
            continue
        }

        if (fs.lstatSync(path).isFile()) {
            await handleFile(path, theme.buildingData.blueprints, theme)
        } else {
            await handleBuildingCategories(path, theme.buildingData.categories, theme)
        }
    }

    const output = {
        [themeDirName]: {
            displayName: theme.displayName,
            authors: theme.authors,
            buildingData: theme.buildingData,
        }
    }

    fs.writeFileSync(outputJson, JSON.stringify(output, null, 4))

}

main(themeDir).then(r => console.log("done"))