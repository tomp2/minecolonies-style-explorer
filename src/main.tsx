import "./instrument";
import ErrorBoundary from "@/components/error-boundary.tsx";
import { Toaster } from "@/components/ui/sonner";
import "./index.css";
import { PostHogProvider } from "posthog-js/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { parseThemesFromUrlParams } from "@/lib/state-atoms.ts";

createRoot(document.querySelector("#root")!).render(
    <StrictMode>
        <ErrorBoundary>
            <PostHogProvider
                apiKey={import.meta.env.VITE_REACT_APP_PUBLIC_POSTHOG_KEY}
                options={{
                    api_host: import.meta.env.VITE_REACT_APP_PUBLIC_POSTHOG_HOST,
                    persistence: localStorage.getItem("persistent-identity") ? "localStorage" : "memory",
                    autocapture: false,
                    debug: import.meta.env.DEV,
                    loaded: function (posthog) {
                        const storageIdentity = localStorage.getItem("persistent-identity");
                        if (storageIdentity) {
                            posthog.identify(storageIdentity);
                        }

                        const initialUrlSearchParams = new URL(window.location.href).searchParams;
                        const initialStyles = parseThemesFromUrlParams(initialUrlSearchParams);
                        for (const style of initialStyles) {
                            posthog.capture("view_style", { style });
                        }
                    },
                }}
            >
                <App />
                <Toaster richColors />
            </PostHogProvider>
        </ErrorBoundary>
    </StrictMode>,
);
