import { blockToDisplayName, HutBlock } from "@/lib/hut-blocks.ts";
import _missing_styles from "../assets/missing_styles.json";
import _styles from "../assets/styles.json";

export type StyleInfoJson = {
    name: string;
    displayName: string;
    authors: string[];
    type: "minecolonies" | "stylecolonies" | "other";
    addedAt?: string;
    wip?: boolean;
};
export type MissingStyleInfoJson = Omit<StyleInfoJson, "categories" | "addedAt">;

type BuildingDataJson = {
    // The minecolonies hut blocks used in the building.
    hutBlocks?: string[];
    // Does the building have an image for the back?
    back?: true;
    // The blurhash for the front and back images.
    blur: [string, string?];
    // Optional display name for the building that overrides everything else.
    displayName?: string;
    // Optional size for the building (width, height, depth).
    size?: {
        x: number;
        y: number;
        z: number;
    };
};

export type CategoryJson = {
    blueprints: { [key: string]: BuildingDataJson };
    categories: { [key: string]: CategoryJson };
};

export type ThemeJson = {
    displayName: string;
    authors: string[];
    blueprints: { [key: string]: BuildingDataJson };
    categories: { [key: string]: CategoryJson };
};

export type BuildingData = {
    styleDisplayName: string;
    name: string;
    path: string[];
    displayName?: string;
    json: BuildingDataJson;
    searchString: string;
};

export type Category = {
    name: string;
    blueprints: Map<string, BuildingData>;
    categories: Map<string, Category>;
};

export type Theme = {
    name: string;
    displayName: string;
    authors: string[];
    blueprints: Map<string, BuildingData>;
    categories: Map<string, Category>;
    added?: Date;
};

function getBuildingDisplayName(hutBlocks: string[]): string | undefined {
    for (const hutBlock of hutBlocks) {
        if (hutBlock in blockToDisplayName) {
            return blockToDisplayName[hutBlock as HutBlock];
        }
    }
    return undefined;
}

function createBuildingObject(
    name: string,
    data: BuildingDataJson,
    path: string[],
    styleDisplayName: string,
): BuildingData {
    const displayName = data.hutBlocks && getBuildingDisplayName(data.hutBlocks);
    const searchString = [
        name,
        displayName,
        data.displayName,
        data.hutBlocks?.join(" "),
        path.slice(2).join(" "),
    ]
        .join(" ")
        .toLowerCase();
    return { name, path, displayName, searchString, json: data, styleDisplayName };
}

function recurseCategories(
    path: string[],
    categories: { [key: string]: CategoryJson },
    parent: Map<string, Category>,
    limit: number,
    styleDisplayName: string,
): Map<string, Category> {
    for (const [categoryName, categoryDataJson] of Object.entries(categories)) {
        const categoryObject: Category = {
            name: categoryName,
            blueprints: new Map<string, BuildingData>(),
            categories: new Map<string, Category>(),
        };
        const categoryPath = [...path, categoryName];
        for (const [name, data] of Object.entries(categoryDataJson.blueprints)) {
            const building = createBuildingObject(name, data, categoryPath, styleDisplayName);
            categoryObject.blueprints.set(name, building);
        }
        parent.set(categoryName, categoryObject);
        if (limit > 0) {
            recurseCategories(
                categoryPath,
                categoryDataJson.categories,
                categoryObject.categories,
                limit - 1,
                styleDisplayName,
            );
        }
    }

    return parent;
}

const rawBasicStyles = _styles as unknown as {
    styles: StyleInfoJson[];
    categories: string[];
};
const rawMissingStyles = _missing_styles as unknown as MissingStyleInfoJson[];

export const categoryNames = new Set<string>(rawBasicStyles.categories);
export const styleInfoMap = new Map<string, StyleInfoJson>(
    rawBasicStyles.styles.map(style => [style.name, style]),
);
export const missingStylesMap = new Map<string, MissingStyleInfoJson>(
    rawMissingStyles.map(style => [style.name, style]),
);

export const styleFiles = new Map<string, Theme>();

const urlPrefix = process.env.NODE_ENV === "production" ? "/minecolonies-style-explorer" : "";

async function downloadStyle(style: string): Promise<Theme> {
    const response = await fetch(`${urlPrefix}/minecolonies/${style}/style.json`);
    const themeJson = (await response.json()) as ThemeJson;
    const themeObject: Theme = {
        name: style,
        displayName: themeJson.displayName,
        authors: themeJson.authors,
        blueprints: new Map<string, BuildingData>(),
        categories: new Map<string, Category>(),
    };
    for (const [name, data] of Object.entries(themeJson.blueprints)) {
        const building = createBuildingObject(name, data, [style], themeJson.displayName);
        themeObject.blueprints.set(name, building);
    }
    recurseCategories([style], themeJson.categories, themeObject.categories, 5, themeJson.displayName);
    styleFiles.set(style, themeObject);
    return themeObject;
}

export async function getStyleAsync(style: string): Promise<Theme> {
    if (!styleFiles.has(style)) {
        await downloadStyle(style);
    }
    return styleFiles.get(style)!;
}
