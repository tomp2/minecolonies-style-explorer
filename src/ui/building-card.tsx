import { dynamicSizeAtom } from "@/lib/state-atoms.ts";
import { BuildingData, type Theme } from "@/lib/theme-data.ts";
import { cn } from "@/lib/utils.ts";
import { useAtomValue } from "jotai";
import * as React from "react";

interface BuildingCardProps {
    theme: Theme;
    building: BuildingData;
}

function ImageCountIndicator({
    view,
    viewFront,
    viewBack,
}: {
    view: "front" | "back";
    viewFront: () => void;
    viewBack: () => void;
}) {
    return (
        <div className="absolute bottom-0 opacity-70 flex gap-1 items-center justify-center w-full mb-1.5">
            <button
                type="button"
                aria-label="View front of building"
                className={cn("size-2.5 rounded-full", view === "front" ? "bg-gray-100" : "bg-gray-400")}
                onClick={viewFront}
            ></button>
            <button
                type="button"
                aria-label="View back of building"
                className={cn("size-2.5 rounded-full", view === "front" ? "bg-gray-400" : "bg-gray-100")}
                onClick={viewBack}
            ></button>
        </div>
    );
}

function BuildingImage({ building, theme }: BuildingCardProps) {
    const dynamicSize = useAtomValue(dynamicSizeAtom);

    const [view, setView] = React.useState<"front" | "back">("front");
    const [error, setError] = React.useState(false);

    if (error) {
        return (
            <div className={cn("aspect-square flex items-center justify-center border-b", dynamicSize)}>
                <div className="text-muted-foreground">
                    {error ? "Error loading image" : "No image available"}
                </div>
            </div>
        );
    }

    const level = building.json.levels === false ? "" : building.json.levels;
    const buildingName = building.displayName || building.name;

    const imgSrc = ["minecolonies", ...building.path, building.name, `${level}${view}.jpg`].join("/");

    return (
        <div className={cn("aspect-square relative flex items-center justify-center border-b", dynamicSize)}>
            <button
                disabled={!building.json.back || error}
                aria-label={`View ${buildingName} (${view}) from ${theme.displayName} theme`}
                onClick={() => {
                    if (building.json.back) setView(view === "front" ? "back" : "front");
                }}
            >
                <img
                    src={imgSrc}
                    alt={`${buildingName} (${view}) from ${theme.displayName} theme`}
                    className={cn("object-cover", dynamicSize)}
                    onError={() => setError(true)}
                />
            </button>
            {building.json.back && (
                <ImageCountIndicator
                    view={view}
                    viewFront={() => setView("front")}
                    viewBack={() => setView("back")}
                />
            )}
        </div>
    );
}

export function BuildingCard({ theme, building }: BuildingCardProps) {
    const buildingName = building.displayName || building.name;

    return (
        <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow">
            <BuildingImage building={building} theme={theme} />
            <div className="p-4">
                <h2 className="font-semibold">
                    {buildingName}
                    {buildingName !== building.name && ` (${building.name})`}
                </h2>
                <p className="text-sm text-muted-foreground capitalize">{building.path.join(" > ")}</p>
                {building.json.levels !== false && (
                    <p className="text-sm text-muted-foreground">Levels: {building.json.levels}</p>
                )}
            </div>
        </div>
    );
}
