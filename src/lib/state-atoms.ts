import { BuildingData, Category, Selections, themes } from "@/lib/theme-data.ts";
import { buildingMatchesSearchTerm } from "@/lib/utils.ts";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const searchEverywhereAtom = atomWithStorage<boolean>("searchEverywhere", false, undefined, {
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
        const name = pathParts[pathParts.length - 1];

        let categoryLevel: Category = themes.get(theme)!;
        for (const category of categories) {
            categoryLevel = categoryLevel.categories.get(category)!;
        }
        return categoryLevel.blueprints.get(name)!;
    });
});

function parseSelectionsFromUrl() {
    const url = new URL(window.location.href);
    const selections: Selections = {};

    for (const [theme, categories] of themes.entries()) {
        if (!url.searchParams.has(theme)) {
            selections[theme] = Object.fromEntries(
                [...categories.categories.keys()].map(categoryName => [categoryName, false]),
            );
            continue;
        }

        const rawParamValue = url.searchParams.get(theme)!;
        selections[theme] = {};
        if (rawParamValue === "all") {
            for (const category of categories.categories.keys()) {
                selections[theme][category] = true;
            }
        } else {
            const inverted = rawParamValue.startsWith("-");
            const categories = new Set(rawParamValue.slice(inverted ? 1 : 0).split("|"));
            for (const category of themes.get(theme)!.categories.keys()) {
                const inList = categories.has(category.slice(0, 4));
                selections[theme][category] = inverted ? !inList : inList;
            }
        }
    }
    return selections;
}

function encodeSelectionsToUrl(selections: Selections) {
    const url = new URL(window.location.href);

    // Store the selections in the URL.
    // Store the category name itself as a parameter, so that the URL is human-readable.
    // If all subcategories are selected, store "caledonia=all" instead of
    // "caledonia=agri|craf|deco|mili" (4 first letters of each subcategory).
    for (const [theme, themeSelections] of Object.entries(selections)) {
        if (!Object.values(themeSelections).some(selected => selected)) {
            url.searchParams.delete(theme);
            continue;
        }
        if (Object.values(themeSelections).every(selected => selected)) {
            url.searchParams.set(theme, "all");
        } else {
            const selectedCategories = [];
            const nonSelectedCategories = [];
            for (const [category, selected] of Object.entries(themeSelections)) {
                if (selected) {
                    selectedCategories.push(category.slice(0, 4));
                } else {
                    nonSelectedCategories.push(category.slice(0, 4));
                }
            }
            // If there are more non-selected categories than selected ones, store them instead
            // by prefixing them with a minus sign.
            if (selectedCategories.length > nonSelectedCategories.length) {
                url.searchParams.set(theme, "-" + nonSelectedCategories.join("|"));
            } else {
                url.searchParams.set(theme, selectedCategories.join("|"));
            }
        }
    }
    return url.toString();
}

export const selectionsAtom = atom<Selections>(parseSelectionsFromUrl());

export const selectedThemesAtom = atom<Set<string>>(get => {
    const selections = get(selectionsAtom);
    return new Set(
        Object.keys(selections).filter(theme => Object.values(selections[theme]).some(selected => selected)),
    );
});

export const pageContentAtom = atom(get => {
    const selections = get(selectionsAtom);
    const selectedThemes = get(selectedThemesAtom);
    const searchTerm = get(searchTermAtom);
    const searchEverywhere = get(searchEverywhereAtom);

    window.history.replaceState({}, "", encodeSelectionsToUrl(selections));

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
    for (const themeName of themes.keys()) {
        if (searchTerm) {
            if (!searchEverywhere && !selectedThemes.has(themeName)) {
                continue;
            }
        } else {
            if (!selectedThemes.has(themeName)) {
                continue;
            }
        }
        const theme = themes.get(themeName)!;
        for (const building of theme.blueprints.values()) {
            if (!buildingMatchesSearchTerm(searchTerm, building)) continue;
            rootBuildings.push(building);
            totalBuildingsFound++;
        }

        const themeCategorySelections = selections[themeName]!;
        for (const [categoryName, categoryData] of theme.categories.entries()) {
            if (searchTerm) {
                if (!searchEverywhere && !themeCategorySelections[categoryName]) {
                    continue;
                }
            } else {
                if (!themeCategorySelections[categoryName]) {
                    continue;
                }
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
