import { BuildingData } from "@/lib/theme-data.ts";
import { cn } from "@/lib/utils.ts";
import { decode } from "blurhash";
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
            ref={canvasRef}
            className={cn("size-full", className)}
            height={height}
            width={width}
            {...props}
        />
    );
}

function ImageCountIndicator({ setView }: { setView: (view: "front" | "back") => void }) {
    return (
        <div className="absolute bottom-0 opacity-70 space-x-1 mb-1.5">
            <button
                type="button"
                aria-label="View front of building"
                className="size-2.5 rounded-full bg-gray-100 group-data-[view='back']:bg-gray-400"
                onClick={setView.bind(null, "front")}
            ></button>
            <button
                type="button"
                aria-label="View back of building"
                className="size-2.5 rounded-full bg-gray-400 group-data-[view='back']:bg-gray-100"
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
 * @param className
 * @param props
 */
function ImageButton({ building, view, enableImg, className, ...props }: ImageButtonProps) {
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showBlurhash, setShowBlurhash] = useState(true);

    const buildingName = building.displayName || building.name;
    const blurhash = building.json.blur[view === "front" ? 0 : 1];
    const level = building.json.levels || "";
    const imgSrc = ["minecolonies", ...building.path, building.name, `${level}${view}.jpg`].join("/");

    return (
        <div className={cn("w-full h-full inset-0", className)} {...props}>
            {blurhash && (showBlurhash || error) && (
                <BlurhashCanvas
                    className={cn(
                        "absolute opacity-0 transition-opacity duration-100 rounded-sm",
                        (loading || error) && "opacity-100",
                    )}
                    hash={blurhash}
                    width={25}
                    height={25}
                />
            )}
            {error ? (
                <div className="absolute w-full h-full flex items-center justify-center text-secondary">
                    Error loading {view} image
                </div>
            ) : (
                (enableImg === undefined || enableImg) && (
                    <img
                        loading="lazy"
                        src={imgSrc}
                        alt={`${buildingName} (${view})`}
                        className="object-cover size-full rounded-sm"
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
    const [view, setView] = useState<"front" | "back">("front");
    const [mountBack, setMountBack] = useState(false);

    const buildingName = building.displayName || building.name;

    return (
        <div className="relative flex justify-center group" data-view={view}>
            <button
                aria-label={`${view} view of ${buildingName}`}
                type="button"
                className="size-[var(--imgsize)] focus-visible:ring-1 focus-visible:ring-ring rounded-sm relative"
                onClick={() => {
                    if (building.json.back) {
                        setView(view === "front" ? "back" : "front");
                        if (!mountBack) setMountBack(true);
                    }
                }}
            >
                <ImageButton
                    className="absolute"
                    building={building}
                    view="front"
                    onMouseEnter={() => !mountBack && building.json.back && setMountBack(true)}
                />
                <ImageButton
                    className="group-data-[view='front']:hidden absolute"
                    building={building}
                    view="back"
                    enableImg={mountBack}
                />
            </button>
            {building.json.back && <ImageCountIndicator setView={setView} />}
        </div>
    );
}

export function BuildingCard({ building }: { building: BuildingData }) {
    const buildingName = building.displayName || building.name;
    return (
        <div className="w-[calc(var(--imgsize)+18px)] rounded-lg border bg-card text-card-foreground shadow p-2">
            <BuildingImage building={building} />
            <div className="p-1.5">
                <h2 className="font-semibold">
                    {buildingName}
                    {buildingName !== building.name && ` (${building.name})`}
                </h2>
                <p className="text-sm text-muted-foreground capitalize">{building.path.join(" > ")}</p>
                {/*{building.json.levels !== false && (*/}
                {/*    <p className="text-sm text-muted-foreground">Levels: {building.json.levels}</p>*/}
                {/*)}*/}
            </div>
        </div>
    );
}
