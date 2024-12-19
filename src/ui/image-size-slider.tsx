import { Slider } from "@/components/ui/slider.tsx";
import { dynamicSizeAtom } from "@/lib/state-atoms.ts";
import { useAtom } from "jotai/index";
import { usePostHog } from "posthog-js/react";
import { useRef } from "react";

export function ImageSizeSlider() {
    const posthog = usePostHog();
    const [dynamicSize, setDynamicSize] = useAtom(dynamicSizeAtom);
    const sendEventTimeoutId = useRef<NodeJS.Timeout | null>(null);

    const sliderValues = [
        "size-[300px]",
        "size-[350px]",
        "size-[400px]",
        "size-[450px]",
        "size-[500px]",
        "size-[600px]",
        "size-[700px]",
        "size-[800px]",
    ];
    return (
        <Slider
            defaultValue={[sliderValues.indexOf(dynamicSize)]}
            aria-label="Image size"
            min={0}
            max={sliderValues.length - 1}
            step={1}
            onValueChange={([value]) => {
                setDynamicSize(sliderValues[value]);
                if (sendEventTimeoutId.current) clearTimeout(sendEventTimeoutId.current);
                sendEventTimeoutId.current = setTimeout(() => {
                    posthog.capture("image_size_changed", { size: parseInt(dynamicSize.slice(6, -3)) });
                }, 10000);
            }}
        />
    );
}
