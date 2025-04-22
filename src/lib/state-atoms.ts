import {
    BuildingData,
    Category,
    categoryNames,
    getStyleAsync,
    styleFiles,
    styleInfoMap,
    Theme
} from "@/lib/theme-data.ts";
import { buildingMatchesStringSearchTerm } from "@/lib/utils.ts";
import { atom } from "jotai";
import { atomWithStorage, loadable } from "jotai/utils";

/**
 * The query parameters stored in localStorage.
 * These are used to check if the url contains search parameters that affect the buildings shown.
 * If these are present, the page will not restore the previous selections from localStorage.
 */
export const LOCALSTORAGE_QUERY_PARAMS = {
    search: "search",
    theme: "theme",
    category: "category",
};

/**
 * The latest URL search parameters are stored in localStorage. This is used to restore the
 * selections when the page is reloaded and no relevant search parameters are present.
 */
let initialUrlSearchParams = new URL(window.location.href).searchParams;
const hasInitialUrlRelevantParams = [...initialUrlSearchParams.keys()].some(
    key => key in LOCALSTORAGE_QUERY_PARAMS,
);
if (initialUrlSearchParams.size === 0 && !hasInitialUrlRelevantParams) {
    initialUrlSearchParams = new URLSearchParams(localStorage.getItem("lastUrlParams") || "");
}

/**
 * The currently selected tab. Gets initialized to the "buildings" tab if the URL contains params that
 * makes it relevant to show the buildings.
 * */
export const tabAtom = atom<"home" | "buildings" | "favorites" | string>(
    hasInitialUrlRelevantParams ? "buildings" : "home",
);
export const updateTabAtomSelections = atom(null, (_get, set, selections: Set<string>) => {
    const tab = _get(tabAtom);
    const searchTerm = _get(searchTermAtom);
    if (tab !== "favorites") {
        if (selections.size > 0 || searchTerm) {
            set(tabAtom, "buildings");
        } else {
            set(tabAtom, "home");
        }
    }
});
export const updateTabAtomSearchQuery = atom(null, (_get, set, searchTerm: string) => {
    const tab = _get(tabAtom);
    const selectedStyles = _get(selectedThemesAtom);
    if (tab !== "favorites") {
        if (selectedStyles.size > 0 || searchTerm) {
            set(tabAtom, "buildings");
        } else {
            set(tabAtom, "home");
        }
    }
});

export const imageWidthAtom = atom<number>(400);

/** The currently expanded building, or null if none are expanded. */
export const expandedBuildingAtom = atom<BuildingData | null>(null);

/** Whether to only search from the selected themes. */
export const searchSelectedThemesOnlyAtom = atomWithStorage<boolean>(
    "searchSelectionsOnly",
    false,
    undefined,
    {
        getOnInit: true,
    },
);

