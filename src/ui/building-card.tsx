import { Button } from "@/components/ui/button.tsx";
import { favoritesPathsWriteAtom } from "@/lib/state-atoms.ts";
import { BuildingData } from "@/lib/theme-data.ts";
import { cn } from "@/lib/utils.ts";
import { decode } from "blurhash";
import { useAtom } from "jotai";
import { Heart } from "lucide-react";
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

function BuildingImage({ building }: { building: BuildingData }) {
    const [view, setView] = useState<"front" | "back">("front");
    const [mountBack, setMountBack] = useState(false);

    const buildingName = building.displayName || building.name;

    return (
        <div className="group/card relative flex justify-center" data-view={view}>
            <button
                aria-label={`${view} view of ${buildingName}`}
                type="button"
                className="relative size-[var(--imgsize)] rounded-sm focus-visible:ring-1 focus-visible:ring-ring"
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
                    className="absolute group-data-[view='front']/card:hidden"
                    building={building}
                    view="back"
                    enableImg={mountBack}
                />
            </button>
            {building.json.back && <ImageCountIndicator setView={setView} />}
            <FavoriteButton className="absolute right-2 top-2" building={building} />
        </div>
    );
}

function FavoriteButton({ building, className }: { building: BuildingData; className?: string }) {
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
            onClick={() => setFavorites(path)}
        >
            <Heart
                size={16}
                className="fill-stone-400 text-secondary drop-shadow-sm group-data-[favorite=true]:fill-rose-500"
            />
        </Button>
    );
}

export function BuildingCard({ building }: { building: BuildingData }) {
    const buildingName = building.json.displayName || building.displayName || building.name;
    return (
        <div className="w-[calc(var(--imgsize)+18px)] rounded-lg border bg-card p-2 text-card-foreground shadow">
            <BuildingImage building={building} />
            <div className="p-1.5">
                <h2 className="font-semibold">
                    {buildingName}
                    {!building.json.displayName && buildingName !== building.name && ` (${building.name})`}
                </h2>
                <p className="text-sm capitalize text-muted-foreground">{building.path.join(" > ")}</p>
                {/*{building.json.levels !== false && (*/}
                {/*    <p className="text-sm text-muted-foreground">Levels: {building.json.levels}</p>*/}
                {/*)}*/}
            </div>
        </div>
    );
}
