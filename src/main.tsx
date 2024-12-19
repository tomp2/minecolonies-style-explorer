import { type PostHogConfig, type Properties } from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const customPropertyHandlers: Record<
    string,
    ((properties: Properties, event_name: string) => Properties) | null
> = {
    $ip: null,
    $os: null,
    $os_version: null,
    $timezone: null,
    $browser: null,
    $browser_version: null,
    $initial_browser: null,
    $initial_browser_version: null,
};

const options: Partial<PostHogConfig> = {
    api_host: import.meta.env.VITE_REACT_APP_PUBLIC_POSTHOG_HOST,
    persistence: "memory",
    disable_persistence: true,
    person_profiles: "never",
    rageclick: false,
    autocapture: false,
    capture_dead_clicks: false,
    sanitize_properties: function (properties, event) {
        for (const key in customPropertyHandlers) {
            const handler = customPropertyHandlers[key];
            if (handler) {
                properties = handler(properties, event);
            }
        }
        return properties;
    },
};

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <PostHogProvider apiKey={import.meta.env.VITE_REACT_APP_PUBLIC_POSTHOG_KEY} options={options}>
            <App />
        </PostHogProvider>
    </StrictMode>,
);
