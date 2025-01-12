import { Button } from "@/components/ui/button.tsx";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { expandedBuildingAtom } from "@/lib/state-atoms.ts";
import { BuildingData } from "@/lib/theme-data.ts";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

function BuildingImage({
    building,
    view,
    className,
}: {
    building: BuildingData;
    view: "front" | "back";
    className?: string;
}) {
    const level = building.json.levels || "";
    const imgSrc = ["minecolonies", ...building.path, building.name, `${level}${view}.jpg`].join("/");
    return (
        <img
            loading="lazy"
            src={imgSrc}
            alt={`${building.displayName} (${view})`}
            className={cn("rounded-sm", className)}
        />
    );
}

function ZoomableImage({
    building,
    view,
    className,
}: {
    building: BuildingData;
    view: "front" | "back";
    className?: string;
}) {
    return (
        <TransformWrapper>
            <TransformComponent>
                <BuildingImage building={building} view={view} className={className} />
            </TransformComponent>
        </TransformWrapper>
    );
}

function DialogImages({ expandedBuilding }: { expandedBuilding: BuildingData }) {
    if (!expandedBuilding.json.back) return <ZoomableImage building={expandedBuilding} view="front" />;

    return (
        <Tabs className="flex w-full flex-col items-center" defaultValue="front">
            <TabsList className="grid w-full grid-cols-2 border">
                <TabsTrigger value="front">Front</TabsTrigger>
                <TabsTrigger value="back">Back</TabsTrigger>
            </TabsList>
            <TabsContent value="front">
                <ZoomableImage building={expandedBuilding} view="front" />
            </TabsContent>
            <TabsContent value="back">
                <ZoomableImage building={expandedBuilding} view="back" />
            </TabsContent>
        </Tabs>
    );
}

export function ExpandImageDialog() {
    const posthog = usePostHog();
    const [expandedBuilding, setExpandedBuilding] = useAtom(expandedBuildingAtom);

    useEffect(() => {
        if (!expandedBuilding) return;
        posthog.capture("expand_building", {
            building: expandedBuilding.path.join("/") + "/" + expandedBuilding.name,
        });
    }, [expandedBuilding]);

    return (
        <Dialog
            open={expandedBuilding !== null}
            onOpenChange={open => {
                if (open) {
                    setExpandedBuilding(expandedBuilding);
                } else {
                    setExpandedBuilding(null);
                }
            }}
        >
            <DialogContent className="max-h-[90vh] max-w-[750px] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Building preview</DialogTitle>
                    <DialogDescription>
                        Zoom with pinch gesture or use the scroll wheel. Drag to pan.
                    </DialogDescription>
                </DialogHeader>
                {expandedBuilding ? (
                    <DialogImages expandedBuilding={expandedBuilding} />
                ) : (
                    <div>No building selected</div>
                )}
                <DialogFooter className="sm:justify-start">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" className="w-full border">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
