import { blockToDisplayName, HutBlock } from "@/lib/hut-blocks.ts";
import _themes from "../assets/themes.json";

type BuildingDataJson = {
    levels: number | false;
    hutBlocks?: string[];
    back?: true;
    blur: [string, string?];
    displayName?: string;
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
};

export type Selections = Record<string, Record<string, boolean>>;

function getBuildingDisplayName(hutBlocks: string[]): string | undefined {
    for (const hutBlock of hutBlocks) {
        if (hutBlock in blockToDisplayName) {
            return blockToDisplayName[hutBlock as HutBlock];
        }
    }
    return undefined;
}

function createBuildingObject(name: string, data: BuildingDataJson, path: string[]): BuildingData {
    const displayName = data.hutBlocks && getBuildingDisplayName(data.hutBlocks);
    const searchString = [name, displayName, data.displayName, data.hutBlocks?.join(" "), path.join(" ")]
        .join(" ")
        .toLowerCase();
    return { name, path, displayName, searchString, json: data };
}

function recurseCategories(
    path: string[],
    categories: { [key: string]: CategoryJson },
    parent: Map<string, Category>,
    limit: number,
): Map<string, Category> {
    for (const [categoryName, categoryDataJson] of Object.entries(categories)) {
        const categoryObject: Category = {
            name: categoryName,
            blueprints: new Map<string, BuildingData>(),
            categories: new Map<string, Category>(),
        };
        const categoryPath = [...path, categoryName];
        for (const [name, data] of Object.entries(categoryDataJson.blueprints)) {
            const building = createBuildingObject(name, data, categoryPath);
            categoryObject.blueprints.set(name, building);
        }
        parent.set(categoryName, categoryObject);
        if (limit > 0) {
            recurseCategories(
                categoryPath,
                categoryDataJson.categories,
                categoryObject.categories,
                limit - 1,
            );
        }
    }

    return parent;
}

/**
 * Convert the JSON data into a more usable format.
 * The JSON doesn't have display names or paths for the buildings, so we add those.
 */
function restructureThemesJson(themesJson: Record<string, ThemeJson>): Map<string, Theme> {
    const themes = new Map<string, Theme>();

    for (const themeName of Object.keys(themesJson)) {
        const theme = themesJson[themeName];
        const themeObject: Theme = {
            name: themeName,
            displayName: theme.displayName,
            authors: theme.authors,
            blueprints: new Map<string, BuildingData>(),
            categories: new Map<string, Category>(),
        };
        for (const [name, data] of Object.entries(theme.blueprints)) {
            const building = createBuildingObject(name, data, [themeName]);
            themeObject.blueprints.set(name, building);
        }
        recurseCategories([themeName], theme.categories, themeObject.categories, 5);
        themes.set(themeName, themeObject);
    }
    return themes;
}

export const themes = restructureThemesJson(_themes as unknown as Record<string, ThemeJson>);
