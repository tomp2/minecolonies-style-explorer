import { BuildingData, Category, categoryNames, themes } from "@/lib/theme-data.ts";
import { buildingMatchesSearchTerm } from "@/lib/utils.ts";
import { atom } from "jotai/index";
import { atomWithStorage } from "jotai/utils";

export const expandedBuildingAtom = atom<BuildingData | null>(null);

export const searchEverywhereAtom = atomWithStorage<boolean>("searchEverywhere", true, undefined, {
    getOnInit: true,
});
export const searchTermAtom = atom<string>(new URLSearchParams(window.location.search).get("search") || "");
export const writeSearchTermAtom = atom(null, (_get, set, searchTerm: string) => {
    const url = new URL(window.location.href);
    if (searchTerm) {
        url.searchParams.set("search", searchTerm);
    } else {
        url.searchParams.delete("search");
    }
    window.history.replaceState({}, "", url.toString());
    set(searchTermAtom, searchTerm);
});

export const showFavoritesAtom = atomWithStorage<boolean>("showFavorites", true, undefined, {
    getOnInit: true,
});
export const favoritePaths = atomWithStorage<string[]>("favorites", [], undefined, { getOnInit: true });
export const favoritesPathsWriteAtom = atom(
    get => new Set(get(favoritePaths)),
    (get, set, path: string) => {
        const favorites = get(favoritePaths);
        if (favorites.includes(path)) {
            set(
                favoritePaths,
                favorites.filter(favorite => favorite !== path),
            );
            return false;
        } else {
            set(favoritePaths, [...favorites, path]);
            return true;
        }
    },
);
export const favoriteBuildingsAtom = atom(get => {
    const paths = get(favoritePaths);
    return paths.map(path => {
        const pathParts = path.split(">");

        const categories = pathParts.slice(1, -1);
        const theme = pathParts[0];
        const name = pathParts.at(-1)!;

        let categoryLevel: Category = themes.get(theme)!;
        for (const category of categories) {
            categoryLevel = categoryLevel.categories.get(category)!;
        }
        return categoryLevel.blueprints.get(name)!;
    });
});

const selectionUrlSeparator = "-";

function parseThemesFromUrl() {
    const url = new URL(window.location.href);
    const selectedThemes = new Set<string>();
    const themeParams = url.searchParams.get("theme");
    if (themeParams === "all") {
        return new Set(themes.keys());
    }
    if (themeParams) {
        const paramThemeParts = themeParams.split(selectionUrlSeparator);
        for (const theme of paramThemeParts) {
            if (themes.has(theme)) {
                selectedThemes.add(theme);
            }
        }
    }
    return selectedThemes;
}

function encodeThemesToUrl(selectedThemes: Set<string>) {
    if (selectedThemes.size === themes.size) return "all";
    return encodeURIComponent([...selectedThemes].join(selectionUrlSeparator));
}

function parseCategoriesFromUrl() {
    const url = new URL(window.location.href);
    const categoryParams = url.searchParams.get("category");
    if (categoryParams === null) {
        return new Set<string>(categoryNames);
    }

    const selectedCategories = new Set<string>();
    if (categoryParams) {
        const paramCategoryParts = categoryParams.split(selectionUrlSeparator);
        for (const categoryPart of paramCategoryParts) {
            for (const actualCategory of categoryNames) {
                if (actualCategory.startsWith(categoryPart)) {
                    selectedCategories.add(actualCategory);
                }
            }
        }
    }
    return selectedCategories;
}

function encodeCategoriesToUrl(categories: Set<string>) {
    if (categories.size === categoryNames.size) return null;
    return encodeURIComponent(
        [...categories].map(category => category.slice(0, 4)).join(selectionUrlSeparator),
    );
}

function encodeSelectionsToUrl(selectedThemes: Set<string>, selectedCategories: Set<string>) {
    const url = new URL(window.location.href);
    const encodedThemes = encodeThemesToUrl(selectedThemes);
    if (!encodedThemes) {
        url.searchParams.delete("theme");
        url.searchParams.delete("category");
        return url.toString();
    }

    const encodedCategories = encodeCategoriesToUrl(selectedCategories);
    if (encodedCategories) {
        url.searchParams.set("category", encodedCategories);
    } else {
        url.searchParams.delete("category");
    }

    url.searchParams.set("theme", encodedThemes);
    return url.toString();
}

export const selectedThemesAtom = atom<Set<string>>(parseThemesFromUrl());
export const selectedCategoriesAtom = atom<Set<string>>(parseCategoriesFromUrl());

export const pageContentAtom = atom(get => {
    const selectedThemes = get(selectedThemesAtom);
    const selectedCategories = get(selectedCategoriesAtom);

    const searchTerm = get(searchTermAtom);
    const searchEverywhere = get(searchEverywhereAtom);

    window.history.replaceState({}, "", encodeSelectionsToUrl(selectedThemes, selectedCategories));

    let totalBuildingsFound = 0;

    function recursivelyGatherAllBuildings(category: Category, results: BuildingData[]) {
        for (const building of category.blueprints.values()) {
            if (!buildingMatchesSearchTerm(searchTerm, building)) continue;
            results.push(building);
            totalBuildingsFound++;
        }
        for (const subcategory of category.categories.values()) {
            recursivelyGatherAllBuildings(subcategory, results);
        }
    }

    type PageBuildingsSection = { blueprints: BuildingData[]; categories: Map<string, BuildingData[]> };

    // Root buildings of all themes come first:
    const rootBuildings: BuildingData[] = [];
    const categories = new Map<string, PageBuildingsSection>();
    for (const [themeName, theme] of themes.entries()) {
        if (!selectedThemes.has(themeName) && (!searchTerm || !searchEverywhere)) {
            continue;
        }

        for (const building of theme.blueprints.values()) {
            if (!buildingMatchesSearchTerm(searchTerm, building)) continue;
            rootBuildings.push(building);
            totalBuildingsFound++;
        }

        for (const [categoryName, categoryData] of theme.categories.entries()) {
            if (
                !selectedCategories.has(categoryName) &&
                (!searchTerm || !searchEverywhere) &&
                selectedCategories.size > 0
            ) {
                continue;
            }

            if (!categories.has(categoryName)) {
                categories.set(categoryName, { blueprints: [], categories: new Map() });
            }
            const section = categories.get(categoryName)!;

            for (const building of categoryData.blueprints.values()) {
                if (!buildingMatchesSearchTerm(searchTerm, building)) continue;
                section.blueprints.push(building);
                totalBuildingsFound++;
            }

            for (const [subcategoryName, subcategoryData] of categoryData.categories.entries()) {
                if (!section.categories.has(subcategoryName)) {
                    section.categories.set(subcategoryName, []);
                }
                const subcategoryBuildingList = section.categories.get(subcategoryName)!;

                recursivelyGatherAllBuildings(subcategoryData, subcategoryBuildingList);
            }
        }
    }

    return { rootBuildings, categories, totalBuildingsFound };
});
