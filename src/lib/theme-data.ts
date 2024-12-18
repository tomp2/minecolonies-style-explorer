import { blockToDisplayName, HutBlock } from "@/lib/hut-blocks.ts";
import _themes from "../assets/themes.json";

type BuildingDataJson = {
    levels: number | false;
    hutBlocks?: string[];
    back?: true;
    blur: [string, string?];
};

export type CategoryJson = {
    blueprints: { [key: string]: BuildingDataJson };
    categories: { [key: string]: CategoryJson };
};

export type ThemeJson = {
    displayName: string;
    authors: string[];
    buildingData: CategoryJson;
};

export type BuildingData = {
    name: string;
    path: string[];
    displayName?: string;
    json: BuildingDataJson;
};

export type Category = {
    name: string;
    path: string[];
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

function recurseCategories(
    path: string[],
    categories: { [key: string]: CategoryJson },
    parent: Map<string, Category>,
    limit: number,
): Map<string, Category> {
    for (const [categoryName, categoryDataJson] of Object.entries(categories)) {
        const categoryObject: Category = {
            name: categoryName,
            path: [],
            blueprints: new Map<string, BuildingData>(),
            categories: new Map<string, Category>(),
        };
        for (const [name, data] of Object.entries(categoryDataJson.blueprints)) {
            categoryObject.blueprints.set(name, {
                name,
                path: [...path, categoryName],
                displayName: data.hutBlocks && getBuildingDisplayName(data.hutBlocks),
                json: data,
            });
        }
        parent.set(categoryName, categoryObject);
        if (limit > 0) {
            recurseCategories(
                [...path, categoryName],
                categoryDataJson.categories,
                categoryObject.categories,
                limit - 1,
            );
        }
    }

    return parent;
}

function getThemes(themesJson: Record<string, ThemeJson>): Map<string, Theme> {
    const result = new Map<string, Theme>();
    for (const themeName of Object.keys(themesJson)) {
        const theme = themesJson[themeName];
        const themeObject: Theme = {
            name: themeName,
            displayName: theme.displayName,
            authors: theme.authors,
            blueprints: new Map<string, BuildingData>(),
            categories: new Map<string, Category>(),
        };
        for (const [name, data] of Object.entries(theme.buildingData.blueprints)) {
            themeObject.blueprints.set(name, {
                name,
                path: [themeName],
                displayName: data.hutBlocks && getBuildingDisplayName(data.hutBlocks),
                json: data,
            });
        }
        recurseCategories([themeName], theme.buildingData.categories, themeObject.categories, 5);
        result.set(themeName, themeObject);
    }
    return result;
}

export const themes = getThemes(_themes as unknown as Record<string, ThemeJson>);

export const defaultSelections: Selections = Object.fromEntries(
    [...themes.keys()].map(themeName => [
        themeName,
        Object.fromEntries(
            [...themes.get(themeName)!.categories.keys()].map(categoryName => [categoryName, false]),
        ),
    ]),
);