/** The search term for filtering buildings. Also updates the URL on write. */
export const searchTermAtom = atom<string>(
    new URLSearchParams(window.location.search).get(LOCALSTORAGE_QUERY_PARAMS.search) || "",
);
export const writeSearchTermAtom = atom(null, (_get, set, searchTerm: string) => {
    const url = new URL(window.location.href);
    if (searchTerm) {
        url.searchParams.set(LOCALSTORAGE_QUERY_PARAMS.search, searchTerm);
    } else {
        url.searchParams.delete(LOCALSTORAGE_QUERY_PARAMS.search);
    }
    window.history.replaceState({}, "", url.toString());
    set(searchTermAtom, searchTerm);
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

export function parseFavoriteBuildingPath(path: string) {
    const pathParts = path.split(">");
    return {
        categories: pathParts.slice(1, -1),
        styleId: pathParts[0],
        buildingId: pathParts.at(-1)!,
    };
}

/** Defines the separator used in the URL for selections. */
const selectionUrlSeparator = "-";

/**
 * Parse the selected themes from the URL search parameters.
 * Param can either be "all" or a list of theme names separated by the selectionUrlSeparator.
 */
function parseThemesFromUrlParams(urlSearchParams: URLSearchParams) {
    const selectedThemes = new Set<string>();
    const themeParams = urlSearchParams.get(LOCALSTORAGE_QUERY_PARAMS.theme);
    if (themeParams === "all") {
        return new Set(styleInfoMap.keys());
    }
    if (themeParams) {
        const paramThemeParts = themeParams.split(selectionUrlSeparator);
        for (const theme of paramThemeParts) {
            if (styleInfoMap.has(theme)) {
                selectedThemes.add(theme);
            }
        }
    }
    return selectedThemes;
}

/**
 * Parse the selected categories from the URL search parameters.
 */
function parseCategoriesFromUrlParams(urlSearchParams: URLSearchParams) {
    const categoryParams = urlSearchParams.get(LOCALSTORAGE_QUERY_PARAMS.category);
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

const initialStyles = parseThemesFromUrlParams(initialUrlSearchParams);
export const selectedThemesAtom = atom<Set<string>>(initialStyles);
export const selectedCategoriesAtom = atom<Set<string>>(parseCategoriesFromUrlParams(initialUrlSearchParams));

/**
 * Encode the selected themes into the URL search parameters.
 * If all themes are selected, returns "all".
 */
function encodeThemesToUrlParameter(selectedThemes: Set<string>) {
    if (selectedThemes.size === styleInfoMap.size) return "all";
    return encodeURIComponent([...selectedThemes].join(selectionUrlSeparator));
}

/**
 * Encode the selected categories into the URL search parameters.
 * If all categories are selected, returns null.
 */
function encodeCategoriesToUrl(categories: Set<string>) {
    if (categories.size === categoryNames.size) return null;
    return encodeURIComponent(
        [...categories].map(category => category.slice(0, 4)).join(selectionUrlSeparator),
    );
}

/** Crafts a URL with the current selections encoded. */
function encodeSelectionsToUrl(selectedThemes: Set<string>, selectedCategories: Set<string>) {
    const url = new URL(window.location.href);
    const encodedThemes = encodeThemesToUrlParameter(selectedThemes);
    if (!encodedThemes) {
        url.searchParams.delete(LOCALSTORAGE_QUERY_PARAMS.theme);
        url.searchParams.delete(LOCALSTORAGE_QUERY_PARAMS.category);
        return url;
    }

    const encodedCategories = encodeCategoriesToUrl(selectedCategories);
    if (encodedCategories) {
        url.searchParams.set(LOCALSTORAGE_QUERY_PARAMS.category, encodedCategories);
    } else {
        url.searchParams.delete(LOCALSTORAGE_QUERY_PARAMS.category);
    }

    url.searchParams.set(LOCALSTORAGE_QUERY_PARAMS.theme, encodedThemes);
    return url;
}

async function loadFavoriteBuilding(path: string) {
    const parsed = parseFavoriteBuildingPath(path);

    let categoryLevel: Category = await getStyleAsync(parsed.styleId);
    for (const category of parsed.categories) {
        categoryLevel = categoryLevel.categories.get(category)!;
    }
    return categoryLevel.blueprints.get(parsed.buildingId);
}

/** Atom which reads paths of favorite buildings and returns the actual building objects. */
export const asyncFavoriteBuildingsAtom = atom(async (get): Promise<BuildingData[]> => {
    const paths = get(favoritePaths);
    const buildings = await Promise.all(paths.map(element => loadFavoriteBuilding(element)));
    return buildings.filter((building): building is BuildingData => building !== undefined);
});
export const loadableFavoriteBuildingsAtom = loadable(asyncFavoriteBuildingsAtom);

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const sectionSortOrder = [
    "fundamentals",
    "education",
    "mystic",
    "craftsmanship",
    "agriculture",
    "military",
    "decoration",
];

/**
 * Iterates over all themes and categories to gather all buildings that match the search term
 * and/or are part of the selected themes and categories.
 *
 * This organizes the buildings into a structure that can be easily rendered.
 */
export const pageContentAtom = atom(
    async (
        get,
    ): Promise<
        | [
              {
                  totalBuildingsFound: number;
                  sections: { blueprints: BuildingData[]; title: string }[];
              },
              null,
          ]
        | [null, Error]
    > => {
        const selectedThemes = get(selectedThemesAtom);
        const selectedCategories = get(selectedCategoriesAtom);

        const searchTerm = get(searchTermAtom);
        const searchSelectedThemesOnly = get(searchSelectedThemesOnlyAtom);

        const url = encodeSelectionsToUrl(selectedThemes, selectedCategories);
        window.history.replaceState({}, "", url);
        localStorage.setItem("lastUrlParams", url.searchParams.toString());

        let totalBuildingsFound = 0;
        type Section = { blueprints: BuildingData[]; title: string };
        const sections = new Map<string, Section>();

        if (selectedThemes.size === 0 && !searchTerm) {
            return [{ totalBuildingsFound, sections: [] }, null];
        }

        function processBlueprints(blueprints: Iterable<BuildingData>) {
            for (const blueprint of blueprints) {
                if (!buildingMatchesStringSearchTerm(searchTerm, blueprint)) continue;
                const path = blueprint.path.slice(1).join(" > ");
                if (!sections.has(path)) {
                    sections.set(path, { blueprints: [], title: path });
                }
                sections.get(path)!.blueprints.push(blueprint);
                totalBuildingsFound++;
            }
        }

        function processCategories(categories: Iterable<Category>) {
            for (const category of categories) {
                processBlueprints(category.blueprints.values());
                processCategories(category.categories.values());
            }
        }

        const requiredStyles = new Set<string>();
        for (const theme of selectedThemes) {
            requiredStyles.add(theme);
        }
        if (searchTerm && !searchSelectedThemesOnly) {
            for (const style of styleInfoMap.keys()) {
                requiredStyles.add(style);
            }
        }

        const foundStyles: Theme[] = [];
        const stylesToDownload = [];
        for (const style of requiredStyles) {
            const styleFile = styleFiles.get(style);
            if (styleFile === undefined) {
                stylesToDownload.push(style);
            } else {
                foundStyles.push(styleFile);
            }
        }
        if (stylesToDownload.length > 0) {
            try {
                const results = await Promise.all([...requiredStyles].map(theme => getStyleAsync(theme)));
                for (const result of results) {
                    foundStyles.push(result);
                }
            } catch (error) {
                return [null, error as Error];
            }
        }

        for (const themeData of foundStyles) {
            if (searchTerm) {
                if (searchSelectedThemesOnly && !selectedThemes.has(themeData.name)) {
                    continue;
                }
            } else if (!selectedThemes.has(themeData.name)) {
                continue;
            }
            processBlueprints(themeData.blueprints.values());

            for (const category of themeData.categories.values()) {
                if (!searchTerm && selectedCategories.size > 0 && !selectedCategories.has(category.name)) {
                    continue;
                }
                processBlueprints(category.blueprints.values());
                processCategories(category.categories.values());
            }
            await delay(0);
        }

        const sectionList = [...sections.values()].sort((a, b) => {
            const aIndex = sectionSortOrder.indexOf(a.title.split(" > ")[0].toLowerCase());
            const bIndex = sectionSortOrder.indexOf(b.title.split(" > ")[0].toLowerCase());
            if (aIndex === bIndex) return a.title.localeCompare(b.title);
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        });

        return [{ totalBuildingsFound, sections: sectionList }, null];
    },
);
