import { Button } from "@/components/ui/button.tsx";
import { useDelayedCaptureEvent } from "@/hooks/delayed-capture-event.ts";
import { useCaptureEventOnce } from "@/hooks/use-capture-event-once.ts";
import { expandedBuildingAtom, favoritesPathsWriteAtom } from "@/lib/state-atoms.ts";
import { BuildingData, themes } from "@/lib/theme-data.ts";
import { cn } from "@/lib/utils.ts";
import { decode } from "blurhash";
import { useAtom, useSetAtom } from "jotai";
import { Expand, Heart } from "lucide-react";
import * as React from "react";
import { useEffect, useRef, useState } from "react";

interface BlurhashCanvasProps extends React.ComponentPropsWithoutRef<"canvas"> {
    hash: string;
    height: number;
    width: number;
}

/**
 * A canvas element that displays a blurhash using the library's decode function.
 * @param hash The blurhash to decode.
 * @param height The canvas resolution in pixels. Can be smaller than the element.
 * @param width The canvas resolution in pixels. Can be smaller than the element.
 * @param className
 * @param props
 * @constructor
 */
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

/**
 * Two buttons that allow the user to switch between the front and back images of a building.
 * This could be made dynamic to support any number of images in the future if needed.
 * @param setView A function that sets the view to either "front" or "back".
 */
function ImageCountIndicator({ setView }: { setView: (view: "front" | "back") => void }) {
    return (
        <div className="absolute bottom-0 mb-1.5 space-x-1 opacity-70">
            <button
                type="button"
                aria-label="View front of building"
                className="size-2.5 rounded-full bg-gray-100 group-data-[view='back']/card:bg-gray-400"
                onClick={setView.bind(null, "front")}
            ></button>
            <button
                type="button"
                aria-label="View back of building"
                className="size-2.5 rounded-full bg-gray-400 group-data-[view='back']/card:bg-gray-100"
                onClick={setView.bind(null, "back")}
            ></button>
        </div>
    );
}

interface ImageButtonProps extends React.ComponentPropsWithoutRef<"div"> {
    enableImg?: boolean;
    building: BuildingData;
    view: "front" | "back";
}

/**
 * A clickable image button that displays a building image with a blurhash overlay
 * for smooth loading.
 * @param building The building data to display.
 * @param view The view of the building to display ("front" or "back").
 * @param enableImg Whether to display the image or not. This can be used to prevent
 * the back image from loading until it is needed.
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
        <div className={cn("inset-0 h-full w-full", className)} {...props}>
            {blurhash && (showBlurhash || error) && (
                <BlurhashCanvas
                    className={cn(
                        "absolute rounded-sm opacity-0 transition-opacity duration-100",
                        (loading || error) && "opacity-100",
                    )}
                    hash={blurhash}
                    width={25}
                    height={25}
                />
            )}
            {error ? (
                <div className="absolute flex h-full w-full items-center justify-center text-secondary">
                    Error loading {view} image
                </div>
            ) : (
                (enableImg === undefined || enableImg) && (
                    <img
                        loading="lazy"
                        src={imgSrc}
                        alt={`${buildingName} (${view})`}
                        className="size-full rounded-sm object-cover"
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

/**
 * A button that expands the building card to show the full image.
 * @param building The building data to display.
 * @param className
 */
function ExpandButton({ building, className }: { building: BuildingData; className?: string }) {
    const setExpandedBuilding = useSetAtom(expandedBuildingAtom);
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
                "group flex items-center justify-center hover:scale-105 hover:bg-transparent active:scale-95 [&_svg]:size-5",
                className,
            )}
            aria-label={`Expand ${building.displayName || building.name}`}
            onClick={() => {
                setExpandedBuilding(building);
            }}
        >
            <Expand className="fill-stone-200 text-stone-300" />
        </Button>
    );
}

/**
 * A building image with a front and back view that can be toggled by the user.
 * @param building The building data to display.
 */
