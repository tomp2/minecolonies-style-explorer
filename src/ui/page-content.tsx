import { dynamicSizeAtom, pageContentAtom, searchTermAtom, selectedThemesAtom } from "@/lib/state-atoms.ts";
import { type BuildingData } from "@/lib/theme-data.ts";
import { BuildingCard } from "@/ui/building-card.tsx";
import { useAtomValue } from "jotai";
import { type CSSProperties } from "react";

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
                    <BuildingCard key={building.path.join() + building.name} building={building} />
                ))}
            </div>
        </div>
    );
}

function BuildingsContainer() {
    const imageSize = useAtomValue(dynamicSizeAtom);
    const { categories, rootBuildings } = useAtomValue(pageContentAtom);

    return (
        <div style={{ "--imgsize": `${imageSize}px` } as CSSProperties}>
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
    const selectedThemes = useAtomValue(selectedThemesAtom);
    const searchTerm = useAtomValue(searchTermAtom);
    const { totalBuildingsFound } = useAtomValue(pageContentAtom);

    return (
        <div className="p-2 flex flex-col">
            {selectedThemes.size === 0 && (
                <article className="prose mx-auto prose-xl mt-5 pb-14">
                    <h1 className="text-4xl font-extrabold">
                        Welcome to the <em>unofficial</em> MineColonies Building Explorer!
                    </h1>
                    <p className="mt-4">
                        This is an <em>unofficial</em> site for browsing screenshots of the{" "}
                        <a className="text-blue-500" href="https://minecolonies.com/">
                            MineColonies
                        </a>{" "}
                        mod theme buildings. <b>Credits</b> for the buildings go to the theme authors listed
                        in the sidebar next to the theme name. I created this site to make it easy to visually
                        browse the buildings from different themes and categories at the same time.
                    </p>
                    <p className="mt-4">
                        To get started, select one or more themes/categories from the sidebar and start
                        exploring the buildings! You can also search for a building name, hut block, or
                        category—just select all the themes you want to search from first. You can see the
                        back of most buildings by clicking on the image.
                    </p>
                    <p className="mt-4 mb-0">
                        Some of the themes, categories, or buildings <strong>are missing or excluded</strong>{" "}
                        for reasons like:
                    </p>
                    <ul className="mt-0">
                        <li>I haven&#39;t used the theme in my own worlds yet.</li>
                        <li>The builds have been updated and I have not taken new screenshots.</li>
                        <li>
                            Some themes have a lot off little pieces that I decided not to include for now to
                            save space and time (mostly roads, mineshafts and some infrastructure).
                        </li>
                        <li>New buildings have been added, or I have forgotten some.</li>
                    </ul>
                    <p>
                        Send me some feedback if you notice changed or missing buildings! I&#39;ll add themes
                        here if people request them and I have time :)
                    </p>
                    <p>
                        Viewing buildings at different levels is not supported yet, but I might add it in the
                        future. Currently the screenshots are of the maximum level of the building.
                    </p>
                </article>
            )}

            {selectedThemes.size > 0 && totalBuildingsFound === 0 && (
                <article className="prose mx-auto prose-xl mt-5 text-center">
                    <h3>No buildings found</h3>
                    {searchTerm === "" ? (
                        <p>Try selecting more themes or categories</p>
                    ) : (
                        <p>Try a different search term</p>
                    )}
                </article>
            )}

            <BuildingsContainer />
        </div>
    );
}
