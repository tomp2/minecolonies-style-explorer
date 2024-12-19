import { pageContentAtom, searchTermAtom, selectedThemesAtom } from "@/lib/state-atoms.ts";
import { BuildingData } from "@/lib/theme-data.ts";
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
                    <BuildingCard key={building.path.join() + building.name} building={building} />
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
        <main className="flex flex-col p-4 bg-gray-100">
            {selectedThemes.length === 0 && (
                <article className="prose w-fit mx-auto prose-xl">
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

            <div className="grow h-full min-h-6" />
            <div className="border-t bg-card/50 h-10 shrink-0 grow-0 -mx-4 -mb-4 flex px-4 justify-end">
                <a
                    href="https://github.com/tomp2/minecolonies-building-explorer"
                    target="_blank"
                    className="inline-flex items-center font-semibold gap-1"
                    rel="noreferrer"
                    aria-label="View source on GitHub"
                >
                    <svg className="size-5" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <title>GitHub</title>
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                    </svg>
                    Source
                </a>
            </div>
        </main>
    );
}