function BuildingImage({ building }: { building: BuildingData }) {
    const [captureOnce] = useCaptureEventOnce();
    const [view, setView] = useState<"front" | "back">("front");
    const [mountBack, setMountBack] = useState(false);

    const buildingName = building.displayName || building.name;

    return (
        <div className="group/card relative flex aspect-square justify-center" data-view={view}>
            <button
                aria-label={`${view} view of ${buildingName}`}
                type="button"
                className="relative size-full rounded-sm focus-visible:ring-1 focus-visible:ring-ring"
                onClick={() => {
                    if (building.json.back) {
                        setView(view === "front" ? "back" : "front");
                        if (!mountBack) setMountBack(true);
                        captureOnce("toggle_building_view", { building: buildingName, view: view });
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
                    className="absolute group-data-[view='front']/card:hidden"
                    building={building}
                    view="back"
                    enableImg={mountBack}
                />
            </button>
            {building.json.back && <ImageCountIndicator setView={setView} />}
        </div>
    );
}

/**
 * A button that toggles a building as a favorite.
 * @param building The building data to favorite.
 * @param className
 */
function FavoriteButton({ building, className }: { building: BuildingData; className?: string }) {
    const delayedCapture = useDelayedCaptureEvent();
    const [favorites, setFavorites] = useAtom(favoritesPathsWriteAtom);

    const path = building.path.join(">") + ">" + building.name;
    const isFavorite = favorites.has(path);
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            data-favorite={isFavorite}
            aria-label={`Toggle ${building.displayName || building.name} as a favorite`}
            className={cn(
                "group hover:scale-105 hover:bg-transparent active:scale-95 [&_svg]:size-6",
                className,
            )}
            onClick={() => {
                const isFavorite = setFavorites(path);
                delayedCapture(10_000, "toggle_favorite", { building: path, isFavorite });
            }}
        >
            <Heart
                size={16}
                className="fill-stone-200 text-stone-300 hover:drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)] group-data-[favorite=true]:fill-rose-300 group-data-[favorite=true]:text-rose-500 dark:fill-stone-500 dark:text-stone-600"
            />
        </Button>
    );
}

/**
 * A building name that displays the building's display name if it exists, otherwise
 * it displays the building's name.
 * @param building The building data to display.
 */
function BuildingName({ building }: { building: BuildingData }) {
    if (building.json.displayName) return building.json.displayName;
    if (!building.displayName) return building.name;

    const displayNameLower = building.displayName.toLowerCase().replace(" ", "");
    const rawNameLower = building.name.toLowerCase();

    if (displayNameLower.includes(rawNameLower)) return building.displayName;
    return (
        <h2 className="font-semibold">
            {building.displayName} ({building.name})
        </h2>
    );
}

/** A card that displays a building's image, name, path, and size. */
export function BuildingCard({ building }: { building: BuildingData }) {
    const theme = themes.get(building.path[0])!;
    const pathString = `${theme.displayName}/${building.path.slice(1).join("/")}`;

    return (
        <div className="group relative flex w-full flex-col overflow-x-clip rounded-lg border bg-card p-2 shadow">
            <BuildingImage building={building} />
            <ExpandButton
                className="absolute right-2 top-2 transition-opacity duration-75 focus:opacity-100 group-hover:opacity-100 md:opacity-0"
                building={building}
            />
            <div className="relative flex grow flex-col">
                <BuildingName building={building} />
                <p className="text-xs capitalize text-muted-foreground">{pathString}</p>
                <p className="min-h-6 text-xs text-muted-foreground">
                    {building.json.size === undefined ? (
                        <span>Unknown size</span>
                    ) : (
                        <span>
                            {building.json.size[0]}x{building.json.size[1]}x{building.json.size[2]}
                        </span>
                    )}
                </p>
                <FavoriteButton className="absolute bottom-0 right-0 -mb-1 -mr-1" building={building} />
            </div>
        </div>
    );
}
