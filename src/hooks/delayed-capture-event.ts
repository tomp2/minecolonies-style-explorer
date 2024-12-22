import { type CaptureOptions, type EventName, type Properties } from "posthog-js";
import { usePostHog } from "posthog-js/react";
import { useRef } from "react";

export function useDelayedCaptureEvent() {
    const posthog = usePostHog();
    const sendEventTimeoutId = useRef<NodeJS.Timeout | null>(null);

    return (
        delay: number,
        event_name: EventName,
        properties?: Properties | null,
        options?: CaptureOptions,
    ) => {
        if (sendEventTimeoutId.current) clearTimeout(sendEventTimeoutId.current);
        sendEventTimeoutId.current = setTimeout(() => {
            posthog.capture(event_name, properties, options);
        }, delay);
    };
}
