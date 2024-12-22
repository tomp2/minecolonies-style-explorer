import type { CaptureOptions, EventName, Properties } from "posthog-js";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";

export function useCaptureEventOnce() {
    const [captured, setCaptured] = useState(false);
    const posthog = usePostHog();

    const captureEvent = (
        event_name: EventName,
        properties?: Properties | null,
        options?: CaptureOptions,
    ) => {
        if (captured) return;
        posthog.capture(event_name, properties, options);
        setCaptured(true);
    };

    return [captureEvent, captured] as const;
}
