import {
    favoriteBuildingsAtom,
    favoritePaths,
    pageContentAtom,
    searchTermAtom,
    showFavoritesAtom,
} from "@/lib/state-atoms.ts";
import { type BuildingData } from "@/lib/theme-data.ts";
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

function BuildingSection({ title, buildings }: { title: string; buildings: BuildingData[] }) {
    if (buildings.length === 0) {
        return null;
    }

    return (
        <div className="mb-8">
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

    return (
        <div className="h-full overflow-auto">
            {showFavorites && favoriteBuildings.length > 0 && (
                <BuildingSection title="Favorites" buildings={favoriteBuildings.sort(sortBuildings)} />
            )}

            {/*Root buildings from all selected themes*/}
            <BuildingSection title="Top-level Buildings" buildings={rootBuildings} />

            {/*Categories and their buildings*/}
            {[...categories.entries()].map(([categoryName, section]) => (
                <div key={categoryName} className="mb-8">
                    <BuildingSection title={categoryName} buildings={section.blueprints} />
                    {[...section.categories.entries()].map(([subcategoryName, subcategory]) => (
                        <BuildingSection
                            key={subcategoryName}
                            title={subcategoryName}
                            buildings={subcategory}
                        />
                    ))}
                </div>
            ))}
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
            <article className="prose prose-xl mx-auto mt-5 text-center [&_*]:m-0">
                <h3>No buildings found</h3>
                <h4 className="mb-0">You can try:</h4>
                <ul className="[&_li]: mt-0 list-inside list-disc pl-0 text-left">
                    <li>different search term</li>
                    <li>selecting more styles/categories</li>
                    <li>enabling &quot;Search from everywhere&quot; on the sidebar</li>
                </ul>
            </article>
        );
    }
    return (
        <article className="prose prose-xl mx-auto mt-5 pb-14">
            <h1 className="text-4xl font-extrabold">
                Welcome to the <em>unofficial</em> MineColonies Style Explorer!
            </h1>
            <p>
                This is an <em>unofficial</em> site for browsing screenshots of the{" "}
                <a className="text-blue-500" href="https://minecolonies.com/">
                    MineColonies
                </a>{" "}
                mod theme/style buildings. <b>Credits</b> for the buildings go to the style authors listed in
                the sidebar next to the style name. I created this site to make it easy to visually browse the
                buildings from different styles and categories at the same time.
            </p>
            <p>
                To get started, select one or more styles/categories from the sidebar and start exploring the
                buildings! You can also search for a building name, hut block, or category—just select all the
                styles you want to search from first. You can see the back of most buildings by clicking on
                the image.
            </p>
            <p>
                Note: This page only shows simple pics of the buildings. Minecolonies has a Patreon where you
                can support them and get access to their official <b>schematics server</b> if you want to
                browse and inspect the buildings more closely in-game. Read more about it on their{" "}
                <a className="text-blue-500" href="https://www.patreon.com/minecolonies">
                    Patreon page
                </a>
            </p>
            <p className="mb-0">
                Some of the styles, categories, or buildings may be
                <strong> missing or excluded</strong> for reasons like:
            </p>
            <ul className="mt-0">
                <li>I haven&#39;t used the style in my own worlds yet.</li>
                <li>The builds have been updated and I have not taken new screenshots.</li>
                <li>
                    Some styles have a lot off little pieces that I decided not to include for now to save
                    space and time (mostly roads, mineshafts and some infrastructure).
                </li>
                <li>New buildings have been added, or I have forgotten some.</li>
            </ul>
            <p>
                Send me some feedback (button on top right) if you notice changed or missing buildings!
                I&#39;ll add styles here if people request them and I have time :)
            </p>
            <p>
                Viewing buildings at different levels is not supported yet, but I might add it in the future.
                Currently the screenshots are of the maximum level of the building.
            </p>
        </article>
    );
}
