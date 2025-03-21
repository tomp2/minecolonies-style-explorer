import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { imageWidthAtom, loadableFavoriteBuildingsAtom, pageContentAtom } from "@/lib/state-atoms.ts";
import { type BuildingData } from "@/lib/theme-data.ts";
import { cn } from "@/lib/utils.ts";
import { BuildingCard } from "@/ui/building-card.tsx";
import { readCssColumns, sliderColumnsAtom, useContainerWidth } from "@/ui/image-size-slider.tsx";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAtomValue, useSetAtom } from "jotai";
import { AlertCircle, Link } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

    const sectionId = title.toLowerCase().replace(/[^\d>a-z]/g, "");

    function copyLinkToSection() {
        const url = new URL(window.location.href);
        url.hash = sectionId;
        const urlString = url.toString();
        window.history.replaceState({}, "", urlString);
        navigator.clipboard.writeText(urlString);
    }

    return (
        <div className={cn("p-2", className)}>
            <div className="group flex items-center gap-2 pb-4 pl-2">
                <h2 id={sectionId} className="text-2xl font-extrabold capitalize">
                    {title}
                </h2>
                <button
                    onClick={copyLinkToSection}
                    className="-m-2 p-2 opacity-0 transition-opacity group-hover:opacity-100"
                >
                    <Link className="size-5 stroke-[3]" />
                </button>
            </div>

            <div className="grid grid-cols-[repeat(var(--image-cols),_minmax(0,_1fr))] gap-2">
                {buildings.sort(sortBuildings).map(building => (
                    <BuildingCard key={building.path.join(",") + building.name} building={building} />
                ))}
            </div>
        </div>
    );
}

export function FavoritesSection() {
    const value = useAtomValue(loadableFavoriteBuildingsAtom);

    const [buildings, setBuildings] = useState<BuildingData[]>(value.state === "hasData" ? value.data : []);

    useEffect(() => {
        if (value.state === "hasData") {
            setBuildings(value.data);
        }
    }, [value]);

    if (value.state === "hasError") {
        return (
            <Alert className="mx-auto mt-10 w-fit shadow-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    An error occurred while loading the favorites!
                    <br />
                    Try refreshing the page.
                </AlertDescription>
            </Alert>
        );
    }

    if (value.state === "loading" && buildings.length === 0) {
        return (
            <Alert className="mx-auto mt-10 w-fit shadow-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Loading favorites</AlertTitle>
                <AlertDescription>Loading buildings from favorites...</AlertDescription>
            </Alert>
        );
    }

    if (buildings.length === 0) {
        return (
            <Alert className="mx-auto mt-10 w-fit shadow-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No favorites</AlertTitle>
                <AlertDescription>
                    You can add buildings to your favorites by clicking the heart icon on the building card.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="mb-20 grid grid-cols-[repeat(var(--image-cols),_minmax(0,_1fr))] gap-2 p-2">
            {buildings.sort(sortBuildings).map(building => (
                <BuildingCard
                    key={building.path.join(",") + building.name}
                    building={building}
                    isFavorite={true}
                />
            ))}
        </div>
    );
}

function BuildingsContainer() {
    const setImageWidthAtom = useSetAtom(imageWidthAtom);
    const containerWidth = useContainerWidth();
    const parentRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const cardHeight = useRef(350);

    const [content, contentError] = useAtomValue(pageContentAtom);

    const columnCount = useAtomValue(sliderColumnsAtom);

    useEffect(() => {
        if (!containerRef.current) return;

        const containerWidth = containerRef.current.clientWidth;
        const cardBorder = 1;
        const containerPadding = 8;
        const cardGap = 8;
        const cardPadding = 8;
        const cardDescriptionHeight = 80;
        const widthForImages =
            containerWidth -
            containerPadding * 2 -
            (columnCount - 1) * cardGap -
            columnCount * cardPadding * 2 -
            columnCount * cardBorder * 2;
        const calculatedImageWidth = widthForImages / columnCount;
        cardHeight.current = calculatedImageWidth + cardPadding * 2 + cardDescriptionHeight + cardBorder * 2;
        setImageWidthAtom(calculatedImageWidth);
    }, [containerWidth, columnCount]);

    const sections = content?.sections ?? [];
    const virtualizer = useVirtualizer({
        count: sections.length,
        getScrollElement: () => parentRef.current,
        estimateSize: i => {
            const section = sections[i];

            const columns = readCssColumns();
            const rowCount = Math.ceil(section.blueprints.length / columns);

            const sectionGap = (rowCount - 1) * 8;
            const sectionTitleHeight = 48;
            const sectionPadding = 2 * 8;

            return rowCount * cardHeight.current + sectionGap + sectionTitleHeight + sectionPadding;
        },
    });

    if (contentError) {
        return (
            <Alert variant="destructive" className="mx-auto mt-10 w-fit bg-card shadow-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    An error occurred while loading the buildings!
                    <br />
                    Try selecting different styles and check your internet connection.
                </AlertDescription>
            </Alert>
        );
    }

    const items = virtualizer.getVirtualItems();
    return (
        <div
            className="relative h-[calc(100vh-var(--h-navbar))] overflow-y-auto contain-strict"
            ref={parentRef}
        >
            <div
                className="relative mb-20 w-full"
                style={{
                    height: virtualizer.getTotalSize(),
                }}
            >
                <div
                    className="absolute left-0 top-0 w-full"
                    style={{ transform: `translateY(${items[0]?.start ?? 0}px)` }}
                    ref={containerRef}
                >
                    {items.map(virtualRow => (
                        <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            ref={virtualizer.measureElement}
                        >
                            <BuildingSection
                                title={sections[virtualRow.index].title}
                                buildings={sections[virtualRow.index].blueprints}
                                key={virtualRow.key + sections[virtualRow.index].title}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function PageContent() {
    const [content, error] = useAtomValue(pageContentAtom);
    if (error) {
        return (
            <div className="flex h-full grow flex-col justify-between">
                <Alert variant="destructive" className="mx-auto mt-10 w-fit bg-card shadow-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        An error occurred while loading the buildings!
                        <br />
                        Try selecting different styles and check your internet connection.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }
    if (content.totalBuildingsFound === 0) {
        return (
            <div className="flex h-full grow flex-col justify-between">
                <Alert className="mx-auto mt-10 w-fit bg-card shadow-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No buildings found</AlertTitle>
                    <AlertDescription>
                        Try selecting different styles and categories or check your search term.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return <BuildingsContainer />;
}
