import { useSidebar } from "@/components/ui/sidebar.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import { useDelayedCaptureEvent } from "@/hooks/delayed-capture-event.ts";
import { useIsMobile } from "@/hooks/use-mobile.tsx";
import useWindowWidth from "@/hooks/use-window-width.ts";
import { atom, useAtom } from "jotai/index";
import { useEffect, useState } from "react";

const defaultColumnSize = 350;
const minColumnSize = 160;
const sidebarWidth = 272;

function setCssColumns(value: number) {
    document.documentElement.style.setProperty("--image-cols", value.toString());
}

function writeConfig(columns: number, containerWidth: number) {
    localStorage.setItem("imgcols", columns.toString());
    localStorage.setItem("containerSize", containerWidth.toString());
}

function readConfig() {
    const storedColumns = localStorage.getItem("imgcols");
    const storedContainerWidth = localStorage.getItem("containerSize");
    if (!storedColumns || !storedContainerWidth) return null;
    return {
        columns: Number.parseInt(storedColumns),
        containerWidth: Number.parseInt(storedContainerWidth),
    };
}

const initialStoredConfig = readConfig();

let containerWidth = window.innerWidth;
const isMobile = window.innerWidth < 768;
if (!isMobile) containerWidth -= sidebarWidth;
let initialColumns = Math.floor(containerWidth / defaultColumnSize);
if (initialStoredConfig) {
    initialColumns = Math.floor(
        (initialStoredConfig.columns * containerWidth) / initialStoredConfig.containerWidth,
    );
}
setCssColumns(initialColumns);

export const sliderColumnsAtom = atom<number>(initialColumns);

export function readCssColumns() {
    const value = getComputedStyle(document.documentElement).getPropertyValue("--image-cols");
    const number = Number.parseInt(value);
    if (Number.isNaN(number)) return initialColumns;
    return number;
}

export function useContainerWidth() {
    const windowWidth = useWindowWidth();
    const sidebar = useSidebar();
    const isMobile = useIsMobile();
    let containerWidth = windowWidth;
    if (sidebar.open && !isMobile) containerWidth -= sidebarWidth;
    return containerWidth;
}

export function ImageSizeSlider() {
    const { capture } = useDelayedCaptureEvent();
    const containerWidth = useContainerWidth();
    const [sliderColumns, setSliderColumns] = useAtom(sliderColumnsAtom);
    const [storedColumns, setStoredColumns] = useState(initialStoredConfig?.columns);
    const [storedContainerWidth, setStoredContainerWidth] = useState(initialStoredConfig?.containerWidth);

    const maxColumns = Math.floor(containerWidth / minColumnSize);

    function sliderColumnsChanged(columns: number) {
        columns = Math.min(columns, maxColumns);
        setSliderColumns(columns);
        setCssColumns(columns);
        writeConfig(columns, containerWidth);
        setStoredColumns(columns);
        setStoredContainerWidth(containerWidth);
        capture(10_000, "image_cols_changed_v2", {
            columns,
            containerWidth,
            imgSize: Math.floor(containerWidth / columns),
        });
    }

    useEffect(() => {
        if (storedColumns && storedContainerWidth) {
            const columns = Math.floor((storedColumns * containerWidth) / storedContainerWidth);
            setCssColumns(columns);
            setSliderColumns(columns);
        }
    }, [containerWidth]);

    return (
        <div className="px-2">
            <Slider
                value={[sliderColumns]}
                aria-label="Number of columns for images"
                min={1}
                max={maxColumns}
                step={1}
                onValueChange={([value]) => sliderColumnsChanged(value)}
            />
        </div>
    );
}
