import { type PostHogConfig } from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const options: Partial<PostHogConfig> = {
    api_host: import.meta.env.REACT_APP_PUBLIC_POSTHOG_HOST,
    persistence: "memory",
};

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <PostHogProvider apiKey={import.meta.env.VITE_REACT_APP_PUBLIC_POSTHOG_KEY} options={options}>
            <App />
        </PostHogProvider>
    </StrictMode>,
);
