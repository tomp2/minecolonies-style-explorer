import { Slider } from "@/components/ui/slider.tsx";
import { dynamicSizeAtom } from "@/lib/state-atoms.ts";
import { useAtom } from "jotai/index";

export function ImageSizeSlider() {
    const [dynamicSize, setDynamicSize] = useAtom(dynamicSizeAtom);

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
            onValueChange={([value]) => setDynamicSize(sliderValues[value])}
        />
    );
}
