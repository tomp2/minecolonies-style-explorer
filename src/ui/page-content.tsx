import { pageContentAtom, searchTermAtom, selectedThemesAtom } from "@/lib/state-atoms.ts";
import { BuildingData, themes } from "@/lib/theme-data.ts";
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
            <h2 className="text-2xl font-extrabold mb-4 capitalize">{title}</h2>
            <div className="flex gap-4 flex-wrap">
                {buildings.sort(sortBuildings).map(building => (
                    <BuildingCard
                        key={building.path.join() + building.name}
                        building={building}
                        theme={themes.get(building.path[0])!}
                    />
                ))}
            </div>
        </div>
    );
}

export function PageContent() {
    const selectedThemes = useAtomValue(selectedThemesAtom);
    const { categories, rootBuildings, totalBuildingsFound } = useAtomValue(pageContentAtom);
    const searchTerm = useAtomValue(searchTermAtom);

    return (
        <main className="flex-1 p-4 bg-gray-100">
            {selectedThemes.length === 0 && (
                <article className="prose w-fit mx-auto prose-xl">
                    <h1 className="text-4xl font-extrabold">
                        Welcome to the MineColonies Building Explorer!
                    </h1>
                    <p className="mt-4">
                        This is an <em>unofficial</em> site where you can find screenshots of some of the
                        buildings from the MineColonies mod themes. I created this site to make it easy to
                        visually browse the buildings from different themes and categories at the same time.
                    </p>
                    <p className="mt-4">
                        To get started, select one or more themes/categories from the sidebar and start
                        exploring the buildings! You can also search for a building name, hut block, or
                        category—just select all the themes you want to search from first. You can see the
                        back of most buildings by clicking on the image.
                    </p>
                    <p className="mt-4 mb-0">
                        Some of the themes, categories, or buildings <strong>may be missing</strong> for
                        reasons like:
                    </p>
                    <ul className="mt-0">
                        <li>
                            I haven't used the theme in my own worlds yet. I'll add themes here if people
                            request them and I have time :)
                        </li>
                        <li>The builds have been updated and I have not taken new screenshots.</li>
                        <li>
                            Some themes have a lot off little pieces that I decided not to include for now to
                            save space and time (mostly roads and some infrastructure).
                        </li>
                    </ul>
                    <p>
                        Viewing buildings at different levels is not supported yet, but I might add it in the
                        future.
                    </p>
                </article>
            )}

            {selectedThemes.length > 0 && totalBuildingsFound === 0 && (
                <article className="prose w-fit mx-auto prose-xl text-center">
                    <h3>No buildings found</h3>
                    {searchTerm === "" ? (
                        <p>Try selecting more themes or categories</p>
                    ) : (
                        <p>Try a different search term</p>
                    )}
                </article>
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
        </main>
    );
}
