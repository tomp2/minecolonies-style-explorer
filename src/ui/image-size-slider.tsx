import { Slider } from "@/components/ui/slider.tsx";
import { dynamicSizeAtom } from "@/lib/state-atoms.ts";
import { useAtom } from "jotai/index";
import { usePostHog } from "posthog-js/react";
import { useRef } from "react";

export function ImageSizeSlider() {
    const posthog = usePostHog();
    const [dynamicSize, setDynamicSize] = useAtom(dynamicSizeAtom);
    const sendEventTimeoutId = useRef<NodeJS.Timeout | null>(null);

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
                if (sendEventTimeoutId.current) clearTimeout(sendEventTimeoutId.current);
                sendEventTimeoutId.current = setTimeout(() => {
                    posthog.capture("image_size_changed", { size: value });
                }, 10000);
            }}
        />
    );
}
