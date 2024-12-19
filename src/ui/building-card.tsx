import { dynamicSizeAtom } from "@/lib/state-atoms.ts";
import { BuildingData } from "@/lib/theme-data.ts";
import { cn } from "@/lib/utils.ts";
import { decode } from "blurhash";
import { useAtomValue } from "jotai";
import { usePostHog } from "posthog-js/react";
import * as React from "react";
import { useEffect, useRef, useState } from "react";

export interface BlurhashCanvasProps extends React.ComponentPropsWithoutRef<"canvas"> {
    hash: string;
    height: number;
    width: number;
}

function BlurhashCanvas({ hash, height, width, className, ...props }: BlurhashCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;
        const imageData = ctx.createImageData(width, height);
        imageData.data.set(decode(hash, width, height));
        ctx.putImageData(imageData, 0, 0);
    }, [hash, height, width]);

    return (
        <canvas
            {...props}
            className={cn("w-full h-full", className)}
            height={height}
            width={width}
            ref={canvasRef}
        />
    );
}

function ImageCountIndicator({
    view,
    setView,
}: {
    view: "front" | "back";
    setView: (view: "front" | "back") => void;
}) {
    return (
        <div className="absolute bottom-0 opacity-70 flex gap-1 items-center justify-center w-fit mx-auto mb-1.5">
            <button
                type="button"
                aria-label="View front of building"
                className={cn("size-2.5 rounded-full", view === "front" ? "bg-gray-100" : "bg-gray-400")}
                onClick={setView.bind(null, "front")}
            ></button>
            <button
                type="button"
                aria-label="View back of building"
                className={cn("size-2.5 rounded-full", view === "front" ? "bg-gray-400" : "bg-gray-100")}
                onClick={setView.bind(null, "back")}
            ></button>
        </div>
    );
}

export interface ImageButtonProps extends React.ComponentPropsWithoutRef<"div"> {
    enableImg?: boolean;
    building: BuildingData;
    view: "front" | "back";
}

/**
 * @param building
 * @param view
 * @param enableImg can prevent the image from loading before it is needed.
 * @param props
 */
function ImageButton({ building, view, enableImg, ...props }: ImageButtonProps) {
    const dynamicSize = useAtomValue(dynamicSizeAtom);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showBlurhash, setShowBlurhash] = useState(true);

    const buildingName = building.displayName || building.name;
    const blurhash = building.json.blur[view === "front" ? 0 : 1];
    const level = building.json.levels || "";
    const imgSrc = ["minecolonies", ...building.path, building.name, `${level}${view}.jpg`].join("/");

    return (
        <div className={cn("absolute", props.className)} {...props}>
            {showBlurhash && blurhash && (
                <BlurhashCanvas
                    className={cn(
                        "absolute opacity-0 transition-opacity duration-100",
                        loading && "opacity-100",
                        error && "opacity-0",
                    )}
                    hash={blurhash}
                    width={25}
                    height={25}
                />
            )}
            {error ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    Error loading {view} image
                </div>
            ) : (
                (enableImg === undefined || enableImg) && (
                    <img
                        src={imgSrc}
                        alt={`${buildingName} (${view})`}
                        className={cn("object-cover rounded-sm", dynamicSize)}
                        onError={() => setError(true)}
                        onLoad={() => {
                            setLoading(false);
                            setTimeout(() => setShowBlurhash(false), 150);
                        }}
                    />
                )
            )}
        </div>
    );
}

function BuildingImage({ building }: { building: BuildingData }) {
    const clicked = useRef(false);
    const backPreloadStatus = useRef<boolean>(false);
    const dynamicSize = useAtomValue(dynamicSizeAtom);
    const [view, setView] = useState<"front" | "back">("front");
    const [mountBack, setMountBack] = useState(false);
    const posthog = usePostHog();

    function preloadBack() {
        if (!backPreloadStatus.current && building.json.back) {
            setMountBack(true);
            const img = new Image();
            const level = building.json.levels || "";
            img.src = ["minecolonies", ...building.path, building.name, `${level}back.jpg`].join("/");
            backPreloadStatus.current = true;
        }
    }

    const buildingName = building.displayName || building.name;

    return (
        <button
            aria-label={`${view} view of ${buildingName}`}
            type="button"
            className={cn(
                "focus-visible:ring-1 focus-visible:ring-ring rounded-sm group aspect-square relative flex items-center justify-center",
                dynamicSize,
            )}
            data-view={view}
            onClick={() => {
                if (!building.json.back) return;
                if (!mountBack) setMountBack(true);
                setView(view === "front" ? "back" : "front");
                if (!clicked.current) {
                    clicked.current = true;
                    posthog.capture("building_view_back", {
                        theme: building.path[0],
                        name: building.name,
                    });
                }
            }}
        >
            <ImageButton
                className="group-data-[view='back']:hidden absolute"
                building={building}
                view="front"
                onMouseEnter={preloadBack}
                onClick={() => building.json.back && setView("back") && setMountBack(true)}
            />
            <ImageButton
                className="group-data-[view='front']:hidden absolute"
                building={building}
                view="back"
                enableImg={mountBack}
                onClick={() => setView("front")}
            />
            {building.json.back && <ImageCountIndicator view={view} setView={setView} />}
        </button>
    );
}

export function BuildingCard({ building }: { building: BuildingData }) {
    const buildingName = building.displayName || building.name;

    return (
        <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow p-2">
            <BuildingImage building={building} />
            <div className="p-4 border-t">
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
