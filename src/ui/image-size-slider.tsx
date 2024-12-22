import { Slider } from "@/components/ui/slider.tsx";
import { useDelayedCaptureEvent } from "@/hooks/delayed-capture-event.ts";
import { dynamicSizeAtom } from "@/lib/state-atoms.ts";
import { useAtom } from "jotai/index";

export function ImageSizeSlider() {
    const delayedCapture = useDelayedCaptureEvent();
    const [dynamicSize, setDynamicSize] = useAtom(dynamicSizeAtom);

    return (
        <Slider
            defaultValue={[dynamicSize]}
            value={[dynamicSize]}
            aria-label="Image size"
            min={200}
            max={800}
            step={50}
            onValueChange={([value]) => {
                setDynamicSize(value);
                delayedCapture(10_000, "image_size_changed", { size: value });
            }}
        />
    );
}
