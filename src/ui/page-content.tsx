import {
    favoriteBuildingsAtom,
    favoritePaths,
    pageContentAtom,
    searchTermAtom,
    showFavoritesAtom,
} from "@/lib/state-atoms.ts";
import { type BuildingData } from "@/lib/theme-data.ts";
import { cn } from "@/lib/utils.ts";
import { BuildingCard } from "@/ui/building-card.tsx";
import { useAtomValue } from "jotai";

function sortBuildings(a: BuildingData, b: BuildingData) {
    for (let i = 1; i < Math.min(a.path.length - 1, b.path.length - 1); i++) {
        if (a.path[i] !== b.path[i]) {
            return a.path[i].localeCompare(b.path[i]);
        }
    }
    const aName = a.displayName || a.name.replace("alt", "");
    const bName = b.displayName || b.name.replace("alt", "");
    return aName.localeCompare(bName);
}

function BuildingSection({
    title,
    buildings,
    className,
}: {
    title: string;
    buildings: BuildingData[];
    className?: string;
}) {
    if (buildings.length === 0) {
        return null;
    }

    return (
        <div className={cn("p-2", className)}>
            <h2 className="mb-4 ml-2 text-2xl font-extrabold capitalize">{title}</h2>
            <div className="grid grid-cols-[repeat(var(--image-cols),_minmax(0,_1fr))] gap-2">
                {buildings.sort(sortBuildings).map(building => (
                    <BuildingCard key={building.path.join(",") + building.name} building={building} />
                ))}
            </div>
        </div>
    );
}

function BuildingsContainer() {
    const showFavorites = useAtomValue(showFavoritesAtom);
    const favoriteBuildings = useAtomValue(favoriteBuildingsAtom);
    const { categories, rootBuildings } = useAtomValue(pageContentAtom);

    const dynamicSections = [];
    for (const [categoryName, section] of categories.entries()) {
        dynamicSections.push(
            <BuildingSection title={categoryName} buildings={section.blueprints} key={categoryName} />,
        );
        for (const [subcategoryName, subcategory] of section.categories.entries()) {
            dynamicSections.push(
                <BuildingSection
                    title={subcategoryName}
                    buildings={subcategory}
                    key={categoryName + subcategoryName}
                />,
            );
        }
    }

    return (
        <div className="h-full space-y-8 overflow-auto last:mb-16">
            {showFavorites && favoriteBuildings.length > 0 && (
                <BuildingSection
                    className="rounded-b-lg bg-pink-200 dark:bg-pink-950/50"
                    title="Favorites"
                    buildings={favoriteBuildings.sort(sortBuildings)}
                />
            )}
            <BuildingSection title="Top-level Buildings" buildings={rootBuildings} />
            {dynamicSections}
        </div>
    );
}

export function PageContent() {
    const searchTerm = useAtomValue(searchTermAtom);
    const showFavorites = useAtomValue(showFavoritesAtom);
    const favoriteCount = useAtomValue(favoritePaths).length;
    const { totalBuildingsFound } = useAtomValue(pageContentAtom);

    if (totalBuildingsFound > 0 || (showFavorites && favoriteCount > 0)) {
        return <BuildingsContainer />;
    }

    if (searchTerm && totalBuildingsFound === 0) {
        return (
            <article className="prose prose-xl mx-auto mt-5 p-2 text-center dark:prose-invert [&_*]:m-0">
                <h3>No buildings found</h3>
                <h4 className="mb-0">You can try:</h4>
                <ul className="[&_li]: mt-0 list-inside list-disc pl-0 text-left">
                    <li>different search term</li>
                    <li>selecting more styles/categories</li>
                    <li>disabling &quot;Search only from selected styles&quot; on the sidebar</li>
                </ul>
            </article>
        );
    }
    return (
        <article className="prose prose-xl mx-auto mt-5 p-2 pb-14 dark:prose-invert">
            <h1 className="text-4xl">
                Welcome to the <em>unofficial</em> MineColonies Style Explorer!
            </h1>
            <h3>Introduction</h3>
            <p>
                This is an <em>unofficial</em> site for browsing the styles and buildings for the{" "}
                <a className="text-blue-500" href="https://minecolonies.com/">
                    MineColonies
                </a>{" "}
                mod. I created this site to make it easy to visually explore buildings by style and category.
            </p>
            <p>
                Start by selecting styles from the sidebar or searching for buildings. Click images to see
                alternative angles, and use the heart icon to save favorites.
            </p>
            <h3>Support MineColonies</h3>
            <p>
                Style-pack authors are next to the style name. If you want to browse the buildings in-game,
                Minecolonies has a Patreon where you can get access to their official <b>schematics server</b>
                . Read more about it on their{" "}
                <a className="text-blue-500" href="https://www.patreon.com/minecolonies">
                    Patreon page
                </a>
            </p>
            <h3>FAQ & Missing Stuff</h3>
            <p>
                <strong>Vote</strong> for the next stylepack in the sidebar! Screenshotting styles takes some
                time, so new styles may take a while to be added. If you notice outdated/missing buildings, or
                have any other suggestions (like new features), send feedback using the button at the top
                right.
            </p>
            <p>
                Currently the screenshots are of the maximum level of the building. Taking screenshots of
                different levels would take too much <time className=""></time>
            </p>
        </article>
    );
}
