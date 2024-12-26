import { Slider } from "@/components/ui/slider.tsx";
import { useDelayedCaptureEvent } from "@/hooks/delayed-capture-event.ts";

if (localStorage.getItem("imgsize") !== null) {
    localStorage.removeItem("imgsize");
}
const storedValue = localStorage.getItem("imgcols");
const defaultImgSize = 350;
const defaultColumns = Math.floor(window.innerWidth / defaultImgSize);

const initialCols = storedValue ? Number.parseInt(storedValue) : defaultColumns;
document.documentElement.style.setProperty("--image-cols", initialCols.toString());

export function ImageSizeSlider() {
    const delayedCapture = useDelayedCaptureEvent();

    return (
        <div className="px-2">
            <Slider
                defaultValue={[initialCols]}
                aria-label="Number of columns for images"
                min={1}
                max={10}
                step={1}
                onValueChange={([value]) => {
                    localStorage.setItem("imgcols", value.toString());
                    document.documentElement.style.setProperty("--image-cols", value.toString());
                    delayedCapture(10_000, "image_cols_changed", { size: value });
                }}
            />
        </div>
    );
}
