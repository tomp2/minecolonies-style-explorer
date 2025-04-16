import ErrorBoundary from "@/components/error-boundary.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar.tsx";
import { AppTabs } from "@/ui/app-tabs.tsx";
import { ExpandImageDialog } from "@/ui/expanded-image-dialog.tsx";
import { HiddenDialog } from "@/ui/hidden-dialog.tsx";
import { FullSidebar } from "@/ui/sidebar.tsx";
import { useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { CaptureResult } from "posthog-js";

function App() {
    const utmParamsCleared = useRef(false);
    const posthog = usePostHog();

    useEffect(() => {
        posthog.on("eventCaptured", (event: CaptureResult) => {
            if (event.event === "$pageview" && !utmParamsCleared.current) {
                utmParamsCleared.current = true;
                const urlParams = new URLSearchParams(window.location.search);
                [
                    "utm_source",
                    "utm_medium",
                    "utm_campaign",
                    "utm_content",
                    "utm_term",
                    "hidden",
                    "ttclid",
                    "igshid",
                    "mc_cid",
                    "la_fat_id",
                    "twclid",
                    "msclkid",
                    "fbclid",
                    "gbraid",
                    "wbraid",
                    "dclid",
                    "gclsrc",
                    "gad_source",
                    "gclid",
                ].forEach(param => {
                    urlParams.delete(param);
                });
                const url =
                    window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : "");
                window.history.replaceState({}, document.title, url);
            }
        });
    }, []);

    return (
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <HiddenDialog />
            <ExpandImageDialog />
            <SidebarProvider>
                <div className="flex w-full">
                    <FullSidebar />
                    <SidebarInset className="w-full overflow-clip bg-gray-100 dark:bg-black">
                        <ErrorBoundary>
                            <AppTabs />
                        </ErrorBoundary>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </ThemeProvider>
    );
}

export default App;
