import { BuildingData, Category, defaultSelections, Selections, themes } from "@/lib/theme-data.ts";
import { atom } from "jotai";

export const dynamicSizeAtom = atom<string>("size-[350px]");

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

export const selectionsAtom = atom<Selections>(defaultSelections);

export const selectedThemesAtom = atom<string[]>(get => {
    const selections = get(selectionsAtom);
    return Object.keys(selections).filter(theme =>
        Object.values(selections[theme]).some(selected => selected),
    );
});

export const pageContentAtom = atom(get => {
    const selections = get(selectionsAtom);
    const selectedThemes = get(selectedThemesAtom);
    const searchTerm = get(searchTermAtom);

    let totalBuildingsFound = 0;

    function matchesSearchTerm(building: BuildingData) {
        if (searchTerm === "") {
            return true;
        }
        const searchTermLower = searchTerm.toLowerCase();

        return (
            (building.displayName && building.displayName.toLowerCase().includes(searchTermLower)) ||
            building.name.toLowerCase().includes(searchTermLower) ||
            (building.json.hutBlocks &&
                building.json.hutBlocks.some(block =>
                    block.toLowerCase().replace("blockhut", "").includes(searchTermLower),
                )) ||
            building.path.join("/").toLowerCase().includes(searchTermLower)
        );
    }

    // Root buildings of all themes come first:
    const rootBuildings: BuildingData[] = [];

    for (const themeName of selectedThemes) {
        for (const building of themes.get(themeName)!.blueprints.values()) {
            if (!matchesSearchTerm(building)) continue;
            rootBuildings.push(building);
            totalBuildingsFound++;
        }
    }

    function recursivelyGatherAllBuildings(category: Category, results: BuildingData[]) {
        for (const building of category.blueprints.values()) {
            if (!matchesSearchTerm(building)) continue;
            results.push(building);
            totalBuildingsFound++;
        }
        for (const subcategory of category.categories.values()) {
            recursivelyGatherAllBuildings(subcategory, results);
        }
    }

    type PageBuildingsSection = { blueprints: BuildingData[]; categories: Map<string, BuildingData[]> };

    const categories: Map<string, PageBuildingsSection> = new Map();
    for (const [themeName, themeCategorySelections] of Object.entries(selections)) {
        const theme = themes.get(themeName)!;
        for (const [categoryName, categoryData] of theme.categories.entries()) {
            if (!themeCategorySelections[categoryName]) {
                continue;
            }

            if (!categories.has(categoryName)) {
                categories.set(categoryName, { blueprints: [], categories: new Map() });
            }
            const section = categories.get(categoryName)!;

            for (const building of categoryData.blueprints.values()) {
                if (!matchesSearchTerm(building)) continue;
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
